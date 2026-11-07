const BACKUP_FORMAT = 'pausa-backup';
const BACKUP_VERSION = 1;

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const validateStringArray = (value, fieldName) => {
  assert(Array.isArray(value), `${fieldName} debe ser una lista.`);
  value.forEach(item => {
    assert(typeof item === 'string' && item.trim().length > 0, `${fieldName} contiene un valor inválido.`);
  });
};

export const buildBackupPayload = (snapshot, appVersion, exportedAt = new Date().toISOString()) => ({
  format: BACKUP_FORMAT,
  formatVersion: BACKUP_VERSION,
  exportedAt,
  appVersion,
  entries: snapshot.entries,
  tags: snapshot.tags,
  blockedTags: snapshot.blockedTags,
  notificationSettings: snapshot.notificationSettings,
});

export const serializeBackup = backup => JSON.stringify(backup, null, 2);

export const parseAndValidateBackup = rawContent => {
  let backup;

  try {
    backup = JSON.parse(rawContent);
  } catch {
    throw new Error('El archivo no contiene un JSON válido.');
  }

  assert(isPlainObject(backup), 'El respaldo debe ser un objeto JSON.');
  assert(backup.format === BACKUP_FORMAT, 'El archivo no es un respaldo de Pausa.');
  assert(backup.formatVersion === BACKUP_VERSION, 'La versión del respaldo no es compatible.');
  assert(typeof backup.exportedAt === 'string', 'El respaldo no tiene una fecha válida.');
  assert(typeof backup.appVersion === 'string', 'El respaldo no tiene versión de aplicación.');
  assert(Array.isArray(backup.entries), 'El respaldo no contiene entradas.');
  validateStringArray(backup.tags, 'tags');
  validateStringArray(backup.blockedTags, 'blockedTags');
  assert(backup.notificationSettings === null || backup.notificationSettings === undefined || isPlainObject(backup.notificationSettings), 'La configuración de notificaciones es inválida.');
  if (backup.notificationSettings) {
    assert(Number.isInteger(backup.notificationSettings.timeMinutes) && backup.notificationSettings.timeMinutes >= 0 && backup.notificationSettings.timeMinutes <= 1439, 'La hora del recordatorio es inválida.');
    assert(typeof backup.notificationSettings.enabled === 'boolean', 'El estado del recordatorio es inválido.');
  }

  backup.entries.forEach((entry, index) => {
    assert(isPlainObject(entry), `La entrada ${index + 1} es inválida.`);
    assert(typeof entry.emotion === 'string' && entry.emotion.trim().length > 0, `La entrada ${index + 1} no tiene emoción.`);
    assert(entry.intensity === null || (Number.isInteger(entry.intensity) && entry.intensity >= 1 && entry.intensity <= 10), `La intensidad de la entrada ${index + 1} es inválida.`);
    assert(entry.note === null || typeof entry.note === 'string', `La nota de la entrada ${index + 1} es inválida.`);
    assert(Number.isInteger(entry.dateMs) && entry.dateMs >= 0, `La fecha de la entrada ${index + 1} es inválida.`);
    validateStringArray(entry.tags, `tags de la entrada ${index + 1}`);
  });

  return {
    ...backup,
    notificationSettings: backup.notificationSettings ?? null,
  };
};