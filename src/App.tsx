import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import IdeaFinderPage from './pages/IdeaFinderPage';
import PlanGeneratorPage from './pages/PlanGeneratorPage';
import CalculatorPage from './pages/CalculatorPage';
import MarketingAssistantPage from './pages/MarketingAssistantPage';
import AboutPage from './pages/AboutPage';
import AssessmentPage from './pages/AssessmentPage';
import AssistantPage from './pages/AssistantPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ResourcesPage from './pages/ResourcesPage';
import ActionPlanPage from './pages/ActionPlanPage';
import FeedbackPage from './pages/FeedbackPage';
import {
  loadCalculatorSnapshot,
  loadStoredGoals,
  loadStoredTasks,
  saveCalculatorSnapshot,
  saveStoredGoals,
  saveStoredTasks,
} from './utils/localProgressStorage';
import type {
  ActionPlanTask,
  BusinessAssessment,
  BusinessGoal,
  BusinessPlanRequest,
  CalculatorSnapshot,
  PageId,
  RecommendationPriority,
  RecommendationResult,
  TaskStatus,
} from './types/herbiz';

const VALID_PAGES: PageId[] = [
  'home',
  'dashboard',
  'idea-finder',
  'plan-generator',
  'calculator',
  'marketing-assistant',
  'about',
  'assessment',
  'assistant',
  'recommendations',
  'resources',
  'action-plan',
  'feedback',
];

