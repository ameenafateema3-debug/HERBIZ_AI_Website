export type PageId =
  | 'home'
  | 'dashboard'
  | 'idea-finder'
  | 'plan-generator'
  | 'calculator'
  | 'marketing-assistant'
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
  goalId?: string;
  isSample?: boolean;
}

export interface BusinessGoal {
  id: string;
  title: string;
  category: string;
  targetDate: string;
  createdAt: string;
  isSample?: boolean;
}

export interface CalculatorSnapshot {
  initialInvestment: number;
  monthlySalesRevenue: number;
  monthlyOperatingExpenses: number;
  productCost: number;
  otherBusinessCosts: number;
  totalMonthlyExpenses: number;
  estimatedMonthlyProfit: number;
  profitMarginPercent: number;
  breakEvenMonthlySales: number;
  paybackMonths: number | null;
  updatedAt: string;
}

export interface IdeaFinderRequest {
  budgetInr: number;
  skillsAndInterests: string;
  preferredBusinessType: string;
  workSetting: 'Home-based' | 'Physical shop / studio' | 'Flexible (Home or Physical)';
}

export interface BusinessIdeaItem {
  businessName: string;
  shortDescription: string;
  estimatedStartupInvestment: string;
  targetCustomers: string;
  requiredSkills: string[];
  potentialChallenges: string[];
  firstSteps: string[];
}

export interface IdeaFinderResponse {
  ideas: BusinessIdeaItem[];
  sourceNotes: ChatSourceNote[];
  guidanceDisclaimer: string;
}

export interface BusinessPlanRequest {
  businessIdea: string;
  budgetInr: number;
  location: string;
  targetCustomers: string;
  productsOrServices: string;
}

export interface BusinessPlanWeek {
  weekLabel: string;
  focus: string;
  tasks: string[];
}

export interface BusinessPlanResponse {
  businessTitle: string;
  businessOverview: string;
  productsOrServices: string[];
  targetCustomers: string;
  estimatedStartupCosts: string[];
  marketingStrategy: string[];
  businessChallenges: string[];
  expectedExpenses: string[];
  thirtyDayActionPlan: BusinessPlanWeek[];
  sourceNotes: ChatSourceNote[];
  guidanceDisclaimer: string;
}

export interface MarketingAssistantRequest {
  businessName: string;
  productOrService: string;
  targetAudience: string;
  platform: 'Instagram' | 'WhatsApp Business' | 'Facebook' | 'Local & Multi-platform';
  toneNote?: string;
}

export interface MarketingAssistantResponse {
  instagramCaptions: string[];
  whatsappMessages: string[];
  productDescriptions: Array<{ label: string; copy: string }>;
  businessSlogans: string[];
  marketingStrategies: string[];
  sourceNotes: ChatSourceNote[];
  guidanceDisclaimer: string;
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
