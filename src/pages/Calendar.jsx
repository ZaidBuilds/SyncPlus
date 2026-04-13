import { useState, useEffect, useRef, useCallback } from 'react';
import { dataClient } from '@/lib/dataClient';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, GripVertical } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';

const TYPE_BG = {
  deep_work: '#1a73e8',
  learning: '#8b5cf6',
  outreach: '#16a34a',
  meeting: '#d97706',
  personal: '#db2777',
  other: '#64748b',
};

const HOUR_HEIGHT = 64;
const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function snapMinutes(m) {
  return Math.round(m / 15) * 15;
}

function BlockModal({ block, tasks, date, onSave, onDelete, onClose }) {
  const defaults = { title: '', date, start_time: '09:00', end_time: '10:00', type: 'deep_work', task_id: '' };
  const [form, setForm] = useState(block?.id ? { ...block } : { ...defaults, ...(block || {}) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">{block?.id ? 'Edit Block' : 'New Block'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <input
            autoFocus
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            placeholder="Block title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSave(form)}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start</label>
              <input
                type="time"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End</label>
              <input
                type="time"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(TYPE_BG).map(([key, color]) => (
              <button
                key={key}
                onClick={() => setForm({ ...form, type: key })}
                className={`text-xs px-2 py-1.5 rounded-lg border-2 font-medium capitalize transition-all ${form.type === key ? 'border-transparent text-white' : 'border-border bg-secondary text-muted-foreground'}`}
                style={{ backgroundColor: form.type === key ? color : undefined }}
              >
                {key.replace('_', ' ')}
              </button>
            ))}
          </div>
          <select
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
            value={form.task_id || ''}
            onChange={(e) => setForm({ ...form, task_id: e.target.value })}
          >
            <option value="">— Link task (optional) —</option>
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div className="flex justify-between mt-4">
          {block?.id && <button onClick={() => onDelete(block.id)} className="text-xs text-red-500 flex items-center gap-1 hover:underline"><Trash2 size={12} /> Delete</button>}
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-secondary">Cancel</button>
            <button onClick={() => onSave(form)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [blocks, setBlocks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(null);
  const [localBlocks, setLocalBlocks] = useState({});
  const gridRef = useRef(null);
  const dragStateRef = useRef(null);

  const load = async () => {
    const [b, t] = await Promise.all([
      dataClient.entities.CalendarBlock.filter({ date: selectedDate }, 'start_time', 50),
      dataClient.entities.Task.filter({ status: 'todo' }, '-created_date', 100),
    ]);
    setBlocks(b);
    setTasks(t);
    setLoading(false);
    setLocalBlocks({});
  };

  useEffect(() => { load(); }, [selectedDate]);

  useEffect(() => {
    if (!loading && gridRef.current) {
      gridRef.current.scrollTop = (8 - 5) * HOUR_HEIGHT;
    }
  }, [loading]);

  const save = async (form) => {
    if (form.id) await dataClient.entities.CalendarBlock.update(form.id, form);
    else await dataClient.entities.CalendarBlock.create(form);
    setModal(null);
    load();
  };

  const del = async (id) => {
    await dataClient.entities.CalendarBlock.delete(id);
    setModal(null);
    load();
  };

  const getGridY = useCallback((clientY) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    return clientY - rect.top + gridRef.current.scrollTop;
  }, []);

  const yToMinutes = (y) => snapMinutes((y / HOUR_HEIGHT) * 60 + 5 * 60);

  const onBlockMouseDown = (e, block) => {
    e.stopPropagation();
    e.preventDefault();
    const blockTop = ((timeToMinutes(block.start_time) - 5 * 60) / 60) * HOUR_HEIGHT;
    const offsetY = getGridY(e.clientY) - blockTop;
    dragStateRef.current = { blockId: block.id, offsetY, type: 'move', block };
    setDragging({ blockId: block.id, type: 'move' });
  };

  const onResizeMouseDown = (e, block) => {
    e.stopPropagation();
    e.preventDefault();
    dragStateRef.current = { blockId: block.id, type: 'resize', block };
    setDragging({ blockId: block.id, type: 'resize' });
  };

  const onMouseMove = useCallback((e) => {
    const ds = dragStateRef.current;
    if (!ds) return;
    const y = getGridY(e.clientY);

    if (ds.type === 'move') {
      const topY = y - ds.offsetY;
      const startMin = Math.max(5 * 60, Math.min(yToMinutes(topY), 22 * 60));
      const duration = timeToMinutes(ds.block.end_time) - timeToMinutes(ds.block.start_time);
      const endMin = startMin + duration;
      setLocalBlocks((prev) => ({ ...prev, [ds.blockId]: { start_time: minutesToTime(startMin), end_time: minutesToTime(endMin) } }));
    } else if (ds.type === 'resize') {
      const endMin = Math.max(yToMinutes(y), timeToMinutes(ds.block.start_time) + 15);
      setLocalBlocks((prev) => ({ ...prev, [ds.blockId]: { start_time: ds.block.start_time, end_time: minutesToTime(endMin) } }));
    }
  }, [getGridY]);

  const onMouseUp = useCallback(async () => {
    const ds = dragStateRef.current;
    if (!ds) return;
    const override = localBlocks[ds.blockId];
    if (override) {
      await dataClient.entities.CalendarBlock.update(ds.blockId, override);
      load();
    }
    dragStateRef.current = null;
    setDragging(null);
  }, [localBlocks]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const handleGridClick = (e) => {
    if (dragStateRef.current) return;
    const y = getGridY(e.clientY);
    const startMin = snapMinutes((y / HOUR_HEIGHT) * 60 + 5 * 60);
    const endMin = startMin + 60;
    setModal({ date: selectedDate, start_time: minutesToTime(startMin), end_time: minutesToTime(endMin) });
  };

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const nowTop = ((nowMinutes - 5 * 60) / 60) * HOUR_HEIGHT;

  const getBlockDisplay = (block) => {
    const override = localBlocks[block.id];
    return override ? { ...block, ...override } : block;
  };

  return (
    <div className="flex flex-col h-full bg-background select-none">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronLeft size={16} /></button>
          <p className="text-sm font-semibold">{format(new Date(selectedDate), 'EEEE, d MMMM yyyy')}{isToday ? ' — Today' : ''}</p>
          <button onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))} className="p-1.5 rounded-lg hover:bg-secondary"><ChevronRight size={16} /></button>
          {!isToday && <button onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))} className="text-xs text-primary border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-accent">Today</button>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">Click grid to add · Drag to move · Drag bottom edge to resize</span>
          <button onClick={() => setModal({ date: selectedDate })} className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90">
            <Plus size={13} /> Add Block
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div
            ref={gridRef}
            className="flex-1 overflow-y-auto relative"
            onClick={handleGridClick}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={(e) => {
              e.preventDefault();
              const payload = e.dataTransfer.getData('application/json');
              if (payload) {
                const task = JSON.parse(payload);
                const y = getGridY(e.clientY);
                const startMin = snapMinutes((y / HOUR_HEIGHT) * 60 + 5 * 60);
                save({
                  title: task.title,
                  date: selectedDate,
                  start_time: minutesToTime(startMin),
                  end_time: minutesToTime(startMin + 60),
                  type: 'deep_work',
                  task_id: task.id
                });
              }
            }}
            style={{ cursor: dragging ? 'grabbing' : 'crosshair' }}
          >
            <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
              {HOURS.map((hour) => (
                <div key={hour} className="absolute w-full flex items-start pointer-events-none" style={{ top: `${(hour - 5) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}>
                  <div className="w-16 flex-shrink-0 text-right pr-3">
                    <span className="text-xs text-muted-foreground">{String(hour).padStart(2, '0')}:00</span>
                  </div>
                  <div className="flex-1 border-t border-border/40 h-full">
                    <div className="border-t border-border/20 mt-[50%]" />
                  </div>
                </div>
              ))}

              {isToday && nowTop > 0 && nowTop < HOURS.length * HOUR_HEIGHT && (
                <div className="absolute left-16 right-0 flex items-center z-20 pointer-events-none" style={{ top: `${nowTop}px` }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 flex-shrink-0" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              )}

              {blocks.map((block) => {
                const disp = getBlockDisplay(block);
                const startMin = timeToMinutes(disp.start_time);
                const endMin = timeToMinutes(disp.end_time);
                const top = ((startMin - 5 * 60) / 60) * HOUR_HEIGHT;
                const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);
                const color = TYPE_BG[block.type] || TYPE_BG.other;
                const linkedTask = tasks.find((t) => t.id === block.task_id);
                const isDraggingThis = dragging?.blockId === block.id;

                return (
                  <div
                    key={block.id}
                    className="absolute left-14 right-2 rounded-md overflow-hidden z-10 group border-l-4"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: `${color}E6`, // 90% opacity for solid colored blocks
                      borderColor: color,
                      opacity: isDraggingThis ? 0.7 : 1,
                      boxShadow: isDraggingThis ? '0 8px 24px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.1)',
                      cursor: dragging?.type === 'move' && isDraggingThis ? 'grabbing' : 'grab',
                    }}
                    onMouseDown={(e) => onBlockMouseDown(e, block)}
                    onClick={(e) => { if (!dragging) { e.stopPropagation(); setModal(block); } }}
                  >
                    <div className="px-2 py-1 h-full flex flex-col">
                      <div className="flex items-center gap-1">
                        <GripVertical size={10} className="text-white/40 group-hover:text-white/80 flex-shrink-0" />
                        <p className="text-xs font-semibold text-white leading-tight truncate flex-1">{block.title}</p>
                      </div>
                      {height > 36 && <p className="text-xs text-white/75 ml-4">{disp.start_time} – {disp.end_time}</p>}
                      {height > 52 && linkedTask && <p className="text-xs text-white/65 truncate ml-4">📌 {linkedTask.title}</p>}
                    </div>
                    <div
                      className="absolute bottom-0 left-0 right-0 h-3 flex items-center justify-center cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                      onMouseDown={(e) => onResizeMouseDown(e, block)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-8 h-0.5 bg-white/60 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-52 border-l border-border overflow-y-auto bg-card flex-shrink-0 hidden md:block">
            <div className="px-3 py-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Unscheduled Tasks</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Drag to calendar to schedule</p>
            </div>
            <div className="p-2 space-y-1">
              {tasks.filter((t) => !blocks.find((b) => b.task_id === t.id)).map((task) => (
                <div
                  key={task.id}
                  draggable="true"
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(task));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="w-full text-left text-xs px-2.5 py-2 rounded-md bg-secondary border border-border cursor-grab active:cursor-grabbing hover:shadow-sm transition-all"
                  onClick={() => setModal({ date: selectedDate, title: task.title, task_id: task.id })}
                >
                  <p className="font-medium line-clamp-2">{task.title}</p>
                </div>
              ))}
              {tasks.filter((t) => !blocks.find((b) => b.task_id === t.id)).length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-3 text-center">All tasks scheduled!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {modal !== null && (
        <BlockModal block={modal} tasks={tasks} date={selectedDate} onSave={save} onDelete={del} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
