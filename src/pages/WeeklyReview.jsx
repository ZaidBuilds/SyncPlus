import { useState, useEffect, useCallback, useMemo } from 'react';
import { dataClient } from '@/lib/dataClient';
import { Sparkles, Target, Plus, 
  FileDown, LayoutGrid, ListChecks, 
  History, Calendar
} from 'lucide-react';
import { 
  format, startOfWeek, endOfWeek, subWeeks, eachDayOfInterval, isToday 
} from 'date-fns';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function WeeklyReview() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState({
    tasks: [],
    habits: [],
    habitLogs: [],
    journalEntries: [],
    goals: [],
    projects: [],
    priorities: null
  });
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('review'); // 'review' | 'planning'
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const weekStart = useMemo(() => startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 }), [weekOffset]);
  const weekEnd = useMemo(() => endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 }), [weekOffset]);
  const days = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart, weekEnd]);

  const load = useCallback(async () => {
    setLoading(true);
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const [t, h, hl, j, g, p, wp] = await Promise.all([
      dataClient.entities.Task.list('-updated_date', 1000),
      dataClient.entities.Habit.list('-created_date', 100),
      dataClient.entities.HabitLog.list('-date', 1000),
      dataClient.entities.JournalEntry.list('-date', 100),
      dataClient.entities.Goal.list('-created_date', 100),
      dataClient.entities.Project.list('-created_date', 200),
      dataClient.entities.WeeklyPriority.filter({ week_start: weekStartStr }, '-created_date', 1),
    ]);
    
    setData({
      tasks: t,
      habits: h,
      habitLogs: hl,
      journalEntries: j,
      goals: g,
      projects: p,
      priorities: wp[0] || { week_start: weekStartStr, priorities: ['', '', ''], intention: '' }
    });
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { load(); }, [load]);

  const exportPDF = async () => {
    const element = document.getElementById('weekly-report-content');
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Vantage_Report_${format(weekStart, 'yyyy_MM_dd')}.pdf`);
  };

  const weekTasks = data.tasks.filter(t => t.due_date >= format(weekStart, 'yyyy-MM-dd') && t.due_date <= format(weekEnd, 'yyyy-MM-dd'));
  const doneTasks = weekTasks.filter(t => t.status === 'done');
  const taskRate = weekTasks.length > 0 ? Math.round((doneTasks.length / weekTasks.length) * 100) : 0;
  
  const activeGoals = data.goals.filter(g => g.status === 'active');

  if (loading) return <div className="flex items-center justify-center h-64 text-xs font-black uppercase tracking-widest">Compiling Weekly Data...</div>;

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-20">
      
      {/* Enterprise Header */}
      <div className="flex items-end justify-between border-b-4 border-foreground pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-foreground text-background px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">Executive Summary</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">Weekly Hub</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border-2 border-foreground">
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-3 border-r-2 border-foreground hover:bg-muted"><History size={18} /></button>
            <button onClick={() => setWeekOffset(0)} className={cn("px-4 py-2 text-xs font-black uppercase tracking-widest", weekOffset === 0 ? "bg-foreground text-background" : "hover:bg-muted")}>Current</button>
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-3 border-l-2 border-foreground hover:bg-muted"><Calendar size={18} /></button>
          </div>
          <button onClick={exportPDF} className="bg-foreground text-background px-6 py-3 font-black uppercase tracking-widest text-xs hover:invert transition-all flex items-center gap-2 shadow-lg">
            <FileDown size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex border-b-2 border-foreground">
        <button onClick={() => setMode('review')} className={cn("px-8 py-4 text-sm font-black uppercase tracking-widest transition-all", mode === 'review' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>Review Mon — Sun</button>
        <button onClick={() => setMode('planning')} className={cn("px-8 py-4 text-sm font-black uppercase tracking-widest transition-all", mode === 'planning' ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>Strategic Planning</button>
      </div>

      <div id="weekly-report-content" className="space-y-12 bg-background p-4">
        
        {mode === 'review' ? (
          <>
            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-4 border-foreground divide-x-4 divide-foreground">
              <KPICard label="Execution Rate" value={`${taskRate}%`} sub={`${doneTasks.length} tasks completed`} />
              <KPICard label="Momentum" value={doneTasks.length > 5 ? 'High' : 'Stable'} sub="Based on task density" />
              <KPICard label="Focus Points" value={activeGoals.length} sub="Active strategic pillars" />
            </div>

            {/* Mon-Sun Activity Grid */}
            <section className="space-y-6">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <LayoutGrid size={24} /> Activity Spectrum
              </h3>
              <div className="grid grid-cols-7 gap-px bg-foreground border-2 border-foreground">
                {days.map(day => {
                  const dayTasks = data.tasks.filter(t => t.due_date === format(day, 'yyyy-MM-dd'));
                  const dayHabits = data.habitLogs.filter(l => l.date === format(day, 'yyyy-MM-dd') && l.completed);
                  const hasJournal = data.journalEntries.find(j => j.date === format(day, 'yyyy-MM-dd'));
                  
                  return (
                    <div key={day.toString()} className={cn("bg-background p-4 min-h-[160px] space-y-4", isToday(day) && "ring-inset ring-4 ring-foreground")}>
                      <div className="flex flex-col border-b border-foreground/10 pb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{format(day, 'EEE')}</span>
                        <span className="text-xl font-black">{format(day, 'd')}</span>
                      </div>
                      <div className="space-y-1">
                        {dayTasks.map(t => (
                          <div key={t.id} className={cn("w-2 h-2 rounded-none", t.status === 'done' ? "bg-foreground" : "border border-foreground")} title={t.title} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dayHabits.map(h => (
                          <div key={h.id} className="w-1.5 h-1.5 bg-foreground/20 rounded-full" />
                        ))}
                      </div>
                      {hasJournal && <div className="text-[10px] font-black uppercase tracking-tighter bg-foreground text-background px-1 inline-block">Reflected</div>}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Coach Insight */}
            <section className="bg-foreground text-background p-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Sparkles size={28} /> Strategic Feedback
                </h3>
                <button 
                  onClick={() => setAiReview({})} 
                  className="border-2 border-background px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-background hover:text-foreground transition-all"
                >
                  Generate Insight
                </button>
              </div>
              <p className="text-sm opacity-80 leading-relaxed font-medium">
                Your execution rate of {taskRate}% indicates {taskRate > 70 ? 'strong alignment with your goals.' : 'a need for better task atomicity. Consider breaking your projects into smaller, 15-minute blocks.'} You were most active on {tasksByDayMax(data.tasks, days)} this week.
              </p>
            </section>
          </>
        ) : (
          /* Planning Mode */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Decentralized Goals: Breakdown */}
            <section className="space-y-8">
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <Target size={24} /> Decentralized Breakdown
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-loose">
                Don&apos;t plan the goal. Plan the actions. Split your active pillars into small, weekly blocks.
              </p>
              <div className="space-y-4">
                {activeGoals.map(goal => (
                  <div key={goal.id} className="border-4 border-foreground p-6 space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-foreground pb-2">
                      <h4 className="font-black uppercase tracking-tight">{goal.title}</h4>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Strategic Pillar</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input className="flex-1 border-2 border-foreground px-3 py-2 text-xs font-bold bg-background outline-none focus:bg-foreground focus:text-background transition-all" placeholder="This week's small step..." />
                        <button className="bg-foreground text-background px-4 font-black"><Plus size={14} /></button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <ListChecks size={12} /> 0/3 Actions Defined
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Intention & Priorities */}
            <section className="bg-foreground text-background p-10 space-y-10">
              <div className="space-y-2">
                <h3 className="text-3xl font-black uppercase tracking-tighter">Vantage Intent</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Strategic Focus for the upcoming cycle</p>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-3 opacity-60">Primary Intention</label>
                  <textarea 
                    className="w-full bg-transparent border-b-4 border-background text-2xl font-black tracking-tight placeholder:opacity-20 outline-none p-2 resize-none h-24"
                    placeholder="WHAT IS THE ONE THING?"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest block opacity-60">Mission Critical Actions</label>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-4xl font-black opacity-20">{i}</span>
                      <input className="flex-1 bg-transparent border-b-2 border-background/20 py-2 text-sm font-bold placeholder:opacity-20 outline-none focus:border-background transition-all" placeholder="..." />
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full bg-background text-foreground py-4 text-xs font-black uppercase tracking-[0.3em] hover:invert transition-all">
                Lock in Strategy
              </button>
            </section>

          </div>
        )}

      </div>
    </div>
  );
}

function KPICard({ label, value, sub }) {
  return (
    <div className="bg-background p-8 space-y-2 group hover:bg-foreground hover:text-background transition-all">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-background/60">{label}</p>
      <div className="text-5xl font-black tracking-tighter leading-none">{value}</div>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{sub}</p>
    </div>
  );
}

function tasksByDayMax(tasks, days) {
  const counts = days.map(d => tasks.filter(t => t.due_date === format(d, 'yyyy-MM-dd')).length);
  const maxIdx = counts.indexOf(Math.max(...counts));
  return format(days[maxIdx], 'EEEE');
}
