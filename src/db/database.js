// src/db/database.js
import * as SQLite from 'expo-sqlite';
import { extractTags } from '../utils/tagUtils';

// Abrimos la base de datos (sincrónicamente)
const db = SQLite.openDatabaseSync('pausa.db');

/**
 * Inicializa la base de datos creando las tablas si no existen
 */
export const initDatabase = () => {
  try {
    db.withTransactionSync(() => {
      // Tabla: entries
      db.execSync(`
        CREATE TABLE IF NOT EXISTS entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          emotion TEXT NOT NULL,
          intensity INTEGER,
          note TEXT,
          date INTEGER NOT NULL
        );
      `);

      // Tabla: tags
      db.execSync(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        );
      `);

      // Tabla: entry_tags (relación muchos a muchos)
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
    });

    console.log('Base de datos inicializada correctamente (bl).');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
};


// Función para desterrar una palabra
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

// Función para perdonar/desbloquear un tag
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

// Helper interno para obtener la lista negra rápida
const getBlockedTagsSet = () => {
  try {
    const rows = db.getAllSync(`SELECT word FROM blocked_tags`);
    return new Set(rows.map(r => r.word));
  } catch (error) {
    return new Set();
  }
};

// ================================================================
// OPERACIONES EN LA TABLA `entries`
// ================================================================

/**
 * Añade una nueva entrada emocional y procesa sus tags automáticos.
 */
export const addEntry = (emotion, intensity, note, date) => {
  try {
    const result = db.runSync(
      `INSERT INTO entries (emotion, intensity, note, date) VALUES (?, ?, ?, ?)`,
      [emotion, intensity || null, note || null, date]
    );
    const entryId = result.lastInsertRowId;

    if (note) {
      // 1. Obtenemos lista negra
      const blockedSet = getBlockedTagsSet();
      // 2. Extraemos tags
      const extractedTags = extractTags(note);

      extractedTags.forEach(tagName => {
        // 3. SOLO procesamos si NO está bloqueada
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

/**
 * Actualiza una entrada existente y regenera sus tags.
 */
export const updateEntry = (id, emotion, intensity, note, date) => {
  try {
    db.runSync(
      `UPDATE entries SET emotion = ?, intensity = ?, note = ?, date = ? WHERE id = ?`,
      [emotion, intensity || null, note || null, date, id]
    );

    // Borramos tags viejos de esta entrada
    db.runSync(`DELETE FROM entry_tags WHERE entry_id = ?`, [id]);

    if (note) {
      const blockedSet = getBlockedTagsSet(); // <--- Check Blacklist
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

/**
 * Borra una entrada (y sus tags asociados por CASCADE)
 */
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

/**
 * Obtiene una entrada por ID
 */
export const getEntryById = (id) => {
  try {
    const entry = db.getFirstSync(`SELECT * FROM entries WHERE id = ?`, [id]);
    return entry || null;
  } catch (error) {
    console.error('Error al obtener entrada:', error);
    return null;
  }
};

/**
 * Obtiene todas las entradas (ordenadas por fecha descendente)
 */
export const getAllEntries = () => {
  try {
    const entries = db.getAllSync(`SELECT * FROM entries ORDER BY date DESC`);
    return entries;
  } catch (error) {
    console.error('Error al obtener entradas:', error);
    return [];
  }
};


// src/db/database.js

// ... (después de getAllEntries)

/**
 * Obtiene la frecuencia (conteo) de emociones dentro de un rango de fechas.
 * @param {number} startDateMs - Fecha de inicio en milisegundos.
 * @param {number} endDateMs - Fecha de fin en milisegundos.
 * @returns {Array} Lista de {emotion, count, avg_intensity}
 */
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

    // Necesitamos que el código de arriba nos dé: 
    // day_of_week | emotion | count | avg_intensity
    // ---------------------------------------------
    // 1           | Ira     | 5     | 8.5
    // 1           | Feliz   | 2     | 6.0
    // 2           | Triste  | 7     | 9.1

    // Ahora procesaremos ese resultado en JavaScript para dejarlo limpio:
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

    return Object.fromEntries(patterns); // Lo devolvemos como un objeto {1: [...], 2: [...], ...}

  } catch (error) {
    console.error('Error al obtener patrones semanales:', error);
    return {};
  }
};

// ================================================================
// OPERACIONES EN LA TABLA `tags`
// ================================================================

/**
 * Añade un nuevo tag (o lo reutiliza si ya existe)
 */
export const addTag = (name) => {
  try {
    // Intentamos insertar
    const result = db.runSync(
      `INSERT INTO tags (name) VALUES (?)`,
      [name.trim()]
    );
    return result.lastInsertRowId;
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      // Si ya existe, lo buscamos y devolvemos su ID
      const existing = db.getFirstSync(`SELECT id FROM tags WHERE name = ?`, [name.trim()]);
      return existing?.id || null;
    }
    console.error('Error al añadir tag:', error);
    return null;
  }
};

/**
 * Obtiene todos los tags
 */
export const getAllTags = () => {
  try {
    return db.getAllSync(`SELECT * FROM tags ORDER BY name`);
  } catch (error) {
    console.error('Error al obtener tags:', error);
    return [];
  }
};

/**
 * Obtiene todos los tags con el conteo de cuántas veces se han usado.
 * Retorna: [{ id, name, count }, ...]
 */
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

/**
 * Borra un tag y sus asociaciones (Versión Simplificada y Robusta)
 */
export const deleteTag = (id) => {
  try {
    // 1. Borrar asociaciones primero
    db.runSync(`DELETE FROM entry_tags WHERE tag_id = ?`, [id]);

    // 2. Borrar el tag después
    db.runSync(`DELETE FROM tags WHERE id = ?`, [id]);

    console.log('Tag eliminado:', id);
    return true;
  } catch (error) {
    console.error('Error al borrar tag:', error);
    return false;
  }
};

// ================================================================
// OPERACIONES EN LA TABLA `entry_tags` (relación)
// ================================================================

/**
 * Asocia un tag a una entrada
 */
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

/**
 * Elimina un tag de una entrada
 */
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

/**
 * Obtiene los tags de una entrada específica
 */
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

/**
 * Obtiene entradas con sus tags (útil para mostrar todo junto)
 */
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

/**
 * Obtiene una entrada por un string de fecha 'YYYY-MM-DD'
 */
export const getEntryByDateString = (dateString) => {
  try {
    // 1. Usamos la MISMA lógica "segura" que en 'handleSave'
    // para crear la fecha en HORA LOCAL
    const [year, month, day] = dateString.split('-').map(Number);

    // 2. Definimos el inicio del día (00:00:00 local)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();

    // 3. Definimos el fin del día (23:59:59 local)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

    // 4. Buscamos en la BD cualquier entrada DENTRO de ese rango de 24h
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

    // Inicio del día (00:00:00)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).getTime();

    // Fin del día (23:59:59)
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).getTime();

    // Usamos getAllSync para traer el array completo
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

// ================================================================
// BONUS: Borrar toda la base de datos (para pruebas)
// ================================================================

/**
 * Borra todas las tablas (¡cuidado!)
 */
export const resetDatabase = () => {
  try {
    db.withTransactionSync(() => {
      db.execSync(`DROP TABLE IF EXISTS entry_tags`);
      db.execSync(`DROP TABLE IF EXISTS tags`);
      db.execSync(`DROP TABLE IF EXISTS entries`);
    });
    console.log('Base de datos reseteada.');
    initDatabase(); // Volvemos a crear las tablas
  } catch (error) {
    console.error('Error al resetear:', error);
  }
};

/**
 * MANTENIMIENTO: Borra TODOS los tags existentes y regenera desde cero.
 * ¡CUIDADO! Esto elimina también los tags creados manualmente.
 */
export const regenerateAllTags = () => {
  try {
    console.log('Regenerando tags (con blacklist)...');
    const entries = db.getAllSync(`SELECT id, note FROM entries WHERE note IS NOT NULL AND note != ''`);

    // Obtenemos la lista negra UNA sola vez
    const blockedSet = getBlockedTagsSet();

    db.withTransactionSync(() => {
      // Limpieza total
      db.execSync(`DELETE FROM entry_tags`);
      db.execSync(`DELETE FROM tags`);
      db.execSync(`DELETE FROM sqlite_sequence WHERE name='tags'`);

      let count = 0;
      entries.forEach(entry => {
        const extractedTags = extractTags(entry.note);
        extractedTags.forEach(tagName => {
          // EL FILTRO MAESTRO: Si está bloqueada, la ignoramos.
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