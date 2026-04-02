import { useState } from 'react';
import { dataClient } from '@/lib/dataClient';
import { CheckCircle2, Plus, Flame, BookOpen, FolderOpen, ListTodo, Zap } from 'lucide-react';
import { getGoalTypeForArea } from '@/lib/workspaceSchema';

export default function PlanOutput({ plan, goalText, areaId = 'learning', onSaved }) {
  const [saved, setSaved] = useState({ goal: false, projects: {}, habits: {} });
  const [loading, setLoading] = useState({ goal: false, all: false });
  const goalType = getGoalTypeForArea(areaId);

  // Save the top-level goal
  const saveGoal = async () => {
    setLoading(l => ({ ...l, goal: true }));
    await dataClient.entities.Goal.create({
      title: plan.goal_title,
      description: plan.goal_description,
      status: 'active',
      type: goalType,
      area_id: areaId,
    });
    setSaved(s => ({ ...s, goal: true }));
    setLoading(l => ({ ...l, goal: false }));
    onSaved?.();
  };

  // Save a single project + its tasks
  const saveProject = async (project, goalId) => {
    setLoading(l => ({ ...l, [`proj_${project.title}`]: true }));
    const created = await dataClient.entities.Project.create({
      title: project.title,
      description: project.description,
      status: 'not_started',
      type: goalType,
      goal_id: goalId || undefined,
      area_id: areaId,
    });
    for (const task of project.tasks) {
      await dataClient.entities.Task.create({
        title: task.title,
        project_id: created.id,
        goal_id: goalId || undefined,
        priority: task.priority || 'medium',
        status: 'todo',
        estimated_time: task.estimated_time || undefined,
        area_id: areaId,
      });
    }
    setSaved(s => ({ ...s, projects: { ...s.projects, [project.title]: true } }));
    setLoading(l => ({ ...l, [`proj_${project.title}`]: false }));
    onSaved?.();
  };

  // Save a habit
  const saveHabit = async (habit) => {
    setLoading(l => ({ ...l, [`habit_${habit.name}`]: true }));
    await dataClient.entities.Habit.create({
      name: habit.name,
      description: habit.description,
      frequency: 'daily',
      color: '#6366f1',
      area_id: areaId,
    });
    setSaved(s => ({ ...s, habits: { ...s.habits, [habit.name]: true } }));
    setLoading(l => ({ ...l, [`habit_${habit.name}`]: false }));
    onSaved?.();
  };

  // Save EVERYTHING at once
  const saveAll = async () => {
    setLoading(l => ({ ...l, all: true }));
    const goal = await dataClient.entities.Goal.create({
      title: plan.goal_title,
      description: plan.goal_description,
      status: 'active',
      type: goalType,
      area_id: areaId,
    });
    for (const project of plan.projects) {
      const created = await dataClient.entities.Project.create({
        title: project.title,
        description: project.description,
        status: 'not_started',
        type: goalType,
        goal_id: goal.id,
        area_id: areaId,
      });
      for (const task of project.tasks) {
        await dataClient.entities.Task.create({
          title: task.title,
          project_id: created.id,
          goal_id: goal.id,
          priority: task.priority || 'medium',
          status: 'todo',
          estimated_time: task.estimated_time || undefined,
          area_id: areaId,
        });
      }
    }
    for (const habit of (plan.daily_habits || [])) {
      await dataClient.entities.Habit.create({
        name: habit.name,
        description: habit.description,
        frequency: 'daily',
        color: '#6366f1',
        area_id: areaId,
      });
    }
    setSaved({ goal: true, projects: Object.fromEntries(plan.projects.map(p => [p.title, true])), habits: Object.fromEntries((plan.daily_habits || []).map(h => [h.name, true])) });
    setLoading(l => ({ ...l, all: false }));
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      {/* Header + Save All */}
      <div className="bg-gradient-to-r from-primary/10 to-accent rounded-xl p-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold">{plan.goal_title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{plan.goal_description}</p>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={saveAll}
            disabled={loading.all}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            <Zap size={12} />
            {loading.all ? 'Saving All...' : '⚡ Execute All → Save to App'}
          </button>
          {!saved.goal && (
            <button
              onClick={saveGoal}
              disabled={loading.goal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary text-primary text-xs font-semibold hover:bg-accent disabled:opacity-60 transition-all"
            >
              <Plus size={12} /> Save Goal Only
            </button>
          )}
          {saved.goal && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 size={12} /> Goal saved!
            </span>
          )}
        </div>
      </div>

      {/* Learning Path */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10">
          <BookOpen size={14} className="text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Learning Path</h3>
        </div>
        <div className="divide-y divide-border">
          {(plan.learning_path || []).map((phase, i) => (
            <div key={i} className="px-5 py-3 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {phase.phase}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{phase.title}</p>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{phase.duration}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FolderOpen size={14} className="text-primary" />
          <h3 className="text-sm font-semibold">Projects to Build</h3>
          <span className="text-xs text-muted-foreground">({plan.projects?.length || 0} projects)</span>
        </div>
        {(plan.projects || []).map((project, i) => (
          <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{project.title}</p>
                  <p className="text-xs text-muted-foreground">{project.description}</p>
                </div>
              </div>
              {saved.projects[project.title] ? (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium flex-shrink-0">
                  <CheckCircle2 size={12} /> Saved
                </span>
              ) : (
                <button
                  onClick={() => saveProject(project)}
                  disabled={loading[`proj_${project.title}`]}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 disabled:opacity-60 flex-shrink-0 transition-all"
                >
                  <ListTodo size={11} />
                  {loading[`proj_${project.title}`] ? 'Saving...' : `Save + ${project.tasks?.length || 0} Tasks`}
                </button>
              )}
            </div>
            <div className="divide-y divide-border">
              {(project.tasks || []).map((task, j) => (
                <div key={j} className="flex items-center gap-3 px-5 py-2">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'low' ? 'bg-gray-400' : 'bg-amber-500'}`} />
                  <p className="text-xs flex-1">{task.title}</p>
                  {task.estimated_time && (
                    <span className="text-xs text-muted-foreground">{task.estimated_time}m</span>
                  )}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'low' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-600'}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Daily Habits */}
      {(plan.daily_habits || []).length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-orange-50 dark:bg-orange-900/10">
            <Flame size={14} className="text-orange-500" />
            <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400">Suggested Daily Habits</h3>
          </div>
          <div className="divide-y divide-border">
            {(plan.daily_habits || []).map((habit, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{habit.name}</p>
                  {habit.description && <p className="text-xs text-muted-foreground">{habit.description}</p>}
                </div>
                {saved.habits[habit.name] ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-medium flex-shrink-0">
                    <CheckCircle2 size={12} /> Saved
                  </span>
                ) : (
                  <button
                    onClick={() => saveHabit(habit)}
                    disabled={loading[`habit_${habit.name}`]}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-xs font-semibold hover:bg-orange-200 disabled:opacity-60 flex-shrink-0 transition-all"
                  >
                    <Plus size={11} />
                    {loading[`habit_${habit.name}`] ? '...' : 'Add Habit'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
