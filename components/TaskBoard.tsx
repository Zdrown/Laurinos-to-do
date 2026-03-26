'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Types
interface Person { id: number; name: string; color: string; }
interface Task {
  id: number; title: string; category: string; description: string;
  due_date: string | null; priority: number; status: string;
  created_at: string; assignees: Person[]; blockers: number[];
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  MENU: { label: 'Menu', color: '#e8c547' },
  TOWN_EMAIL: { label: 'Town & Permits', color: '#f4a261' },
  COLLABORATIONS: { label: 'Collaborations', color: '#a8dadc' },
  POS: { label: 'POS', color: '#90e0ef' },
  FOOD: { label: 'Food', color: '#80b918' },
  MARKETING: { label: 'Marketing', color: '#c77dff' },
  MUSIC: { label: 'Music', color: '#ff6b6b' },
  REPAIRS: { label: 'Repairs', color: '#f77f00' },
  ATMOSPHERE: { label: 'Atmosphere', color: '#4cc9f0' },
  EVENTS: { label: 'Events', color: '#e63946' },
  FINANCIAL: { label: 'Financial', color: '#2dc653' },
  PUBLIC_OPINION: { label: 'Public Opinion', color: '#ff9f1c' },
  HIRES: { label: 'Hires', color: '#e76f51' },
  PROFIT: { label: 'Profit', color: '#06d6a0' },
  SYSTEM: { label: 'System', color: '#8ecae6' },
  EXPENSES: { label: 'Expenses', color: '#ef476f' },
  SCHEDULE: { label: 'Schedule', color: '#b5838d' },
};

const PRIORITY_COLORS: Record<number, string> = { 1: '#ff4d4d', 2: '#e8c547', 3: '#4cc9a0' };
const PRIORITY_LABELS: Record<number, string> = { 1: 'High', 2: 'Medium', 3: 'Low' };
const STATUS_COLORS: Record<string, string> = { open: '#555', in_progress: '#e8c547', done: '#2dc653' };
const STATUS_LABELS: Record<string, string> = { open: 'Open', in_progress: 'In Progress', done: 'Done' };
const NEXT_STATUS: Record<string, string> = { open: 'in_progress', in_progress: 'done', done: 'open' };

