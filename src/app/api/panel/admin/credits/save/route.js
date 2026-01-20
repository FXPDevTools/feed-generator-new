import { addCredit } from '../../../../../../../lib/credits-db.js';
import { pool } from '../../../../../../../lib/db.js';
import { withPanelAuth } from '../../../../../../../lib/api-auth.js';
export const runtime = 'nodejs';

export async function POST(request) {
  const authResult = await withPanelAuth(request, ['admin']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const credits = await request.json();
    if (!Array.isArray(credits)) {
      return new Response(JSON.stringify({ success: false, error: 'Body must be an array' }), { status: 400 });
    }
    await pool.query('DELETE FROM footer_credits');
    for (const c of credits) {
      if (!c?.nick || !c?.profile) continue;
      await addCredit(c.nick, c.profile);
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('[credits][SAVE] error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
