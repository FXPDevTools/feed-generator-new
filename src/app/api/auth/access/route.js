import { getAccessList } from '../../../../../lib/access-db.js';
export const runtime = 'nodejs';

// Public API for login verification
export async function GET() {
  try {
    const data = await getAccessList();
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[access][GET] Error:', err);
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}