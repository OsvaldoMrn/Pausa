import * as SQLite from 'expo-sqlite';
import { extractTags } from '../utils/tagUtils';

const db = SQLite.openDatabaseSync('pausa.db');

export const initDatabase = () => {
  try {
    db.withTransactionSync(() => {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          emotion TEXT NOT NULL,
          intensity INTEGER,
          note TEXT,
          date INTEGER NOT NULL
        );
      `);

      db.execSync(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        );
      `);

      db.execSync(`
        CREATE TABLE IF NOT EXISTS entry_tags (
          entry_id INTEGER NOT NULL,
          tag_id INTEGER NOT NULL,
          FOREIGN KEY (entry_id) REFERENCES entries (id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
          PRIMARY KEY (entry_id, tag_id)
        );
      `);

      db.execSync(`
        CREATE TABLE IF NOT EXISTS blocked_tags (
          word TEXT PRIMARY KEY
        );
      `);

      db.execSync(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          time_ms INTEGER NOT NULL,  -- Guardamos la hora en milisegundos (timestamp)
          enabled INTEGER DEFAULT 1, -- 1 = Prendido, 0 = Apagado
          notification_id TEXT       -- El ID que nos devuelve Expo/Android
        );
      `);
    });

    console.log('Base de datos inicializada correctamente (bl).');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
};


export const blockTag = (tagName) => {
  try {
    db.runSync(`INSERT OR IGNORE INTO blocked_tags (word) VALUES (?)`, [tagName.toLowerCase()]);
    console.log(`Tag bloqueado: ${tagName}`);
    return true;
  } catch (error) {
    console.error('Error al bloquear tag:', error);
    return false;
  }
};

export const unblockTag = (tagName) => {
  try {
    db.runSync(`DELETE FROM blocked_tags WHERE word = ?`, [tagName.toLowerCase()]);
    console.log(`Tag desbloqueado: ${tagName}`);
    return true;
  } catch (error) {
    console.error('Error al desbloquear tag:', error);
    return false;
  }
};

const getBlockedTagsSet = () => {
  try {
    const rows = db.getAllSync(`SELECT word FROM blocked_tags`);
    return new Set(rows.map(r => r.word));
  } catch (error) {
    return new Set();
  }
};

export const addEntry = (emotion, intensity, note, date) => {
  try {
    const result = db.runSync(
      `INSERT INTO entries (emotion, intensity, note, date) VALUES (?, ?, ?, ?)`,
      [emotion, intensity || null, note || null, date]
    );
    const entryId = result.lastInsertRowId;

    if (note) {
      const blockedSet = getBlockedTagsSet();
      const extractedTags = extractTags(note);

      extractedTags.forEach(tagName => {
        if (!blockedSet.has(tagName)) {
          const tagId = addTag(tagName);
          if (tagId) addTagToEntry(entryId, tagId);
        }
      });
    }
    return entryId;
  } catch (error) {
    console.error('Error addEntry:', error);
    return null;
  }
};

export const updateEntry = (id, emotion, intensity, note, date) => {
  try {
    db.runSync(
      `UPDATE entries SET emotion = ?, intensity = ?, note = ?, date = ? WHERE id = ?`,
      [emotion, intensity || null, note || null, date, id]
    );

    db.runSync(`DELETE FROM entry_tags WHERE entry_id = ?`, [id]);

    if (note) {
      const blockedSet = getBlockedTagsSet();
      const extractedTags = extractTags(note);

      extractedTags.forEach(tagName => {
        if (!blockedSet.has(tagName)) {
          const tagId = addTag(tagName);
          if (tagId) addTagToEntry(id, tagId);
        }
      });
    }
    return true;
  } catch (error) {
    console.error('Error updateEntry:', error);
    return false;
  }
};

export const deleteEntry = (id) => {
  try {
    db.runSync(`DELETE FROM entries WHERE id = ?`, [id]);
    console.log('Entrada borrada:', id);
    return true;
  } catch (error) {
    console.error('Error al borrar entrada:', error);
    return false;
  }
};

export const getEntryById = (id) => {
  try {
    const entry = db.getFirstSync(`SELECT * FROM entries WHERE id = ?`, [id]);
    return entry || null;
  } catch (error) {
    console.error('Error al obtener entrada:', error);
    return null;
  }
};

export const getAllEntries = () => {
  try {
    const entries = db.getAllSync(`SELECT * FROM entries ORDER BY date DESC`);
    return entries;
  } catch (error) {
    console.error('Error al obtener entradas:', error);
    return [];
  }
};

export const getHistoricalEntriesByWeekday = (weekday) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return db.getAllSync(`
      SELECT * FROM entries
      WHERE date < ?
        AND CAST(strftime('%w', date / 1000, 'unixepoch', 'localtime') AS INTEGER) = ?
      ORDER BY date DESC
    `, [startOfToday.getTime(), weekday]);
  } catch (error) {
    console.error('Error al obtener patrones históricos:', error);
    return [];
  }
};

export const getBackupSnapshot = () => {
  try {
    const entries = getEntriesWithTags().map(entry => ({
      emotion: entry.emotion,
      intensity: entry.intensity,
      note: entry.note,
      dateMs: entry.date,
      tags: entry.tag_names,
    }));
    const tags = db.getAllSync(`SELECT name FROM tags ORDER BY name`).map(tag => tag.name);
    const blockedTags = db.getAllSync(`SELECT word FROM blocked_tags ORDER BY word`).map(tag => tag.word);
    const reminder = getDailyReminder();

    return {
      entries,
      tags,
      blockedTags,
      notificationSettings: reminder
        ? {
            timeMinutes: Math.floor(reminder.time_ms / (60 * 1000)),
            enabled: Boolean(reminder.enabled),
          }
        : null,
    };
  } catch (error) {
    console.error('Error al crear instantánea de respaldo:', error);
    throw error;
  }
};

export const replaceDatabaseFromBackup = (backup) => {
  try {
    db.withTransactionSync(() => {
      db.execSync(`
        DELETE FROM entry_tags;
        DELETE FROM entries;
        DELETE FROM tags;
        DELETE FROM blocked_tags;
        DELETE FROM notifications;
      `);

      backup.blockedTags.forEach(word => {
        db.runSync(`INSERT INTO blocked_tags (word) VALUES (?)`, [word]);
      });

      const tagNames = new Set(backup.tags);
      backup.entries.forEach(entry => entry.tags.forEach(tagName => tagNames.add(tagName)));

      const tagIds = new Map();
      tagNames.forEach(tagName => {
        const result = db.runSync(`INSERT INTO tags (name) VALUES (?)`, [tagName]);
        tagIds.set(tagName, result.lastInsertRowId);
      });

      backup.entries.forEach(entry => {
        const result = db.runSync(
          `INSERT INTO entries (emotion, intensity, note, date) VALUES (?, ?, ?, ?)`,
          [entry.emotion, entry.intensity, entry.note, entry.dateMs]
        );
        const entryId = result.lastInsertRowId;

        entry.tags.forEach(tagName => {
          db.runSync(
            `INSERT INTO entry_tags (entry_id, tag_id) VALUES (?, ?)`,
            [entryId, tagIds.get(tagName)]
          );
        });
      });

      if (backup.notificationSettings) {
        db.runSync(
          `INSERT INTO notifications (time_ms, enabled, notification_id) VALUES (?, 0, NULL)`,
          [backup.notificationSettings.timeMinutes * 60 * 1000]
        );
      }
    });

    return true;
  } catch (error) {
    console.error('Error al importar respaldo:', error);
    return false;
  }
};


export const getEmotionFrequency = (startDateMs, endDateMs) => {
  try {
    const results = db.getAllSync(`
      SELECT 
        emotion, 
        COUNT(id) as count,
        AVG(intensity) as avg_intensity
      FROM entries 
      WHERE date >= ? AND date <= ?
      GROUP BY emotion
      ORDER BY count DESC
    `, [startDateMs, endDateMs]);

    return results;

  } catch (error) {
    console.error('Error al obtener frecuencia de emociones:', error);
    return [];
  }
};


export const getDayOfWeekPatterns = () => {
  try {
    const results = db.getAllSync(`
      SELECT 
        CAST(strftime('%w', date / 1000, 'unixepoch', 'localtime') AS INTEGER) AS day_of_week,
        emotion,
        COUNT(emotion) as count,
        AVG(intensity) as avg_intensity
      FROM entries
      GROUP BY day_of_week, emotion
      ORDER BY day_of_week ASC, count DESC
    `);

    const patterns = new Map();
    results.forEach(row => {
      const day = row.day_of_week;
      if (!patterns.has(day)) {
        patterns.set(day, []);
      }
      patterns.get(day).push({
        emotion: row.emotion,
        count: row.count,
        avg_intensity: row.avg_intensity,
      });
    });

    return Object.fromEntries(patterns);

  } catch (error) {
    console.error('Error al obtener patrones semanales:', error);
    return {};
  }
};

export const addTag = (name) => {
  try {
    const result = db.runSync(
      `INSERT INTO tags (name) VALUES (?)`,
      [name.trim()]
    );
    return result.lastInsertRowId;
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      const existing = db.getFirstSync(`SELECT id FROM tags WHERE name = ?`, [name.trim()]);
      return existing?.id || null;
    }
    console.error('Error al añadir tag:', error);
    return null;
  }
};

export const getAllTags = () => {
  try {
    return db.getAllSync(`SELECT * FROM tags ORDER BY name`);
  } catch (error) {
    console.error('Error al obtener tags:', error);
    return [];
  }
};

export const getTagsWithCounts = () => {
  try {
    const tags = db.getAllSync(`
      SELECT t.id, t.name, COUNT(et.entry_id) as count 
      FROM tags t 
      LEFT JOIN entry_tags et ON t.id = et.tag_id 
      GROUP BY t.id 
      ORDER BY t.name ASC
    `);
    return tags;
  } catch (error) {
    console.error('Error al obtener tags con conteo:', error);
    return [];
  }
};

export const deleteTag = (id) => {
  try {
    db.runSync(`DELETE FROM entry_tags WHERE tag_id = ?`, [id]);

    db.runSync(`DELETE FROM tags WHERE id = ?`, [id]);

    console.log('Tag eliminado:', id);
    return true;
  } catch (error) {
    console.error('Error al borrar tag:', error);
    return false;
  }
};

export const addTagToEntry = (entryId, tagId) => {
  try {
    db.runSync(
      `INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)`,
      [entryId, tagId]
    );
    return true;
  } catch (error) {
    console.error('Error al asociar tag:', error);
    return false;
  }
};

export const removeTagFromEntry = (entryId, tagId) => {
  try {
    db.runSync(
      `DELETE FROM entry_tags WHERE entry_id = ? AND tag_id = ?`,
      [entryId, tagId]
    );
    return true;
  } catch (error) {
    console.error('Error al eliminar tag de entrada:', error);
    return false;
  }
};

export const getTagsForEntry = (entryId) => {
  try {
    return db.getAllSync(`
      SELECT t.* FROM tags t
      JOIN entry_tags et ON t.id = et.tag_id
      WHERE et.entry_id = ?
      ORDER BY t.name
    `, [entryId]);
  } catch (error) {
    console.error('Error al obtener tags de entrada:', error);
    return [];
  }
};

export const getEntriesWithTags = () => {
  try {
    const entries = db.getAllSync(`
      SELECT 
        e.*,
        GROUP_CONCAT(t.name) as tag_names
      FROM entries e
      LEFT JOIN entry_tags et ON e.id = et.entry_id
      LEFT JOIN tags t ON et.tag_id = t.id
      GROUP BY e.id
      ORDER BY e.date DESC
    `);

    return entries.map(entry => ({
      ...entry,
      tag_names: entry.tag_names ? entry.tag_names.split(',') : []
    }));
  } catch (error) {
    console.error('Error al obtener entradas con tags:', error);
    return [];
  }
};

export const getEntryByDateString = (dateString) => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);

    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();

    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

    const entry = db.getFirstSync(
      `SELECT * FROM entries WHERE date >= ? AND date <= ? LIMIT 1`,
      [startOfDay, endOfDay]
    );

    return entry || null;

  } catch (error) {
    console.error('Error al obtener entrada por fecha:', error);
    return null;
  }
};

export const getEntriesForDay = (dateString) => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);

    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();

    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

    const entries = db.getAllSync(
      `SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date ASC`,
      [startOfDay, endOfDay]
    );

    return entries;

  } catch (error) {
    console.error('Error al obtener entradas del día:', error);
    return [];
  }
};

export const resetDatabase = () => {
  try {
    db.withTransactionSync(() => {
      db.execSync(`DROP TABLE IF EXISTS entry_tags`);
      db.execSync(`DROP TABLE IF EXISTS tags`);
      db.execSync(`DROP TABLE IF EXISTS entries`);
    });
    console.log('Base de datos reseteada.');
    initDatabase();
  } catch (error) {
    console.error('Error al resetear:', error);
  }
};

export const regenerateAllTags = () => {
  try {
    const entries = db.getAllSync(`SELECT id, note FROM entries WHERE note IS NOT NULL AND note != ''`);

    const blockedSet = getBlockedTagsSet();

    db.withTransactionSync(() => {
      db.execSync(`DELETE FROM entry_tags`);
      db.execSync(`DELETE FROM tags`);
      db.execSync(`DELETE FROM sqlite_sequence WHERE name='tags'`);

      let count = 0;
      entries.forEach(entry => {
        const extractedTags = extractTags(entry.note);
        extractedTags.forEach(tagName => {
          if (!blockedSet.has(tagName)) {
            const tagId = addTag(tagName);
            if (tagId) addTagToEntry(entry.id, tagId);
          }
        });
        count++;
      });
      console.log(`Tags regenerados para ${count} entradas.`);
    });
    return true;
  } catch (error) {
    console.error('Error regenerar:', error);
    return false;
  }
};

export const getEntriesByTag = (tagId) => {
  try {
    const entries = db.getAllSync(`
      SELECT e.* FROM entries e
      JOIN entry_tags et ON e.id = et.entry_id
      WHERE et.tag_id = ?
      ORDER BY e.date DESC
    `, [tagId]);

    return entries;
  } catch (error) {
    console.error('Error al obtener entradas por tag:', error);
    return [];
  }
};

export const getEntriesByDateRange = (startDateMs, endDateMs) => {
  try {
    const entries = db.getAllSync(`
      SELECT * FROM entries 
      WHERE date >= ? AND date <= ?
      ORDER BY date ASC
    `, [startDateMs, endDateMs]);

    return entries;
  } catch (error) {
    console.error('Error al obtener rango de fechas:', error);
    return [];
  }
};


export const getNotifications = () => {
  try {
    return db.getAllSync(`SELECT * FROM notifications ORDER BY time_ms ASC`);
  } catch (error) {
    return [];
  }
};

export const getDailyReminder = () => {
  try {
    return db.getFirstSync(`SELECT * FROM notifications ORDER BY id ASC LIMIT 1`) || null;
  } catch (error) {
    console.error('Error al obtener recordatorio:', error);
    return null;
  }
};

export const saveDailyReminder = (timeMs, enabled, notificationId) => {
  try {
    db.withTransactionSync(() => {
      db.execSync(`DELETE FROM notifications`);
      db.runSync(
        `INSERT INTO notifications (time_ms, enabled, notification_id) VALUES (?, ?, ?)`,
        [timeMs, enabled ? 1 : 0, notificationId || null]
      );
    });
    return true;
  } catch (error) {
    console.error('Error al guardar recordatorio:', error);
    return false;
  }
};

export const addNotificationDB = (timeMs, notificationId) => {
  try {
    const result = db.runSync(
      `INSERT INTO notifications (time_ms, enabled, notification_id) VALUES (?, 1, ?)`,
      [timeMs, notificationId]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateNotificationStatus = (id, enabled, newNotificationId) => {
  try {
    db.runSync(
      `UPDATE notifications SET enabled = ?, notification_id = ? WHERE id = ?`,
      [enabled ? 1 : 0, newNotificationId, id]
    );
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const deleteNotificationDB = (id) => {
  try {
    db.runSync(`DELETE FROM notifications WHERE id = ?`, [id]);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};