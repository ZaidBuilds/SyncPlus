import { useState, useEffect, useRef, useCallback } from 'react';
import { dataClient } from '@/lib/dataClient';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon
} from 'lucide-react';
import { 
  format, addDays, subDays, startOfWeek, isToday
} from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const HOUR_HEIGHT = 64;
const START_HOUR = 0;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

export default function Calendar() {
  const [view, setView] = useState('day'); // 'day' | 'week'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [blocks, setBlocks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const scrollRef = useRef(null);

  const load = useCallback(async () => {
    const [b, t] = await Promise.all([
      dataClient.entities.TimeBlock.list('-date', 1000),
      dataClient.entities.Task.list('-created_date', 500),
    ]);
    setBlocks(b);
    setTasks(t);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (scrollRef.current && view === 'day') {
      const now = new Date();
      const top = (now.getHours() * HOUR_HEIGHT) - 100;
      scrollRef.current.scrollTop = top;
    }
  }, [view, loading]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const navigateDate = (direction) => {
    if (view === 'day') setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
    else if (view === 'week') setCurrentDate(direction === 'next' ? addDays(currentDate, 7) : subDays(currentDate, 7));
  };

  const getBlocksForDay = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return blocks.filter(b => b.date === dateStr);
  };

  const getTasksForDay = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return tasks.filter(t => t.due_date === dateStr && t.status !== 'done');
  };

  const timeToPixels = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h * HOUR_HEIGHT) + (m / 60 * HOUR_HEIGHT);
  };

  const durationPixels = (start, end) => {
    return timeToPixels(end) - timeToPixels(start);
  };

  if (loading) return <div className="flex items-center justify-center h-full text-xs font-black uppercase tracking-widest">Loading Vantage Calendar...</div>;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col -m-6 md:-m-8 bg-background overflow-hidden border-4 border-foreground">
      {/* Header */}
      <header className="px-6 py-4 border-b-4 border-foreground flex items-center justify-between bg-background z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-foreground p-2 rounded-none text-background">
              <CalendarIcon size={20} />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">
              {format(currentDate, 'MMMM d')}
            </h2>
          </div>
          
          <div className="flex items-center gap-1 border-2 border-foreground">
            <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-foreground hover:text-background transition-colors border-r-2 border-foreground"><ChevronLeft size={18} /></button>
            <button onClick={() => navigateDate('next')} className="p-2 hover:bg-foreground hover:text-background transition-colors"><ChevronRight size={18} /></button>
          </div>

          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 border-2 border-foreground font-black uppercase tracking-widest text-[10px] hover:bg-foreground hover:text-background transition-all"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center border-2 border-foreground">
            {['day', 'week'].map(v => (
              <button 
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  view === v ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Day Headers */}
          <div className="flex border-b-2 border-foreground bg-background">
            <div className="w-20 flex-shrink-0" />
            <div className="flex-1 flex">
              {(view === 'day' ? [currentDate] : weekDays).map((day, i) => (
                <div key={i} className="flex-1 py-4 text-center border-l-2 border-foreground first:border-l-0">
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isToday(day) ? "text-foreground" : "text-muted-foreground")}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={cn(
                    "text-3xl font-black mt-1",
                    isToday(day) ? "underline decoration-4 underline-offset-4" : ""
                  )}>
                    {format(day, 'd')}
                  </p>
                  
                  {getTasksForDay(day).length > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-foreground text-background rounded-none text-[9px] font-black uppercase tracking-widest">
                      {getTasksForDay(day).length} PENDING
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable Time Grid */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto relative bg-background custom-scrollbar">
            {/* Hour labels */}
            <div className="absolute left-0 top-0 w-20 h-full flex flex-col pointer-events-none z-10 border-r-2 border-foreground bg-background">
              {HOURS.map(hour => (
                <div key={hour} className="h-[64px] relative">
                  <span className="absolute -top-2 right-2 text-[10px] text-foreground font-black uppercase">
                    {hour === 0 ? '' : format(new Date().setHours(hour, 0), 'ha')}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid lines & Blocks */}
            <div className="flex h-[1536px] pl-20 relative">
              {(view === 'day' ? [currentDate] : weekDays).map((day, dayIdx) => {
                const dayBlocks = getBlocksForDay(day);
                const isTodayActive = isToday(day);

                return (
                  <div key={dayIdx} className="flex-1 h-full border-l-2 border-foreground/20 first:border-l-0 relative">
                    {/* Horizontal grid lines */}
                    {HOURS.map(hour => (
                      <div key={hour} className="h-[64px] border-b border-foreground/10" />
                    ))}

                    {/* Blocks */}
                    <AnimatePresence>
                      {dayBlocks.map(block => {
                        const top = timeToPixels(block.start_time);
                        const height = durationPixels(block.start_time, block.end_time);
                        return (
                          <motion.div
                            key={block.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute left-1 right-1 border-2 border-foreground bg-background p-3 overflow-hidden z-10 cursor-pointer group hover:bg-foreground hover:text-background transition-all"
                            style={{ top, height }}
                          >
                            <p className="text-[9px] font-black uppercase tracking-tighter opacity-70 mb-1">{block.start_time} — {block.end_time}</p>
                            <p className="text-xs font-black uppercase tracking-tight leading-tight">{block.title}</p>
                            <div className="absolute bottom-1 right-2 text-[10px] font-black opacity-40 group-hover:opacity-100">{block.type}</div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {/* Current Time Indicator */}
                    {isTodayActive && (
                      <div 
                        className="absolute left-0 right-0 z-20 pointer-events-none"
                        style={{ top: timeToPixels(format(new Date(), 'HH:mm')) }}
                      >
                        <div className="flex items-center -ml-1">
                          <div className="w-2.5 h-2.5 bg-red-500" />
                          <div className="h-0.5 flex-1 bg-red-500" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="absolute bottom-8 right-8 w-16 h-16 bg-foreground text-background rounded-none shadow-2xl flex items-center justify-center hover:scale-105 transition-transform border-4 border-background outline outline-4 outline-foreground">
        <Plus size={28} />
      </button>
    </div>
  );
}
