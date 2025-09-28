// lib/feed-settings-db.js
// DB access layer for feed settings like the "found an error?" user id.
// ESM module; uses pool from lib/db.js

import { pool } from './db.js';

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS feed_settings (
  ` +
    // Use backticks safely concatenated to avoid tooling confusion
    "`key`" +
    ` VARCHAR(64) NOT NULL PRIMARY KEY,
  ` + "`value`" + ` TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

async function ensureTable() {
    const conn = await pool.getConnection();
    try {
        await conn.query(TABLE_SQL);
    } finally {
        conn.release();
    }
}

async function getSetting(key) {
    const [rows] = await pool.query('SELECT `value` FROM feed_settings WHERE `key` = ? LIMIT 1', [key]);
    if (rows && rows.length > 0) return rows[0].value ?? null;
    return null;
}

async function setSetting(key, value) {
    await ensureTable();
    await pool.query('INSERT INTO feed_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)', [key, value]);
}

// Parse a user input (full URL or plain ID) and extract the numeric user id
export function parseErrorUserId(input) {
    if (input == null) return null;
    const s = String(input).trim();
    if (!s) return null;
    // If it's just digits, return directly
    const digitsOnly = s.match(/^\d+$/);
    if (digitsOnly) return digitsOnly[0];
    // Try common patterns: member.php?u=12345, u=12345, /members/12345/, /profile/12345
    const m = s.match(/(?:[?&]u=|\/members\/?|\/member\/|\/profile\/|user\/)(\d+)/i);
    if (m && m[1]) return m[1];
    // Fallback: last number chunk in the string
    const anyNum = s.match(/(\d{2,})/);
    if (anyNum) return anyNum[1];
    return null;
}

const ERROR_USER_KEY = 'error_user_id';

export async function getErrorUserId() {
    try {
        const v = await getSetting(ERROR_USER_KEY);
        return v || null;
    } catch (e) {
        return null;
    }
}

export async function setErrorUserId(id) {
    if (id == null || String(id).trim() === '') {
        await setSetting(ERROR_USER_KEY, null);
        return null;
    }
    const numeric = String(id).match(/^\d+$/) ? String(id) : parseErrorUserId(id);
    if (!numeric) throw new Error('Invalid user id');
    await setSetting(ERROR_USER_KEY, numeric);
    return numeric;
}
