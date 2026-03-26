import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { blocking_task_ids } = await req.json();
  const id = Number(params.id);

  await supabase.from('task_blockers').delete().eq('task_id', id);

  if (blocking_task_ids.length > 0) {
    const rows = blocking_task_ids.map((bid: number) => ({ task_id: id, blocking_task_id: bid }));
    const { error } = await supabase.from('task_blockers').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