function getInitialPageFromHash(): PageId {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === 'progress-tracker') return 'action-plan';
  return VALID_PAGES.includes(hash as PageId) ? (hash as PageId) : 'home';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>(getInitialPageFromHash);
  const [userAssessment, setUserAssessment] = useState<BusinessAssessment | null>(null);
  const [userRecommendation, setUserRecommendation] = useState<RecommendationResult | null>(null);
  const [businessGoals, setBusinessGoals] = useState<BusinessGoal[]>(() => loadStoredGoals());
  const [actionTasks, setActionTasks] = useState<ActionPlanTask[]>(() => loadStoredTasks());
  const [calculatorSnapshot, setCalculatorSnapshot] = useState<CalculatorSnapshot | null>(() =>
    loadCalculatorSnapshot()
  );
  const [planPrefill, setPlanPrefill] = useState<Partial<BusinessPlanRequest> | null>(null);

  useEffect(() => {
    saveStoredGoals(businessGoals);
  }, [businessGoals]);

  useEffect(() => {
    saveStoredTasks(actionTasks);
  }, [actionTasks]);

  useEffect(() => {
    saveCalculatorSnapshot(calculatorSnapshot);
  }, [calculatorSnapshot]);

  useEffect(() => {
    const onHashChange = () => {
      setCurrentPage(getInitialPageFromHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleNavigate = (page: PageId) => {
    setCurrentPage(page);
    if (window.location.hash !== `#${page}`) {
      window.history.pushState(null, '', `#${page}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAssessmentSubmitted = (
    assessment: BusinessAssessment,
    recommendation: RecommendationResult
  ) => {
    setUserAssessment(assessment);
    setUserRecommendation(recommendation);
  };

  const handleResetAssessment = () => {
    setUserAssessment(null);
    setUserRecommendation(null);
  };

  const handleAddGoal = (goal: Omit<BusinessGoal, 'id' | 'createdAt'>) => {
    const newGoal: BusinessGoal = {
      ...goal,
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setBusinessGoals((prev) => [newGoal, ...prev]);
    return newGoal;
  };

  const handleDeleteGoal = (id: string) => {
    setBusinessGoals((prev) => prev.filter((g) => g.id !== id));
    setActionTasks((prev) =>
      prev.map((task) => (task.goalId === id ? { ...task, goalId: undefined } : task))
    );
  };

  const handleAddTask = (task: Omit<ActionPlanTask, 'id' | 'createdAt'>) => {
    const newTask: ActionPlanTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setActionTasks((prev) => [newTask, ...prev]);
  };

  const handleAddNextStepToPlan = (
    taskTitle: string,
    focusArea: string,
    isSample = false,
    priority: RecommendationPriority = 'Medium'
  ) => {
    const nextWeekDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    handleAddTask({
      title: taskTitle,
      focusArea,
      targetDate: nextWeekDate,
      priority,
      status: 'Not started',
      isSample,
    });
  };

  const handleUseIdeaForPlan = (prefill: Partial<BusinessPlanRequest>) => {
    setPlanPrefill(prefill);
    handleNavigate('plan-generator');
  };

  const handleAddPlanTasksToTracker = (
    businessTitle: string,
    planTasks: Array<{ title: string; focusArea: string; weekOffset: number }>
  ) => {
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const createdGoal = handleAddGoal({
      title: `Launch 30-Day Plan: ${businessTitle}`,
      category: 'Business Launch Prep',
      targetDate: thirtyDaysLater,
      isSample: false,
    });

    const newTasks: ActionPlanTask[] = planTasks.map((t, index) => {
      const targetDate = new Date(Date.now() + t.weekOffset * 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
      return {
        id: `task-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 5)}`,
        title: t.title,
        focusArea: t.focusArea,
        targetDate,
        priority: t.weekOffset <= 2 ? 'High' : 'Medium',
        status: 'Not started',
        createdAt: new Date().toISOString(),
        goalId: createdGoal.id,
        isSample: false,
      };
    });

    setActionTasks((prev) => [...newTasks, ...prev]);
  };

  const handleUpdateTaskStatus = (id: string, status: TaskStatus) => {
    setActionTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, status } : task))
    );
  };

  const handleDeleteTask = (id: string) => {
    setActionTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleLoadSampleTasks = (samples: ActionPlanTask[]) => {
    setActionTasks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newOnes = samples.filter((s) => !existingIds.has(s.id));
      return [...prev, ...newOnes];
    });
  };

  const handleClearSampleTasks = () => {
    setActionTasks((prev) => prev.filter((task) => !task.isSample));
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'dashboard' && (
          <DashboardPage
            userAssessment={userAssessment}
            calculatorSnapshot={calculatorSnapshot}
            goals={businessGoals}
            tasks={actionTasks}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'idea-finder' && (
          <IdeaFinderPage
            onUseIdeaForPlan={handleUseIdeaForPlan}
            onAddStepToTracker={(title, focusArea) =>
              handleAddNextStepToPlan(title, focusArea, false, 'High')
            }
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'plan-generator' && (
          <PlanGeneratorPage
            prefill={planPrefill}
            onAddPlanTasksToTracker={handleAddPlanTasksToTracker}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'calculator' && (
          <CalculatorPage
            savedSnapshot={calculatorSnapshot}
            onSaveSnapshot={setCalculatorSnapshot}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'marketing-assistant' && <MarketingAssistantPage />}
        {currentPage === 'about' && <AboutPage onNavigate={handleNavigate} />}
        {currentPage === 'assessment' && (
          <AssessmentPage
            currentAssessment={userAssessment}
            onSubmitAssessment={handleAssessmentSubmitted}
            onResetAssessment={handleResetAssessment}
            onNavigate={handleNavigate}
          />
        )}
        {currentPage === 'assistant' && (
          <AssistantPage userAssessment={userAssessment} onNavigate={handleNavigate} />
        )}
        {currentPage === 'recommendations' && (
          <RecommendationsPage
            userRecommendation={userRecommendation}
            onNavigate={handleNavigate}
            onAddNextStepToPlan={handleAddNextStepToPlan}
          />
        )}
        {currentPage === 'resources' && <ResourcesPage />}
        {currentPage === 'action-plan' && (
          <ActionPlanPage
            goals={businessGoals}
            tasks={actionTasks}
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
            onAddTask={handleAddTask}
            onUpdateStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            onLoadSampleTasks={handleLoadSampleTasks}
            onClearSampleTasks={handleClearSampleTasks}
          />
        )}
        {currentPage === 'feedback' && <FeedbackPage />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
