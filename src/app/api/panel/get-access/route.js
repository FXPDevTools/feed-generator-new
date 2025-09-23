

import { getAccessList } from '../../../panel/access-db.js';

export async function GET() {
  try {
    const data = await getAccessList();
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
