import { pool } from './db.js';

// Templates DB access layer
// Notes:
// - Operates on existing tables: bbcode_templates, eruhim_templates
// - Does NOT change schema. Assumes the tables already exist with columns:
//   (id, name, content, is_active, created_at, updated_at)
// - Saves content RAW (no processing).
// - Supports two types: 'feed' and 'eruhim_interviews'

function getTableName(type) {
  switch (type) {
    case 'feed':
      return 'bbcode_templates';
    case 'eruhim_interviews':
      return 'eruhim_templates';
    default:
      throw new Error(`Unknown template type: ${type}`);
  }
}

// List minimal template metadata (no content) for UI lists
export async function listTemplates(type = 'feed') {
  const tableName = getTableName(type);
  const [rows] = await pool.execute(
    `SELECT id, name, is_active, created_at, updated_at
     FROM ${tableName}
     ORDER BY updated_at DESC, id DESC`
  );
  return rows;
}

// Get one template (full), including content
export async function getTemplate(id, type = 'feed') {
  const tableName = getTableName(type);
  
  if (type === 'eruhim_interviews') {
    // Interview templates have both main content and qa_content
    const [rows] = await pool.execute(
      `SELECT id, name, content, qa_content, is_active, created_at, updated_at
       FROM ${tableName} WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  } else {
    // Feed templates only have content
    const [rows] = await pool.execute(
      `SELECT id, name, content, is_active, created_at, updated_at
       FROM ${tableName} WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }
}

// Create a new template (RAW content)
// Returns metadata for convenience; content can be fetched via getTemplate
// For interview templates, content should be an object: { content, qa_content }
export async function createTemplate(name, content, type = 'feed') {
  const tableName = getTableName(type);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let result, insertedId;
    
    if (type === 'eruhim_interviews') {
      // Interview templates have both main content and qa_content
      const mainContent = typeof content === 'object' ? content.content : content;
      const qaContent = typeof content === 'object' ? content.qa_content : '';
      
      [result] = await conn.execute(
        `INSERT INTO ${tableName} (name, content, qa_content) VALUES (?, ?, ?)`,
        [name, mainContent, qaContent]
      );
    } else {
      // Feed templates only have content
      [result] = await conn.execute(
        `INSERT INTO ${tableName} (name, content) VALUES (?, ?)`,
        [name, content]
      );
    }

    insertedId = result.insertId;
    const [rows] = await conn.execute(
      `SELECT id, name, is_active, created_at, updated_at
       FROM ${tableName} WHERE id = ?`,
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
// For interview templates, content should be an object: { content, qa_content }
export async function updateTemplate(id, name, content, type = 'feed') {
  const tableName = getTableName(type);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (type === 'eruhim_interviews') {
      // Interview templates have both main content and qa_content
      const mainContent = typeof content === 'object' ? content.content : content;
      const qaContent = typeof content === 'object' ? content.qa_content : '';
      
      await conn.execute(
        `UPDATE ${tableName} SET name = ?, content = ?, qa_content = ? WHERE id = ?`,
        [name, mainContent, qaContent, id]
      );
    } else {
      // Feed templates only have content
      await conn.execute(
        `UPDATE ${tableName} SET name = ?, content = ? WHERE id = ?`,
        [name, content, id]
      );
    }

    const [rows] = await conn.execute(
      `SELECT id, name, is_active, created_at, updated_at
       FROM ${tableName} WHERE id = ?`,
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
export async function deleteTemplate(id, type = 'feed') {
  const tableName = getTableName(type);
  // First check if this template is active
  const template = await getTemplate(id, type);
  if (template && template.is_active) {
    throw new Error('Cannot delete active template');
  }
  
  const [res] = await pool.execute(
    `DELETE FROM ${tableName} WHERE id = ?`,
    [id]
  );
  return res.affectedRows > 0;
}

// Get the active template (full), including content
export async function getActiveTemplate(type = 'feed') {
  const tableName = getTableName(type);
  
  if (type === 'eruhim_interviews') {
    // Interview templates have both main content and qa_content
    const [rows] = await pool.execute(
      `SELECT id, name, content, qa_content, is_active, created_at, updated_at
       FROM ${tableName} WHERE is_active = 1 LIMIT 1`
    );
    return rows[0] || null;
  } else {
    // Feed templates only have content
    const [rows] = await pool.execute(
      `SELECT id, name, content, is_active, created_at, updated_at
       FROM ${tableName} WHERE is_active = 1 LIMIT 1`
    );
    return rows[0] || null;
  }
}

// Set one template as active (exclusively)
export async function setActiveTemplate(id, type = 'feed') {
  const tableName = getTableName(type);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Ensure the target exists (and lock for consistency)
    const [existsRows] = await conn.execute(
      `SELECT id FROM ${tableName} WHERE id = ? FOR UPDATE`,
      [id]
    );
    if (!existsRows.length) {
      await conn.rollback();
      return false;
    }

    // Deactivate all, then activate the chosen one
    await conn.execute(`UPDATE ${tableName} SET is_active = 0`);
    const [res] = await conn.execute(
      `UPDATE ${tableName} SET is_active = 1 WHERE id = ?`,
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
