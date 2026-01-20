import { NextResponse } from 'next/server';
import { listTemplates, createTemplate } from '../../../../../lib/bbcode-templates-db.js';
import { withPanelAuth } from '../../../../../lib/api-auth.js';

// GET /api/interview/templates - list all interview templates (no content)
export async function GET(request) {
  const authResult = await withPanelAuth(request, ['eruhim']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const templates = await listTemplates('eruhim_interviews');
    return NextResponse.json(templates);
  } catch (error) {
    console.error('[interview-templates][GET]', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/interview/templates - create new interview template
export async function POST(request) {
  const authResult = await withPanelAuth(request, ['eruhim']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const rawContent = body?.content; // can be string or { content, qa_content }
    if (!name || (!rawContent && rawContent !== '')) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const created = await createTemplate(name, rawContent, 'eruhim_interviews');
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    // Handle duplicate name (ER_DUP_ENTRY)
    if (error && error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Template name already exists' }, { status: 409 });
    }
    console.error('[interview-templates][POST]', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}