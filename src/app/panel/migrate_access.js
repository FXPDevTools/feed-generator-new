// migrate_access.js - Script to migrate access.json to MySQL
import fs from 'fs';
import path from 'path';
import { pool } from './db.js';

async function migrate() {
  const filePath = path.resolve('./src/app/panel/access.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const codes = JSON.parse(raw);

  for (const code of codes) {
    await pool.query(
      'INSERT INTO access_codes (code, role, panels, editableByLeader) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE role=VALUES(role), panels=VALUES(panels), editableByLeader=VALUES(editableByLeader)',
      [
        code.code,
        code.role,
        JSON.stringify(code.panels),
        !!code.editableByLeader
      ]
    );
  }
  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
