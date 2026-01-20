import { getCreditsList } from '../../../../../lib/credits-db.js';
export const runtime = 'nodejs';

// Public API for footer credits
export async function GET() {
  try {
    const rows = await getCreditsList();
    return new Response(JSON.stringify(rows), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[credits][GET] error:', err);
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}