const COLOR_SWATCHES = ['#e8c547', '#f4a261', '#a8dadc', '#90e0ef', '#80b918', '#c77dff', '#ff6b6b', '#f77f00', '#4cc9f0', '#e63946', '#2dc653', '#ef476f'];

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toISOString().split('T')[0]);
}
function isSoon(d: string | null) {
  if (!d) return false;
  const diff = (new Date(d).getTime() - Date.now()) / 86400000;
  return diff >= 0 && diff <= 7;
}
function shouldPulse(task: Task) {
  if (!task.due_date || task.status === 'done') return false;
  const diff = (new Date(task.due_date).getTime() - Date.now()) / 86400000;
  return diff <= 14 && diff >= 0 && task.priority >= 2;
}
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState('');
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('MENU');

  // Drawer edit state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState(2);
  const [editDueDate, setEditDueDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAssignees, setEditAssignees] = useState<number[]>([]);
  const [editBlockers, setEditBlockers] = useState<number[]>([]);
  const [blockerSearch, setBlockerSearch] = useState('');
  const [showBlockerDropdown, setShowBlockerDropdown] = useState(false);

  // People modal
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonColor, setNewPersonColor] = useState('#e8c547');

  const catRef = useRef<HTMLDivElement>(null);
  const assRef = useRef<HTMLDivElement>(null);

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data);
  }, []);

  const fetchPeople = useCallback(async () => {
    const res = await fetch('/api/people');
    const data = await res.json();
    setPeople(data);
  }, []);

  useEffect(() => { fetchTasks(); fetchPeople(); }, [fetchTasks, fetchPeople]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCatDropdown(false);
      if (assRef.current && !assRef.current.contains(e.target as Node)) setShowAssigneeDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Escape key closes drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerTask(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Filter & sort
  let filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== Number(priorityFilter)) return false;
    if (categoryFilter.length > 0 && !categoryFilter.includes(t.category)) return false;
    if (assigneeFilter.length > 0 && !t.assignees.some(a => assigneeFilter.includes(a.id))) return false;
    return true;
  });

  if (sortBy) {
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'due_date_asc') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1; if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      if (sortBy === 'due_date_desc') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1; if (!b.due_date) return -1;
        return b.due_date.localeCompare(a.due_date);
      }
      if (sortBy === 'priority') return a.priority - b.priority;
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });
  }

  const cycleStatus = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = NEXT_STATUS[task.status];
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  const openDrawer = (task: Task) => {
    setDrawerTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date || '');
    setEditDescription(task.description || '');
    setEditAssignees(task.assignees.map(a => a.id));
    setEditBlockers(task.blockers);
    setBlockerSearch('');
  };

  const saveDrawer = async () => {
    if (!drawerTask) return;
    await fetch(`/api/tasks/${drawerTask.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle, category: editCategory, status: editStatus,
        priority: editPriority, due_date: editDueDate || null, description: editDescription,
      }),
    });
    await fetch(`/api/tasks/${drawerTask.id}/assignees`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person_ids: editAssignees }),
    });
    await fetch(`/api/tasks/${drawerTask.id}/blockers`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocking_task_ids: editBlockers }),
    });
    setDrawerTask(null);
    fetchTasks();
  };

  const deleteTask = async () => {
    if (!drawerTask) return;
    await fetch(`/api/tasks/${drawerTask.id}`, { method: 'DELETE' });
    setDrawerTask(null);
    fetchTasks();
  };

  const createTask = async () => {
    if (!newTaskTitle.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle, category: newTaskCategory }),
    });
    setNewTaskTitle('');
    fetchTasks();
  };

  const addPerson = async () => {
    if (!newPersonName.trim()) return;
    await fetch('/api/people', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPersonName, color: newPersonColor }),
    });
    setNewPersonName('');
    fetchPeople();
  };

  const deletePerson = async (id: number) => {
    await fetch(`/api/people/${id}`, { method: 'DELETE' });
    fetchPeople();
    fetchTasks();
  };

  // Group by category
  const grouped = groupByCategory ? Object.keys(CATEGORIES).reduce((acc, cat) => {
    const catTasks = filtered.filter(t => t.category === cat);
    if (catTasks.length > 0) acc[cat] = catTasks;
    return acc;
  }, {} as Record<string, Task[]>) : {};

  const blockerResults = tasks.filter(t =>
    t.id !== drawerTask?.id &&
    !editBlockers.includes(t.id) &&
    t.title.toLowerCase().includes(blockerSearch.toLowerCase())
  ).slice(0, 8);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="header-title">LAURINO&apos;S — TASK BOARD</span>
          <span className="header-deadline">Global Deadline: June 15</span>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={() => setShowPeopleModal(true)}>👤 People</button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="toolbar">
        <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />

        {/* Category multi-select */}
        <div className="multi-select" ref={catRef}>
          <div className="multi-select-trigger" onClick={() => setShowCatDropdown(!showCatDropdown)}>
            {categoryFilter.length === 0 ? 'All Categories' : `${categoryFilter.length} selected`} ▾
          </div>
          {showCatDropdown && (
            <div className="multi-select-dropdown">
              {Object.entries(CATEGORIES).map(([key, val]) => (
                <label className="multi-select-item" key={key}>
                  <input type="checkbox" checked={categoryFilter.includes(key)}
                    onChange={() => setCategoryFilter(prev =>
                      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
                    )} />
                  <span style={{ color: val.color }}>{val.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Assignee multi-select */}
        <div className="multi-select" ref={assRef}>
          <div className="multi-select-trigger" onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}>
            {assigneeFilter.length === 0 ? 'All Assignees' : `${assigneeFilter.length} selected`} ▾
          </div>
          {showAssigneeDropdown && (
            <div className="multi-select-dropdown">
              {people.map(p => (
                <label className="multi-select-item" key={p.id}>
                  <input type="checkbox" checked={assigneeFilter.includes(p.id)}
                    onChange={() => setAssigneeFilter(prev =>
                      prev.includes(p.id) ? prev.filter(a => a !== p.id) : [...prev, p.id]
                    )} />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Status pills */}
        <div className="pill-group">
          {['all', 'open', 'in_progress', 'done'].map(s => (
            <button key={s} className={`pill ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Priority pills */}
        <div className="pill-group">
          {['all', '1', '2', '3'].map(p => (
            <button key={p} className={`pill ${priorityFilter === p ? 'active' : ''}`}
              onClick={() => setPriorityFilter(p)}>
              {p === 'all' ? 'All' : PRIORITY_LABELS[Number(p)]}
            </button>
          ))}
        </div>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="">Default Sort</option>
          <option value="due_date_asc">Due Date (Asc)</option>
          <option value="due_date_desc">Due Date (Desc)</option>
          <option value="priority">Priority</option>
          <option value="category">Category</option>
          <option value="status">Status</option>
        </select>

        <button className={`pill ${groupByCategory ? 'active' : ''}`}
          onClick={() => setGroupByCategory(!groupByCategory)}>
          Group by Category
        </button>
      </div>

      {/* New Task */}
      <div className="new-task-inline">
        <input type="text" placeholder="New task title..." value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createTask()} />
        <select value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value)}>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button className="btn btn-gold" onClick={createTask}>+ Add Task</button>
      </div>

      {/* Task Grid */}
      {groupByCategory ? (
        Object.entries(grouped).map(([cat, catTasks]) => {
          const info = CATEGORIES[cat];
          const doneCount = catTasks.filter(t => t.status === 'done').length;
          const overdueCount = catTasks.filter(t => isOverdue(t.due_date) && t.status !== 'done').length;
          return (
            <div key={cat} className="category-group">
              <div className="category-header">
                <h2 style={{ color: info.color }}>{info.label}</h2>
                <span className="category-stats">
                  {catTasks.length} tasks | {doneCount} done{overdueCount > 0 ? ` | ${overdueCount} overdue` : ''}
                </span>
              </div>
              <div className="task-grid">
                {catTasks.map(task => (
                  <TaskCard key={task.id} task={task} onOpen={openDrawer} onCycleStatus={cycleStatus} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="task-grid flat">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} onOpen={openDrawer} onCycleStatus={cycleStatus} />
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerTask && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerTask(null)} />
          <div className="drawer">
            <h2>EDIT TASK</h2>
            <div className="drawer-field">
              <label>Title</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div className="drawer-field">
              <label>Category</label>
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="drawer-field">
              <label>Status</label>
              <div className="segmented">
                {['open', 'in_progress', 'done'].map(s => (
                  <button key={s} className={editStatus === s ? 'active' : ''}
                    style={editStatus === s ? { background: STATUS_COLORS[s], color: s === 'open' ? '#fff' : '#0d0d0d' } : {}}
                    onClick={() => setEditStatus(s)}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="drawer-field">
              <label>Priority</label>
              <div className="segmented">
                {[1, 2, 3].map(p => (
                  <button key={p} className={editPriority === p ? 'active' : ''}
                    style={editPriority === p ? { background: PRIORITY_COLORS[p], color: '#0d0d0d' } : {}}
                    onClick={() => setEditPriority(p)}>
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div className="drawer-field">
              <label>Due Date</label>
              <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
            </div>
            <div className="drawer-field">
              <label>Description</label>
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} />
            </div>
            <div className="drawer-field">
              <label>Assignees</label>
              <div className="chip-list">
                {people.map(p => (
                  <button key={p.id}
                    className={`chip ${editAssignees.includes(p.id) ? 'selected' : ''}`}
                    style={editAssignees.includes(p.id) ? { borderColor: p.color, background: p.color + '25' } : {}}
                    onClick={() => setEditAssignees(prev =>
                      prev.includes(p.id) ? prev.filter(a => a !== p.id) : [...prev, p.id]
                    )}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="drawer-field">
              <label>Blocking Tasks</label>
              <div className="chip-list">
                {editBlockers.map(bid => {
                  const bt = tasks.find(t => t.id === bid);
                  return bt ? (
                    <button key={bid} className="chip selected"
                      onClick={() => setEditBlockers(prev => prev.filter(b => b !== bid))}>
                      {bt.title} ✕
                    </button>
                  ) : null;
                })}
              </div>
              <div className="blocker-search">
                <input type="text" placeholder="Search tasks to add as blocker..."
                  value={blockerSearch}
                  onChange={e => { setBlockerSearch(e.target.value); setShowBlockerDropdown(true); }}
                  onFocus={() => setShowBlockerDropdown(true)} />
                {showBlockerDropdown && blockerSearch && (
                  <div className="blocker-dropdown">
                    {blockerResults.map(t => (
                      <div key={t.id} className="blocker-dropdown-item"
                        onClick={() => {
                          setEditBlockers(prev => [...prev, t.id]);
                          setBlockerSearch('');
                          setShowBlockerDropdown(false);
                        }}>
                        <span style={{ color: CATEGORIES[t.category]?.color }}>[{CATEGORIES[t.category]?.label}]</span> {t.title}
                      </div>
                    ))}
                    {blockerResults.length === 0 && <div className="blocker-dropdown-item" style={{ color: '#555' }}>No results</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="drawer-actions">
              <button className="btn btn-gold" onClick={saveDrawer}>Save Changes</button>
              <button className="btn btn-danger" onClick={deleteTask}>Delete Task</button>
              <button className="btn" onClick={() => setDrawerTask(null)}>Cancel</button>
            </div>
          </div>
        </>
      )}

      {/* People Modal */}
      {showPeopleModal && (
        <div className="modal-overlay" onClick={() => setShowPeopleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>MANAGE PEOPLE</h2>
            {people.map(p => (
              <div key={p.id} className="modal-person">
                <div className="modal-person-info">
                  <div className="assignee-avatar" style={{ background: p.color, marginLeft: 0 }}>
                    {initials(p.name)}
                  </div>
                  <span>{p.name}</span>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deletePerson(p.id)}>Remove</button>
              </div>
            ))}
            <div className="modal-form">
              <input type="text" placeholder="Name" value={newPersonName}
                onChange={e => setNewPersonName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPerson()} />
              <button className="btn btn-gold btn-sm" onClick={addPerson}>Add</button>
            </div>
            <div className="color-swatches">
              {COLOR_SWATCHES.map(c => (
                <div key={c} className={`color-swatch ${newPersonColor === c ? 'active' : ''}`}
                  style={{ background: c }} onClick={() => setNewPersonColor(c)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TaskCard({ task, onOpen, onCycleStatus }: {
  task: Task;
  onOpen: (t: Task) => void;
  onCycleStatus: (t: Task, e: React.MouseEvent) => void;
}) {
  const cat = CATEGORIES[task.category];
  const catColor = cat?.color || '#888';

  return (
    <div
      className={`task-card ${task.status === 'done' ? 'done' : ''} ${shouldPulse(task) ? 'pulse-border' : ''}`}
      onClick={() => onOpen(task)}
    >
      <div className="task-card-top">
        <span className="category-badge"
          style={{ background: catColor + '33', color: catColor }}>
          {cat?.label || task.category}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="priority-dot" style={{ background: PRIORITY_COLORS[task.priority] }} />
          <button className="status-toggle"
            style={{ background: STATUS_COLORS[task.status] + '33', color: STATUS_COLORS[task.status] }}
            onClick={(e) => onCycleStatus(task, e)}>
            {STATUS_LABELS[task.status]}
          </button>
        </div>
      </div>
      <div className="task-card-title">{task.title}</div>
      <div className="task-card-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {task.due_date && (
            <span className={`task-card-due ${isOverdue(task.due_date) && task.status !== 'done' ? 'overdue' : ''} ${isSoon(task.due_date) && !isOverdue(task.due_date) ? 'soon' : ''}`}>
              📅 {task.due_date}
            </span>
          )}
          {task.blockers.length > 0 && (
            <span className="blocker-badge">🔒 {task.blockers.length}</span>
          )}
        </div>
        {task.assignees.length > 0 && (
          <div className="assignee-stack">
            {task.assignees.slice(0, 3).map(a => (
              <div key={a.id} className="assignee-avatar" style={{ background: a.color }}>
                {initials(a.name)}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="assignee-avatar" style={{ background: '#555' }}>+{task.assignees.length - 3}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
