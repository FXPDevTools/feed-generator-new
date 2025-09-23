

import { addAccessCode, updateAccessCode, removeAccessCode } from '../../../panel/access-db.js';

export async function POST(request) {
  try {
    const codes = await request.json();
    // Fetch all current codes from DB
    // For simplicity, delete all and re-insert (can be optimized)
    // Remove all existing codes
    // (You can optimize to diff and only update changed rows if needed)
    const pool = (await import('../../../panel/db.js')).default;
    await pool.query('DELETE FROM access_codes');
    for (const code of codes) {
      await addAccessCode(
        code.code,
        code.role,
        code.panels,
        code.editableByLeader || false
      );
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
