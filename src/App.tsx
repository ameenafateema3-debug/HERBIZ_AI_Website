import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import AssessmentPage from './pages/AssessmentPage';
import AssistantPage from './pages/AssistantPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ResourcesPage from './pages/ResourcesPage';
import ActionPlanPage from './pages/ActionPlanPage';
import FeedbackPage from './pages/FeedbackPage';
import type {
  ActionPlanTask,
  BusinessAssessment,
  PageId,
  RecommendationPriority,
  RecommendationResult,
  TaskStatus,
} from './types/herbiz';

const VALID_PAGES: PageId[] = [
  'home',
  'about',
  'assessment',
  'assistant',
  'recommendations',
  'resources',
  'action-plan',
  'feedback',
];

function getInitialPageFromHash(): PageId {
  const hash = window.location.hash.replace(/^#/, '') as PageId;
  return VALID_PAGES.includes(hash) ? hash : 'home';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>(getInitialPageFromHash);
  const [userAssessment, setUserAssessment] = useState<BusinessAssessment | null>(null);
  const [userRecommendation, setUserRecommendation] = useState<RecommendationResult | null>(null);
  const [actionTasks, setActionTasks] = useState<ActionPlanTask[]>([]);

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
            tasks={actionTasks}
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
