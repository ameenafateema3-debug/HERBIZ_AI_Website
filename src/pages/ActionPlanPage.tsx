import { useState, type FormEvent } from 'react';
import { Plus, Trash2, Sparkles, Clock, CheckCircle2, Circle } from 'lucide-react';
import type { ActionPlanTask, RecommendationPriority, TaskStatus } from '../types/herbiz';
import { FICTIONAL_SAMPLE_ACTION_TASKS } from '../data/sampleDemoProfile';

interface ActionPlanPageProps {
  tasks: ActionPlanTask[];
  onAddTask: (task: Omit<ActionPlanTask, 'id' | 'createdAt'>) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDeleteTask: (id: string) => void;
  onLoadSampleTasks: (samples: ActionPlanTask[]) => void;
  onClearSampleTasks: () => void;
}

const FOCUS_AREAS = [
  'Financial Management',
  'Marketing & Reach',
  'Customer Retention',
  'Digital Adoption',
  'Operations & Capacity',
  'Registration & Resources',
];

const PRIORITY_OPTIONS: RecommendationPriority[] = ['High', 'Medium', 'Low'];
const STATUS_OPTIONS: TaskStatus[] = ['Not started', 'In progress', 'Completed'];

function getPriorityBadgeStyle(priority: RecommendationPriority): string {
  if (priority === 'High') {
    return 'border-purple-300 bg-purple-100 text-purple-950';
  }
  if (priority === 'Medium') {
    return 'border-pink-200 bg-pink-50 text-purple-900';
  }
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

export default function ActionPlanPage({
  tasks,
  onAddTask,
  onUpdateStatus,
  onDeleteTask,
  onLoadSampleTasks,
  onClearSampleTasks,
}: ActionPlanPageProps) {
  const [title, setTitle] = useState('');
  const [focusArea, setFocusArea] = useState(FOCUS_AREAS[0]);
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState<RecommendationPriority>('High');
  const [status, setStatus] = useState<TaskStatus>('Not started');
  const [filter, setFilter] = useState<'All' | TaskStatus>('All');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasSampleTasks = tasks.some((t) => t.isSample);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (title.trim().length < 4) {
      setErrorMsg('Please enter a clear task title (at least 4 characters).');
      return;
    }
    if (!targetDate) {
      setErrorMsg('Please select a target date for the task.');
      return;
    }

    onAddTask({
      title: title.trim(),
      focusArea,
      targetDate,
      priority,
      status,
      isSample: false,
    });

    setTitle('');
    setTargetDate('');
    setPriority('High');
    setStatus('Not started');
  };

  const handleToggleCompleted = (task: ActionPlanTask) => {
    onUpdateStatus(task.id, task.status === 'Completed' ? 'Not started' : 'Completed');
  };

  const filteredTasks =
    filter === 'All' ? tasks : tasks.filter((task) => task.status === filter);

  const counts = {
    total: tasks.length,
    notStarted: tasks.filter((t) => t.status === 'Not started').length,
    inProgress: tasks.filter((t) => t.status === 'In progress').length,
    completed: tasks.filter((t) => t.status === 'Completed').length,
  };

  const completionPercent =
    counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-purple-800">Weekly Execution Tracker</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-purple-950">
            Action Plan
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            Organize practical next steps with a target date, priority, and status, and track your
            completed progress during this session.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {!hasSampleTasks ? (
            <button
              type="button"
              onClick={() => onLoadSampleTasks(FICTIONAL_SAMPLE_ACTION_TASKS)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/60 px-3.5 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-100 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Load Sample Weekly Tasks</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClearSampleTasks}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-pink-200 bg-pink-50 px-3.5 py-2 text-xs font-semibold text-purple-950 hover:bg-pink-100 whitespace-nowrap shrink-0"
            >
              Clear Sample Tasks
            </button>
          )}
        </div>
      </div>

      {/* Explicit Session-Only Storage Notice */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-xs sm:text-sm leading-relaxed text-slate-700">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-purple-800" />
        <div>
          <p className="font-semibold text-purple-950">
            Session-Only Prototype Storage (No Database Connected)
          </p>
          <p className="mt-0.5">
            No database is connected to this prototype. Tasks you add or update here are stored only
            for your current browser session and may disappear when the page is refreshed or closed.
          </p>
        </div>
      </div>

      {/* Simple Progress Count & Status Breakdown */}
      <div className="mt-6 rounded-xl border border-purple-100 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-purple-950">Progress Summary</p>
            <p className="mt-0.5 text-sm font-medium text-slate-700">
              <span className="font-mono-num font-bold text-purple-950">{counts.completed}</span> of{' '}
              <span className="font-mono-num font-bold text-purple-950">{counts.total}</span>{' '}
              {counts.total === 1 ? 'task' : 'tasks'} completed ({completionPercent}%)
            </p>
          </div>
          <span className="font-mono-num rounded-md border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-950">
            {completionPercent}% Done
          </span>
        </div>

        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-purple-100"
          role="progressbar"
          aria-valuenow={completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Action plan completion progress"
        >
          <div
            className="h-full rounded-full bg-purple-800 transition-all duration-300"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-purple-100 bg-white p-3.5">
            <p className="text-xs text-slate-500">Total Tasks</p>
            <p className="font-mono-num mt-1 text-xl font-semibold text-purple-950">
              {counts.total}
            </p>
          </div>
          <div className="rounded-lg border border-purple-100 bg-white p-3.5">
            <p className="text-xs text-slate-500">Not started</p>
            <p className="font-mono-num mt-1 text-xl font-semibold text-slate-800">
              {counts.notStarted}
            </p>
          </div>
          <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-3.5">
            <p className="text-xs text-slate-600">In progress</p>
            <p className="font-mono-num mt-1 text-xl font-semibold text-purple-900">
              {counts.inProgress}
            </p>
          </div>
          <div className="rounded-lg border border-pink-100 bg-pink-50/40 p-3.5">
            <p className="text-xs text-slate-600">Completed</p>
            <p className="font-mono-num mt-1 text-xl font-semibold text-emerald-800">
              {counts.completed}
            </p>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-6 rounded-xl border border-purple-100 bg-white p-6"
      >
        <h2 className="font-display text-base font-semibold text-purple-950">
          Add a New Task
        </h2>

        {errorMsg && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800"
          >
            {errorMsg}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="taskTitle" className="block text-xs font-medium text-slate-700">
              Task Title <span className="text-purple-700">*</span>
            </label>
            <input
              id="taskTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Update WhatsApp catalogue with 5 prices"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="targetDate" className="block text-xs font-medium text-slate-700">
              Target Date <span className="text-purple-700">*</span>
            </label>
            <input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="font-mono-num mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="taskPriority" className="block text-xs font-medium text-slate-700">
              Priority <span className="text-purple-700">*</span>
            </label>
            <select
              id="taskPriority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as RecommendationPriority)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="taskStatus" className="block text-xs font-medium text-slate-700">
              Status <span className="text-purple-700">*</span>
            </label>
            <select
              id="taskStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="focusArea" className="block text-xs font-medium text-slate-700">
              Focus Area
            </label>
            <select
              id="focusArea"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              {FOCUS_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-purple-800 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-900 whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
        </div>
      </form>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(['All', ...STATUS_OPTIONS] as const).map((tab) => {
            const active = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-purple-800 text-white'
                    : 'border border-purple-200 bg-white text-slate-700 hover:bg-purple-50'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks List */}
      <div className="mt-4 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-purple-100 bg-white p-8 text-center">
            <p className="font-display text-base font-semibold text-purple-950">
              No tasks in this view yet
            </p>
            <p className="mt-1.5 text-sm text-slate-600">
              Add your first task above, or click “Load Sample Weekly Tasks” to preview example
              goals.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'Completed';
            return (
              <div
                key={task.id}
                className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-purple-100 bg-white'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleCompleted(task)}
                    aria-label={
                      isCompleted
                        ? `Mark "${task.title}" as not started`
                        : `Mark "${task.title}" as completed`
                    }
                    className="mt-0.5 shrink-0 text-purple-800 hover:text-purple-950"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-400 hover:text-purple-700" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span
                        className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${getPriorityBadgeStyle(
                          task.priority
                        )}`}
                      >
                        {task.priority} Priority
                      </span>
                      <span className="font-medium text-purple-800">{task.focusArea}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">Due {task.targetDate}</span>
                      {task.isSample && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-pink-700">Sample Example</span>
                        </>
                      )}
                    </div>
                    <p
                      className={`mt-1 text-sm font-medium ${
                        isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleCompleted(task)}
                    className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                      isCompleted
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'border-purple-200 bg-white text-purple-900 hover:bg-purple-50'
                    }`}
                  >
                    {isCompleted ? 'Completed' : 'Mark Completed'}
                  </button>

                  <label htmlFor={`status-${task.id}`} className="sr-only">
                    Status for {task.title}
                  </label>
                  <select
                    id={`status-${task.id}`}
                    value={task.status}
                    onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
                    className="min-h-[38px] rounded-lg border border-purple-200 bg-purple-50/40 px-3 py-1.5 text-xs font-semibold text-purple-950 focus:border-purple-700 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => onDeleteTask(task.id)}
                    aria-label={`Delete task ${task.title}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
