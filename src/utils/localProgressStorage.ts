import type {
  ActionPlanTask,
  BusinessGoal,
  CalculatorSnapshot,
} from '../types/herbiz';

const GOALS_KEY = 'herbiz_progress_goals_v1';
const TASKS_KEY = 'herbiz_progress_tasks_v1';
const CALCULATOR_KEY = 'herbiz_calculator_snapshot_v1';

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function loadStoredGoals(): BusinessGoal[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BusinessGoal[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredGoals(goals: BusinessGoal[]): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch {
    // Ignore storage quota / private-browsing errors cleanly
  }
}

export function loadStoredTasks(): ActionPlanTask[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ActionPlanTask[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredTasks(tasks: ActionPlanTask[]): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore storage quota / private-browsing errors cleanly
  }
}

export function loadCalculatorSnapshot(): CalculatorSnapshot | null {
  if (!isStorageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(CALCULATOR_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as CalculatorSnapshot) : null;
  } catch {
    return null;
  }
}

export function saveCalculatorSnapshot(snapshot: CalculatorSnapshot | null): void {
  if (!isStorageAvailable()) return;
  try {
    if (!snapshot) {
      window.localStorage.removeItem(CALCULATOR_KEY);
      return;
    }
    window.localStorage.setItem(CALCULATOR_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota / private-browsing errors cleanly
  }
}
