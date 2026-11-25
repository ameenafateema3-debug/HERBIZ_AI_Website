export type PageId =
  | 'home'
  | 'about'
  | 'assessment'
  | 'assistant'
  | 'recommendations'
  | 'resources'
  | 'action-plan'
  | 'feedback';

export interface BusinessAssessment {
  businessName?: string;
  businessCategory: string;
  businessStage: string;
  cityState?: string;
  monthlySales: number | null;
  monthlyExpenses: number | null;
  sameMonthPeriodConfirmed: boolean;
  employeesCount: number;
  mainChallenge: string;
  digitalToolsUsed: string[];
  businessGoal: string;
  submittedAt: string;
  isDemoSample?: boolean;
}

export type RecommendationPriority = 'High' | 'Medium' | 'Low';

export interface RecommendationItem {
  id: string;
  isSample: boolean;
  selectedChallenge: string;
  possibleReasons: string[];
  suggestedActions: string[];
  priority: RecommendationPriority;
  priorityReason: string;
  measurableNextStep: string;
  knowledgeSources: ChatSourceNote[];
}

export interface RecommendationResult {
  isDemoSample: boolean;
  businessLabel: string;
  selectedChallenge: string;
  monthlySales: number | null;
  monthlyExpenses: number | null;
  sameMonthPeriodConfirmed: boolean;
  estimatedMonthlyProfit: number | null;
  profitCalculationNote: string;
  possibleCauses: string[];
  practicalSuggestions: string[];
  priority: RecommendationPriority;
  priorityReason: string;
  nextStep: string;
  relevantResourceIds: string[];
  recommendations: RecommendationItem[];
  profileBasis: {
    businessName: string | null;
    businessCategory: string;
    businessStage: string;
    cityState: string | null;
    employeesCount: number;
    digitalToolsUsed: string[];
    businessGoal: string;
  };
}

export interface ChatSourceNote {
  area: string;
  section: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  matchedTopics?: string[];
  sourceNotes?: ChatSourceNote[];
  retrievedExcerpts?: Array<{ area: string; section: string; score: number; preview: string }>;
  insufficientKnowledge?: boolean;
  fallbackUsed?: boolean;
  referencedResources?: Array<{
    title: string;
    url: string;
  }>;
}

export type ResourceCategory =
  | 'official_government_support'
  | 'business_registration'
  | 'finance'
  | 'training_and_mentorship';

export interface VerifiedResource {
  id: string;
  title: string;
  organization: string;
  category: ResourceCategory;
  categoryLabel: string;
  description: string;
  url: string;
  note: string;
}

export type TaskStatus = 'Not started' | 'In progress' | 'Completed';

export interface ActionPlanTask {
  id: string;
  title: string;
  focusArea: string;
  targetDate: string;
  priority: RecommendationPriority;
  status: TaskStatus;
  createdAt: string;
  isSample?: boolean;
}

export interface FeedbackSubmission {
  category: string;
  rating: number;
  mostUsefulArea: string;
  comments: string;
}

export interface ProfileAnalysisRequest {
  businessCategory: string;
  businessStage: string;
  monthlySales: number | null;
  monthlyExpenses: number | null;
  sameMonthPeriodConfirmed: boolean;
  selectedChallenge: string;
  businessGoal: string;
}

export interface ProfileAnalysisResponse {
  monthlySales: number;
  monthlyExpenses: number;
  simpleEstimatedProfit: number;
  profitNote: string;
  guidanceLabel: string;
  guidanceDisclaimer: string;
  analysis: string;
  sourceNotes: ChatSourceNote[];
  referencedResources: Array<{
    title: string;
    url: string;
  }>;
}
