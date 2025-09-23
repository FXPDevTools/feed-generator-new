// access-db.js - MySQL access logic for access_codes
import pool from './db.js';

export async function getAccessList() {
  const [rows] = await pool.query('SELECT * FROM access_codes');
  return rows.map(row => ({
    code: row.code,
    role: row.role,
    panels: JSON.parse(row.panels),
    editableByLeader: !!row.editableByLeader
  }));
}

export async function getPanelsForCode(code) {
  const [rows] = await pool.query('SELECT panels FROM access_codes WHERE code = ?', [code]);
  if (rows.length === 0) return [];
  return JSON.parse(rows[0].panels);
}

export async function getRoleForCode(code) {
  const [rows] = await pool.query('SELECT role FROM access_codes WHERE code = ?', [code]);
  return rows.length ? rows[0].role : null;
}

export async function addAccessCode(newCode, role, panels, editableByLeader) {
  await pool.query(
    'INSERT INTO access_codes (code, role, panels, editableByLeader) VALUES (?, ?, ?, ?)',
    [newCode, role, JSON.stringify(panels), !!editableByLeader]
  );
}

export async function removeAccessCode(code) {
  await pool.query('DELETE FROM access_codes WHERE code = ?', [code]);
}

export async function updatePanelsForCode(code, panels) {
  await pool.query('UPDATE access_codes SET panels = ? WHERE code = ?', [JSON.stringify(panels), code]);
}

export async function updateAccessCode(code, role, panels, editableByLeader) {
  await pool.query(
    'UPDATE access_codes SET role = ?, panels = ?, editableByLeader = ? WHERE code = ?',
    [role, JSON.stringify(panels), !!editableByLeader, code]
  );
}
