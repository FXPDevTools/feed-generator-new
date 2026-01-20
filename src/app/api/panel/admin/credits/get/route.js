import { getCreditsList } from '../../../../../../../lib/credits-db.js';
import { withPanelAuth } from '../../../../../../../lib/api-auth.js';
export const runtime = 'nodejs';

export async function GET(request) {
  const authResult = await withPanelAuth(request, ['admin']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const rows = await getCreditsList();
    return new Response(JSON.stringify(rows), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[credits][GET] error:', err);
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
