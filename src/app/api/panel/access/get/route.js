import { getAccessList } from '../../../../../../lib/access-db.js';
import { withPanelAuth } from '../../../../../../lib/api-auth.js';
export const runtime = 'nodejs';

export async function GET(request) {
  const authResult = await withPanelAuth(request, ['admin', 'leader']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const data = await getAccessList();
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[access][GET] Error:', err);
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
