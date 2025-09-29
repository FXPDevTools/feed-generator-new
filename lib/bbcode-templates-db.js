import { pool } from './db.js';

// BBCode Templates DB access layer
// Notes:
// - Operates on an existing table: bbcode_templates
// - Does NOT change schema. Assumes the table already exists with columns:
//   (id, name, content, is_active, created_at, updated_at)
// - Saves content RAW (no processing).

// List minimal template metadata (no content) for UI lists
export async function listTemplates() {
  const [rows] = await pool.execute(
    `SELECT id, name, is_active, created_at, updated_at
     FROM bbcode_templates
     ORDER BY updated_at DESC, id DESC`
  );
  return rows;
}

// Get one template (full), including content
export async function getTemplate(id) {
  const [rows] = await pool.execute(
    `SELECT id, name, content, is_active, created_at, updated_at
     FROM bbcode_templates WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// Create a new template (RAW content)
// Returns metadata for convenience; content can be fetched via getTemplate
export async function createTemplate(name, content) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO bbcode_templates (name, content) VALUES (?, ?)`,
      [name, content]
    );

    const insertedId = result.insertId;
    const [rows] = await conn.execute(
      `SELECT id, name, is_active, created_at, updated_at
       FROM bbcode_templates WHERE id = ?`,
      [insertedId]
    );

    await conn.commit();
    return rows[0] || null;
  } catch (err) {
    try { await conn.rollback(); } catch {}
    throw err;
  } finally {
    conn.release();
  }
}

// Update template name/content (RAW content)
export async function updateTemplate(id, name, content) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE bbcode_templates SET name = ?, content = ? WHERE id = ?`,
      [name, content, id]
    );

    const [rows] = await conn.execute(
      `SELECT id, name, is_active, created_at, updated_at
       FROM bbcode_templates WHERE id = ?`,
      [id]
    );

    await conn.commit();
    return rows[0] || null;
  } catch (err) {
    try { await conn.rollback(); } catch {}
    throw err;
  } finally {
    conn.release();
  }
}

// Delete template (prevent deletion of active template)
export async function deleteTemplate(id) {
  // First check if this template is active
  const template = await getTemplate(id);
  if (template && template.is_active) {
    throw new Error('Cannot delete active template');
  }
  
  const [res] = await pool.execute(
    `DELETE FROM bbcode_templates WHERE id = ?`,
    [id]
  );
  return res.affectedRows > 0;
}

// Get the active template (full), including content
export async function getActiveTemplate() {
  const [rows] = await pool.execute(
    `SELECT id, name, content, is_active, created_at, updated_at
     FROM bbcode_templates WHERE is_active = 1 LIMIT 1`
  );
  return rows[0] || null;
}

// Set one template as active (exclusively)
export async function setActiveTemplate(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Ensure the target exists (and lock for consistency)
    const [existsRows] = await conn.execute(
      `SELECT id FROM bbcode_templates WHERE id = ? FOR UPDATE`,
      [id]
    );
    if (!existsRows.length) {
      await conn.rollback();
      return false;
    }

    // Deactivate all, then activate the chosen one
    await conn.execute(`UPDATE bbcode_templates SET is_active = 0`);
    const [res] = await conn.execute(
      `UPDATE bbcode_templates SET is_active = 1 WHERE id = ?`,
      [id]
    );

    await conn.commit();
    return res.affectedRows > 0;
  } catch (err) {
    try { await conn.rollback(); } catch {}
    throw err;
  } finally {
    conn.release();
  }
}
