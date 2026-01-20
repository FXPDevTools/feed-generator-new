import { NextResponse } from 'next/server';
import { getTemplate, updateTemplate, deleteTemplate } from '../../../../../../lib/bbcode-templates-db.js';
import { withPanelAuth } from '../../../../../../lib/api-auth.js';

// GET /api/interview/templates/[id] - get one interview template (full)
export async function GET(request, { params }) {
  // Allow public read access for interview generator
  // No authentication required for this endpoint
  try {
    const id = Number(params?.id);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const tpl = await getTemplate(id, 'eruhim_interviews');
    if (!tpl) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(tpl);
  } catch (error) {
    console.error('[interview-templates/:id][GET]', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT /api/interview/templates/[id] - update name/content
export async function PUT(request, { params }) {
  const authResult = await withPanelAuth(request, ['eruhim']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const id = Number(params?.id);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const rawContent = body?.content; // can be string or { content, qa_content }

    if (!name || (!rawContent && rawContent !== '')) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const updated = await updateTemplate(id, name, rawContent, 'eruhim_interviews');
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Template name already exists' }, { status: 409 });
    }
    console.error('[interview-templates/:id][PUT]', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/interview/templates/[id]
export async function DELETE(request, { params }) {
  const authResult = await withPanelAuth(request, ['eruhim']);
  if (!authResult.authorized) return authResult.errorResponse;

  try {
    const id = Number(params?.id);
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const ok = await deleteTemplate(id, 'eruhim_interviews');
    if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error && error.message === 'Cannot delete active template') {
      return NextResponse.json({ error: 'Cannot delete active template' }, { status: 400 });
    }
    console.error('[interview-templates/:id][DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}