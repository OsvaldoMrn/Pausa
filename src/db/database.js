// src/db/database.js
import * as SQLite from 'expo-sqlite';

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
    });

    console.log('Base de datos inicializada correctamente.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
};

// ================================================================
// OPERACIONES EN LA TABLA `entries`
// ================================================================

/**
 * Añade una nueva entrada emocional
 */
export const addEntry = (emotion, intensity, note, date) => {
  try {
    const result = db.runSync(
      `INSERT INTO entries (emotion, intensity, note, date) VALUES (?, ?, ?, ?)`,
      [emotion, intensity || null, note || null, date]
    );
    console.log('Entrada añadida con ID:', result.lastInsertRowId);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error al añadir entrada:', error);
    return null;
  }
};

/**
 * Actualiza una entrada existente
 */
export const updateEntry = (id, emotion, intensity, note, date) => {
  try {
    db.runSync(
      `UPDATE entries SET emotion = ?, intensity = ?, note = ?, date = ? WHERE id = ?`,
      [emotion, intensity || null, note || null, date, id]
    );
    console.log('Entrada actualizada:', id);
    return true;
  } catch (error) {
    console.error('Error al actualizar entrada:', error);
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
 * Borra un tag (solo si no está usado)
 */
export const deleteTag = (id) => {
  try {
    // Verificamos si está en uso
    const inUse = db.getFirstSync(
      `SELECT 1 FROM entry_tags WHERE tag_id = ? LIMIT 1`,
      [id]
    );
    if (inUse) {
      console.warn('No se puede borrar: el tag está en uso.');
      return false;
    }

    db.runSync(`DELETE FROM tags WHERE id = ?`, [id]);
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