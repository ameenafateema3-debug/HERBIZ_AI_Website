import type {
  BusinessAssessment,
  RecommendationItem,
  RecommendationPriority,
  RecommendationResult,
} from '../../src/types/herbiz.ts';
import { retrieveRelevantKnowledge } from '../knowledge/retrieval.ts';

interface ChallengePlaybook {
  causes: string[];
  suggestions: string[];
  priority: RecommendationPriority;
  priorityReason: string;
  measurableNextStep: string;
  resourceIds: string[];
}

const CHALLENGE_PLAYBOOKS: Record<string, ChallengePlaybook> = {
  'Low Sales & Customer Reach': {
    causes: [
      'Potential buyers nearby may not clearly see what you sell, your prices, or how to order.',
      'Product photos or descriptions may lack clarity on quantity, pricing, or delivery options.',
      'Reliance on one-time walk-in or word-of-mouth orders without structured repeat-customer follow-ups.',
    ],
    suggestions: [
      'Take 4–5 clear daylight photos of your top-selling items on a clean background with exact INR prices and pack sizes.',
      'Set up a simple WhatsApp Business catalogue and share consistent weekly updates with customers who opted in.',
      'Test one small starter pack or seasonal combo with clear terms rather than frequent informal discounts.',
      'Ask 5 past customers for short, honest feedback to spot what makes ordering easier.',
    ],
    priority: 'High',
    priorityReason:
      'Consistent visibility and clear ordering information help address customer-reach gaps without large upfront spending.',
    measurableNextStep:
      'Within 7 days, photograph 3 top products in daylight, write clear INR prices, and share the list with 10 past or opted-in contacts.',
    resourceIds: ['wep-niti-aayog', 'ondc-network', 'skill-india-digital'],
  },
  'Pricing & Profit Margins': {
    causes: [
      'Hidden costs like packaging, cooking fuel, delivery fees, or wastage may be left out of unit pricing.',
      'Prices may be set only by matching nearby competitors rather than checking your actual cost per unit.',
      'Frequent informal discounts or untracked credit may reduce cash remaining at month-end.',
    ],
    suggestions: [
      'List every direct cost for your top 3 products (raw materials, packaging, transport, helper wages) to find your per-unit cost.',
      'Compare total sales and total expenses for the exact same month before adjusting prices.',
      'Review whether one low-margin item needs a pack-size adjustment or clearer pricing rather than changing everything at once.',
      'Keep business cash and household spending separate so margins stay visible.',
    ],
    priority: 'High',
    priorityReason:
      'Selling higher volumes without checking per-unit costs can increase workload while leaving little or negative surplus.',
    measurableNextStep:
      'Within 3 days, calculate the per-unit material, packaging, and transport cost for your top 3 items and compare each against its current selling price.',
    resourceIds: ['startup-india-learning', 'jansamarth-portal'],
  },
  'Record Keeping & Cash Flow': {
    causes: [
      'Cash and UPI sales or small daily supply purchases may go unrecorded during busy hours.',
      'Mixing household spending with business cash makes monthly expenses unclear.',
      'Giving customer credit without written due dates can tie up cash needed for supplies.',
    ],
    suggestions: [
      'Keep one dedicated daily sales-and-expense notebook or spreadsheet with Date, Description, Cash/UPI In, and Cash/UPI Out.',
      'Total weekly sales and expenses every Sunday evening so monthly summaries take under 15 minutes.',
      'Write down every credit order with an agreed due date and send a polite reminder 2 days beforehand.',
      'Separate routine business operating cash from personal household expenses.',
    ],
    priority: 'High',
    priorityReason:
      'Accurate same-period records are essential before making pricing, restocking, or credit decisions.',
    measurableNextStep:
      'For the next 7 consecutive days, record 100% of daily sales and business expenses in one dedicated notebook or spreadsheet.',
    resourceIds: ['udyam-registration', 'udyamimitra-portal', 'skill-india-digital'],
  },
  'Digital Adoption & Online Selling': {
    causes: [
      'Choosing or configuring digital tools can feel overwhelming alongside daily operations.',
      'Missing digital catalogue details or unverified payment tracking can slow down remote orders.',
      'Concerns about online scams, OTP fraud, or unfamiliar platform fees can hold back adoption.',
    ],
    suggestions: [
      'Start with one business need first, such as confirming UPI payments inside your official bank/provider app rather than relying on screenshots.',
      'Create a basic digital product list with clear item names, photos, and prices.',
      'Use one simple spreadsheet with consistent columns for Date, Item, Quantity, Amount, and Payment Status.',
      'Never share OTPs, UPI PINs, or passwords, and review platform fee and settlement terms before listing online.',
    ],
    priority: 'Medium',
    priorityReason:
      'Adopting one practical, safe digital habit at a time reduces confusion and saves manual tracking effort.',
    measurableNextStep:
      'Within 7 days, set up a digital catalogue or spreadsheet with at least 5 items (name, unit price, and availability) and verify all digital safety settings.',
    resourceIds: ['ondc-network', 'skill-india-digital', 'wep-niti-aayog'],
  },
  'Operational Capacity & Time': {
    causes: [
      'Handling production, packing, messaging, and bookkeeping alone creates daily bottlenecks.',
      'Lack of standard checklists or advance order cut-offs leads to rushed work and delays.',
      'Custom or last-minute requests may consume disproportionate time compared to core items.',
    ],
    suggestions: [
      'Focus on 2–3 repeatable core items and set clear advance order cut-off timings.',
      'Write a short one-page checklist for measurements, preparation, and packing so quality stays consistent.',
      'Batch similar tasks together—such as prepping materials in one slot and answering enquiries in two fixed windows.',
      'Track weekly workload for 4–8 weeks before taking on fixed staff or space commitments.',
    ],
    priority: 'Medium',
    priorityReason:
      'Clear workflows and batching help protect product quality and prevent burnout before any expansion.',
    measurableNextStep:
      'Within 5 days, write a one-page preparation and packing checklist for your #1 product and publish clear daily order cut-off hours.',
    resourceIds: ['wep-mentorship', 'startup-india-learning'],
  },
  'Understanding Support Resources': {
    causes: [
      'Scattered unofficial websites and social posts make it hard to identify genuine government portals.',
      'Missing basic business records or Udyam registration can delay exploring official MSME programmes.',
      'Uncertainty around eligibility criteria and required documents makes formal support feel complex.',
    ],
    suggestions: [
      'Use only official .gov.in or verified institutional portals (such as udyamregistration.gov.in, myscheme.gov.in, wep.gov.in, and jansamarth.in).',
      'Organize basic business records first (monthly sales/expense summary and registration details if applicable).',
      'Check current eligibility rules, terms, and deadlines directly on the official portal rather than relying on unverified third parties.',
      'Review free learning and mentorship options on Skill India Digital Hub and WEP before paying private agents.',
    ],
    priority: 'Low',
    priorityReason:
      'Verifying official portals and organizing records builds a reliable foundation without risking misinformation.',
    measurableNextStep:
      'This week, review 2 verified portals (udyamregistration.gov.in and myscheme.gov.in) and list the exact documents required for your business stage.',
    resourceIds: ['udyam-registration', 'myscheme-portal', 'wep-niti-aayog', 'jansamarth-portal'],
  },
};

