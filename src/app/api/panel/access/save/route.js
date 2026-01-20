import { addAccessCode } from '../../../../../../lib/access-db.js';
import { pool } from '../../../../../../lib/db.js';
import { withPanelAuth } from '../../../../../../lib/api-auth.js';
export const runtime = 'nodejs';

export async function POST(request) {
  const authResult = await withPanelAuth(request, ['admin', 'leader']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const codes = await request.json();
    if (!Array.isArray(codes)) {
      return new Response(JSON.stringify({ success: false, error: 'Body must be an array' }), { status: 400 });
    }
    await pool.query('DELETE FROM access_codes');
    for (const code of codes) {
      await addAccessCode(code.code, code.role, code.panels, code.editableByLeader || false);
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('[access][SAVE] Error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
