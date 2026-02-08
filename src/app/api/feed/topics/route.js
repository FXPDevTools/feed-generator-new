
import { NextResponse } from 'next/server';
import { pool } from '../../../../../lib/db';

export async function GET() {
    try {
        const [rows] = await pool.query('SELECT * FROM topics ORDER BY id ASC');
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching topics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { topic_name, topic_color } = body;

        if (!topic_name || !topic_color) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [result] = await pool.query(
            'INSERT INTO topics (topic_name, topic_color) VALUES (?, ?)',
            [topic_name, topic_color]
        );

        return NextResponse.json({ id: result.insertId, topic_name, topic_color }, { status: 201 });
    } catch (error) {
        console.error('Error creating topic:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        await pool.query('DELETE FROM topics WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Topic deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting topic:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