export function generateRecommendations(assessment: BusinessAssessment): RecommendationResult {
  const isSample = Boolean(assessment.isDemoSample);
  const sales =
    assessment.monthlySales !== null && Number.isFinite(assessment.monthlySales)
      ? Math.max(0, assessment.monthlySales)
      : null;
  const expenses =
    assessment.monthlyExpenses !== null && Number.isFinite(assessment.monthlyExpenses)
      ? Math.max(0, assessment.monthlyExpenses)
      : null;
  const sameMonthConfirmed = assessment.sameMonthPeriodConfirmed !== false;
  const estimatedProfit =
    sales !== null && expenses !== null && sameMonthConfirmed ? sales - expenses : null;

  const playbook =
    CHALLENGE_PLAYBOOKS[assessment.mainChallenge] ?? CHALLENGE_PLAYBOOKS['Low Sales & Customer Reach'];

  // 1. Retrieve HERBIZ knowledge sections for the user's primary selected challenge + goal
  const primaryRetrieval = retrieveRelevantKnowledge(
    `${assessment.mainChallenge} ${assessment.businessGoal}`,
    null,
    undefined,
    3
  );

  const primaryReasons = [...playbook.causes];
  const primaryActions = [...playbook.suggestions];

  if (estimatedProfit !== null && estimatedProfit < 0) {
    primaryReasons.push(
      'Your submitted monthly expenses exceed monthly sales for the same month, creating a negative estimated balance.'
    );
    primaryActions.unshift(
      'Review non-essential spending and direct unit costs before taking on new expenses or discounts.'
    );
  } else if (estimatedProfit !== null && sales !== null && sales > 0 && estimatedProfit / sales < 0.15) {
    primaryReasons.push(
      'Your submitted same-month figures show a relatively narrow surplus margin, leaving less buffer for unexpected costs.'
    );
  }

  // Tailor strictly using ONLY user-submitted profile details
  if (assessment.businessStage === 'Idea / Planning') {
    primaryActions.push(
      'Because you are at the Idea / Planning stage, validate demand with a small batch before committing major funds.'
    );
  } else if (assessment.employeesCount === 1 || assessment.employeesCount === 0) {
    primaryActions.push(
      'Since you are currently operating solo or pre-hiring, pick one small weekly habit you can sustain in under 30 minutes.'
    );
  }

  let primaryPriority: RecommendationPriority = playbook.priority;
  let primaryPriorityReason = playbook.priorityReason;
  if (estimatedProfit !== null && estimatedProfit < 0) {
    primaryPriority = 'High';
    primaryPriorityReason =
      'Because entered expenses currently exceed same-month sales, stabilizing costs and cash tracking is urgent.';
  }

  const primaryRec: RecommendationItem = {
    id: 'rec-primary-challenge',
    isSample,
    selectedChallenge: assessment.mainChallenge,
    possibleReasons: primaryReasons.slice(0, 4),
    suggestedActions: primaryActions.slice(0, 5),
    priority: primaryPriority,
    priorityReason: primaryPriorityReason,
    measurableNextStep: playbook.measurableNextStep,
    knowledgeSources: primaryRetrieval.sourceNotes,
  };

  const recommendations: RecommendationItem[] = [primaryRec];

  // 2. Second recommendation: Financial / Profit-clarity recommendation based strictly on user-provided numbers
  if (estimatedProfit === null) {
    const financeRetrieval = retrieveRelevantKnowledge(
      'financial records monthly sales expenses profit formula simple spreadsheet',
      null,
      undefined,
      3
    );
    recommendations.push({
      id: 'rec-financial-records',
      isSample,
      selectedChallenge: 'Same-Month Sales & Expense Visibility',
      possibleReasons: [
        'Monthly Sales, Monthly Expenses, or same-month confirmation was not provided in your assessment.',
        'Without matching sales and expenses for the same period, simplified estimated profit cannot be checked accurately.',
      ],
      suggestedActions: [
        'Keep one dedicated sales register and one expense register covering the same calendar month and currency (INR).',
        'Include raw materials, packaging, transport, and helper payments under business expenses.',
        'Use the simple check: Simple Estimated Profit = Monthly Sales minus Monthly Expenses (estimate only, excluding taxes and adjustments).',
      ],
      priority: 'Medium',
      priorityReason:
        'Same-period records give you clearer visibility into margins and break-even needs without guessing.',
      measurableNextStep:
        'Record every business sale and expense for 14 days in one sheet so you can compare totals for a complete month.',
      knowledgeSources: financeRetrieval.sourceNotes,
    });
  } else if (estimatedProfit < 0) {
    const costRetrieval = retrieveRelevantKnowledge(
      'expenses exceed sales cash flow pricing break-even cost control',
      null,
      undefined,
      3
    );
    recommendations.push({
      id: 'rec-negative-margin',
      isSample,
      selectedChallenge: 'Monthly Expenses Exceeding Same-Month Sales',
      possibleReasons: [
        'Direct material, packaging, or delivery costs per item may be higher than expected.',
        'Slow-moving inventory or fixed overheads may be absorbing cash faster than current order volume covers.',
      ],
      suggestedActions: [
        'Calculate unit contribution (Selling Price minus Variable Cost per unit) for each main product to spot items sold below cost.',
        'Separate business spending from household cash immediately and pause non-essential purchases.',
        'Review slow-moving stock before ordering fresh supplies.',
      ],
      priority: 'High',
      priorityReason:
        'Same-month expenses are higher than sales, so identifying where cash is leaking is a top priority.',
      measurableNextStep:
        'Within 4 days, list every expense category from this past month and flag at least 2 costs to review or reduce.',
      knowledgeSources: costRetrieval.sourceNotes,
    });
  } else {
    const cashRetrieval = retrieveRelevantKnowledge(
      'cash flow habits working capital reserve profit margin',
      null,
      undefined,
      3
    );
    recommendations.push({
      id: 'rec-cash-discipline',
      isSample,
      selectedChallenge: 'Cash Flow & Margin Protection',
      possibleReasons: [
        'Even when sales exceed expenses on paper, pending customer credit or bulk restocking can tighten daily cash.',
        'Simplified estimated profit excludes taxes, interest, depreciation, and unexpected repairs.',
      ],
      suggestedActions: [
        'Confirm payment receipt in your official bank/UPI app before marking orders paid.',
        'Review your weekly cash balance separately from credit sales.',
        'Set aside a small portion of positive surplus as an operating reserve for restocking and emergencies.',
      ],
      priority: 'Medium',
      priorityReason:
        'Protecting cash flow helps sustain operations steadily when costs fluctuate (without guaranteeing profit growth).',
      measurableNextStep:
        'Every Sunday for the next 4 weeks, reconcile all UPI/cash receipts against orders and log your closing cash balance.',
      knowledgeSources: cashRetrieval.sourceNotes,
    });
  }

  // 3. Third recommendation: Digital habits or 30-day goal execution based on user-provided tools/goal
  const hasNoDigitalTools =
    assessment.digitalToolsUsed.length === 0 ||
    assessment.digitalToolsUsed.includes('None Yet');

  if (hasNoDigitalTools && assessment.mainChallenge !== 'Digital Adoption & Online Selling') {
    const digitalRetrieval = retrieveRelevantKnowledge(
      'digital tools spreadsheet upi payments digital safety checklist',
      null,
      undefined,
      3
    );
    recommendations.push({
      id: 'rec-digital-basics',
      isSample,
      selectedChallenge: 'Foundational Digital Tools & Payment Safety',
      possibleReasons: [
        'You indicated that no digital business tools are currently used.',
        'Manual tracking and unverified payment confirmations can take extra time as orders grow.',
      ],
      suggestedActions: [
        'Start with one simple need—such as accepting UPI QR payments and verifying each receipt in your official bank/provider app.',
        'Keep a basic spreadsheet with clear columns (Date, Item, Quantity, Amount, Payment Status) and regular backups.',
        'Follow basic digital safety: never share OTPs, UPI PINs, or passwords with anyone.',
      ],
      priority: 'Low',
      priorityReason:
        'Once core records and pricing are clear, adding one simple digital tool saves time safely.',
      measurableNextStep:
        'Within 10 days, set up a simple digital sales sheet with 5 columns and back it up once a week.',
      knowledgeSources: digitalRetrieval.sourceNotes,
    });
  } else if (assessment.businessGoal.trim()) {
    const goalRetrieval = retrieveRelevantKnowledge(
      `30-day business improvement plan ${assessment.businessGoal}`,
      null,
      undefined,
      3
    );
    recommendations.push({
      id: 'rec-goal-execution',
      isSample,
      selectedChallenge: 'Goal Execution & 30-Day Progress Check',
      possibleReasons: [
        'Broad 1–3 month goals are harder to sustain alongside daily orders without weekly checkpoints.',
        'Trying too many changes at once makes it hard to see which action actually helped.',
      ],
      suggestedActions: [
        `Break your stated goal ("${assessment.businessGoal.trim().slice(0, 120)}") into one small weekly action and one measurable check.`,
        'Track one consistent indicator weekly (for example: repeat orders, unit cost, or on-time dispatches).',
        'Review what worked at the end of 30 days and keep only the habits that fit your routine.',
      ],
      priority: 'Low',
      priorityReason:
        'Steady weekly reviews turn your stated 1–3 month goal into practical habits without overwhelming daily work.',
      measurableNextStep:
        'Write 3 weekly tasks in your Action Plan today with target dates over the next 21 days.',
      knowledgeSources: goalRetrieval.sourceNotes,
    });
  }

  const businessLabel = assessment.businessName?.trim()
    ? `${assessment.businessName.trim()} (${assessment.businessCategory})`
    : `${assessment.businessCategory} — ${assessment.businessStage}`;

  const profitCalculationNote =
    estimatedProfit !== null
      ? 'Estimate only: Monthly Sales minus Monthly Expenses for the same month. Excludes taxes, interest, depreciation, and other adjustments.'
      : 'Not calculated: provide both Monthly Sales and Monthly Expenses for the same month to view a simplified profit estimate.';

  return {
    isDemoSample: isSample,
    businessLabel,
    selectedChallenge: primaryRec.selectedChallenge,
    monthlySales: sales,
    monthlyExpenses: expenses,
    sameMonthPeriodConfirmed: sameMonthConfirmed,
    estimatedMonthlyProfit: estimatedProfit,
    profitCalculationNote,
    possibleCauses: primaryRec.possibleReasons,
    practicalSuggestions: primaryRec.suggestedActions,
    priority: primaryRec.priority,
    priorityReason: primaryRec.priorityReason,
    nextStep: primaryRec.measurableNextStep,
    relevantResourceIds: playbook.resourceIds,
    recommendations,
    profileBasis: {
      businessName: assessment.businessName?.trim() || null,
      businessCategory: assessment.businessCategory,
      businessStage: assessment.businessStage,
      cityState: assessment.cityState?.trim() || null,
      employeesCount: assessment.employeesCount,
      digitalToolsUsed: assessment.digitalToolsUsed,
      businessGoal: assessment.businessGoal,
    },
  };
}
