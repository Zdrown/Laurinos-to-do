import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const assignee = searchParams.get('assignee');
  const status = searchParams.get('status');
  const sort = searchParams.get('sort');
  const order = searchParams.get('order') === 'desc' ? false : true; // true = ascending

  // Get all tasks
  let query = supabase.from('tasks').select('*');
  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);

  if (sort === 'due_date') query = query.order('due_date', { ascending: order, nullsFirst: false });
  else if (sort === 'priority') query = query.order('priority', { ascending: order });
  else if (sort === 'category') query = query.order('category', { ascending: order });
  else if (sort === 'status') query = query.order('status', { ascending: order });
  else query = query.order('id', { ascending: true });

  const { data: tasks, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get all assignees
  const { data: assignees } = await supabase
    .from('task_assignees')
    .select('task_id, person_id, people(id, name, color)')

  // Get all blockers
  const { data: blockers } = await supabase
    .from('task_blockers')
    .select('task_id, blocking_task_id');

  // Merge
  const assigneeIds = assignee ? assignee.split(',').map(Number) : [];

  const result = (tasks || []).map((t: Record<string, unknown>) => {
    const taskAssignees = (assignees || [])
      .filter((a: Record<string, unknown>) => a.task_id === t.id)
      .map((a: Record<string, unknown>) => a.people)
      .filter(Boolean);
    const taskBlockers = (blockers || [])
      .filter((b: Record<string, unknown>) => b.task_id === t.id)
      .map((b: Record<string, unknown>) => b.blocking_task_id);
    return { ...t, assignees: taskAssignees, blockers: taskBlockers };
  }).filter((t: Record<string, unknown>) => {
    if (assigneeIds.length === 0) return true;
    return (t.assignees as Array<Record<string, unknown>>).some((a) => assigneeIds.includes(a.id as number));
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, category, description, due_date, priority, status } = body;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title,
      category,
      description: description || '',
      due_date: due_date || null,
      priority: priority || 2,
      status: status || 'open',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
