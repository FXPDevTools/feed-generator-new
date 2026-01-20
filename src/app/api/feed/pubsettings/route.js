import { NextResponse } from 'next/server';
import { getErrorUserId } from '../../../../../lib/feed-settings-db.js';

// Public API for feed generator to get error user ID
export async function GET() {
  try {
    const id = await getErrorUserId();
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: 'failed to get' }, { status: 500 });
  }
}