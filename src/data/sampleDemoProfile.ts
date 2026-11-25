import type { ActionPlanTask, BusinessAssessment } from '../types/herbiz';

/**
 * Clearly labelled fictional demonstration profile.
 * Never silently treated as real user-submitted business data.
 */
export const FICTIONAL_SAMPLE_PROFILE: BusinessAssessment = {
  businessName: 'Asha Home Kitchen & Snacks (Fictional Sample)',
  businessCategory: 'Food & Home Kitchen',
  businessStage: 'Early Stage (0–1 year)',
  cityState: 'Jaipur, Rajasthan',
  monthlySales: 48000,
  monthlyExpenses: 34000,
  sameMonthPeriodConfirmed: true,
  employeesCount: 2,
  mainChallenge: 'Low Sales & Customer Reach',
  digitalToolsUsed: ['WhatsApp Business', 'UPI / QR Payments'],
  businessGoal: 'Increase repeat weekly tiffin and snack orders from local offices and residential societies.',
  submittedAt: 'Demonstration Example',
  isDemoSample: true,
};

export const FICTIONAL_SAMPLE_ACTION_TASKS: ActionPlanTask[] = [
  {
    id: 'sample-task-1',
    title: 'Write down every daily sale and raw-material purchase in one notebook or sheet for 7 days',
    focusArea: 'Financial Management',
    targetDate: '2026-12-02',
    priority: 'High',
    status: 'In progress',
    createdAt: 'Sample Weekly Goal',
    isSample: true,
  },
  {
    id: 'sample-task-2',
    title: 'Take 5 bright daylight photos of top-selling snack packs with clear prices for WhatsApp catalogue',
    focusArea: 'Marketing & Reach',
    targetDate: '2026-12-05',
    priority: 'Medium',
    status: 'Not started',
    createdAt: 'Sample Weekly Goal',
    isSample: true,
  },
  {
    id: 'sample-task-3',
    title: 'Follow up politely with 10 past customers to ask for feedback and share this week’s menu',
    focusArea: 'Customer Retention',
    targetDate: '2026-12-07',
    priority: 'Low',
    status: 'Not started',
    createdAt: 'Sample Weekly Goal',
    isSample: true,
  },
];
