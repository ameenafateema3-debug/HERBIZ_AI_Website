import type { IncomingMessage, ServerResponse } from 'node:http';
import { VERIFIED_RESOURCES } from './knowledge/verifiedResources.ts';
import { getKnowledgeAreasSummary } from './knowledge/herbizKnowledge.ts';
import { generateRecommendations } from './services/recommendationEngine.ts';
import {
  analyzeBusinessProfile,
  generateAssistantReply,
  type ChatTurnInput,
} from './services/geminiAssistant.ts';
import {
  generateBusinessIdeas,
  generateBusinessPlan,
  generateMarketingKit,
} from './services/geminiTools.ts';
import type {
  BusinessAssessment,
  BusinessPlanRequest,
  FeedbackSubmission,
  IdeaFinderRequest,
  MarketingAssistantRequest,
  ProfileAnalysisRequest,
} from '../src/types/herbiz.ts';

export type ApiRequest = IncomingMessage & { body?: unknown; method?: string };
export type ApiResponse = ServerResponse;

interface StoredFeedback extends FeedbackSubmission {
  id: string;
  submittedAt: string;
}

// Note: Serverless environments are stateless across cold starts; prototype session log only.
const sessionFeedbackLog: StoredFeedback[] = [];

export function sendJson(res: ApiResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export async function readJsonBody(req: ApiRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return req.body.trim() ? JSON.parse(req.body) : {};
    }
    if (Buffer.isBuffer(req.body)) {
      const text = req.body.toString('utf-8').trim();
      return text ? JSON.parse(text) : {};
    }
    return req.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function parseOptionalNonNegativeNumber(value: unknown): number | null | 'INVALID' {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 'INVALID';
  return num;
}

export function respondWithGeminiError(res: ApiResponse, err: unknown, logPrefix: string): void {
  const message = err instanceof Error ? err.message : String(err);
  const statusCode =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : undefined;
  console.error(`${logPrefix}:`, statusCode ?? '', message);

  if (
    message === 'GEMINI_API_KEY_MISSING' ||
    message.includes('API_KEY_INVALID') ||
    message.includes('API key not valid') ||
    message.includes('PERMISSION_DENIED') ||
    statusCode === 401 ||
    statusCode === 403
  ) {
    sendJson(res, 503, {
      error:
        'This Gemini AI connection is currently unavailable because GEMINI_API_KEY is missing or invalid on the server. Please configure GEMINI_API_KEY in your server environment variables.',
    });
    return;
  }

  if (message.includes('RESOURCE_EXHAUSTED') || statusCode === 429) {
    sendJson(res, 429, {
      error:
        'The Gemini AI service reached its request limit right now. Please wait a moment and try again.',
    });
    return;
  }

  if (statusCode === 503) {
    sendJson(res, 503, {
      error:
        'The Gemini AI service is temporarily unavailable due to high demand. Please wait a few seconds and try again.',
    });
    return;
  }

  sendJson(res, 500, {
    error: 'Unable to reach the HERBIZ AI service right now. Please try again in a moment.',
  });
}

export function handleHealth(_req: ApiRequest, res: ApiResponse): void {
  sendJson(res, 200, {
    ok: true,
    service: 'HERBIZ AI',
    geminiConfigured: Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    ),
  });
}

export function handleResources(_req: ApiRequest, res: ApiResponse): void {
  sendJson(res, 200, {
    resources: VERIFIED_RESOURCES,
    disclaimer:
      'HERBIZ AI is not a government eligibility checker or loan approval service. Always verify current scheme details, eligibility, amounts, and deadlines directly on the official portal.',
  });
}

export function handleKnowledgeTopics(_req: ApiRequest, res: ApiResponse): void {
  sendJson(res, 200, {
    topics: getKnowledgeAreasSummary(),
  });
}

export async function handleRecommendations(req: ApiRequest, res: ApiResponse): Promise<void> {
  let body: Partial<BusinessAssessment> | undefined;
  try {
    body = (await readJsonBody(req)) as Partial<BusinessAssessment> | undefined;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON payload submitted to /api/recommendations.' });
    return;
  }

  if (
    !body ||
    typeof body.businessCategory !== 'string' ||
    !body.businessCategory.trim() ||
    typeof body.mainChallenge !== 'string' ||
    !body.mainChallenge.trim()
  ) {
    sendJson(res, 400, {
      error: 'Please provide a business category and main challenge to generate recommendations.',
    });
    return;
  }

  const parsedSales = parseOptionalNonNegativeNumber(body.monthlySales);
  const parsedExpenses = parseOptionalNonNegativeNumber(body.monthlyExpenses);
  if (parsedSales === 'INVALID' || parsedExpenses === 'INVALID') {
    sendJson(res, 400, {
      error: 'Monthly sales and monthly expenses must be valid non-negative numbers when provided.',
    });
    return;
  }

  const parsedEmployees = Number(body.employeesCount);
  if (!Number.isFinite(parsedEmployees) || parsedEmployees < 0 || !Number.isInteger(parsedEmployees)) {
    sendJson(res, 400, {
      error: 'Number of employees must be a valid non-negative whole number.',
    });
    return;
  }

  const assessment: BusinessAssessment = {
    businessName: typeof body.businessName === 'string' ? body.businessName.slice(0, 120) : '',
    businessCategory: body.businessCategory.slice(0, 80),
    businessStage:
      typeof body.businessStage === 'string' && body.businessStage.trim()
        ? body.businessStage.slice(0, 80)
        : 'Early Stage (0–1 year)',
    cityState: typeof body.cityState === 'string' ? body.cityState.slice(0, 100) : '',
    monthlySales: parsedSales,
    monthlyExpenses: parsedExpenses,
    sameMonthPeriodConfirmed: body.sameMonthPeriodConfirmed !== false,
    employeesCount: parsedEmployees,
    mainChallenge: body.mainChallenge.slice(0, 100),
    digitalToolsUsed: Array.isArray(body.digitalToolsUsed)
      ? body.digitalToolsUsed.filter((t): t is string => typeof t === 'string').slice(0, 10)
      : [],
    businessGoal: typeof body.businessGoal === 'string' ? body.businessGoal.slice(0, 500) : '',
    submittedAt: typeof body.submittedAt === 'string' ? body.submittedAt : new Date().toISOString(),
    isDemoSample: Boolean(body.isDemoSample),
  };

  const result = generateRecommendations(assessment);
  sendJson(res, 200, { recommendation: result });
}

export async function handleChat(req: ApiRequest, res: ApiResponse): Promise<void> {
  let body:
    | {
        messages?: ChatTurnInput[];
        userProfile?: BusinessAssessment | null;
      }
    | undefined;
  try {
    body = (await readJsonBody(req)) as
      | {
          messages?: ChatTurnInput[];
          userProfile?: BusinessAssessment | null;
        }
      | undefined;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON payload submitted to /api/chat.' });
    return;
  }

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    sendJson(res, 400, { error: 'Please enter a message to ask the HERBIZ AI assistant.' });
    return;
  }

  const cleanMessages: ChatTurnInput[] = body.messages
    .filter(
      (m): m is ChatTurnInput =>
        Boolean(m) &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, 2000),
    }));

  if (cleanMessages.length === 0 || !cleanMessages.some((m) => m.role === 'user')) {
    sendJson(res, 400, { error: 'Message content cannot be empty.' });
    return;
  }

  try {
    const reply = await generateAssistantReply({
      messages: cleanMessages,
      userProfile: body.userProfile ?? null,
    });
    sendJson(res, 200, reply);
  } catch (err: unknown) {
    respondWithGeminiError(res, err, 'HERBIZ AI chat error');
  }
}

export async function handleAnalyzeProfile(req: ApiRequest, res: ApiResponse): Promise<void> {
  let body: Partial<ProfileAnalysisRequest> | undefined;
  try {
    body = (await readJsonBody(req)) as Partial<ProfileAnalysisRequest> | undefined;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON payload submitted to /api/analyze-profile.' });
    return;
  }

  if (!body || typeof body !== 'object') {
    sendJson(res, 400, { error: 'Please submit your business profile fields first.' });
    return;
  }

  const missingFields: string[] = [];
  const businessCategory =
    typeof body.businessCategory === 'string' ? body.businessCategory.trim() : '';
  const businessStage = typeof body.businessStage === 'string' ? body.businessStage.trim() : '';
  const selectedChallenge =
    typeof body.selectedChallenge === 'string' ? body.selectedChallenge.trim() : '';
  const businessGoal = typeof body.businessGoal === 'string' ? body.businessGoal.trim() : '';
  const parsedSales = parseOptionalNonNegativeNumber(body.monthlySales);
  const parsedExpenses = parseOptionalNonNegativeNumber(body.monthlyExpenses);

  if (!businessCategory) missingFields.push('Business Category');
  if (!businessStage) missingFields.push('Business Stage');
  if (parsedSales === null || parsedSales === 'INVALID') {
    missingFields.push('Monthly Sales (INR)');
  }
  if (parsedExpenses === null || parsedExpenses === 'INVALID') {
    missingFields.push('Monthly Expenses (INR)');
  }
  if (body.sameMonthPeriodConfirmed !== true) {
    missingFields.push('Same-Month Period Confirmation');
  }
  if (!selectedChallenge) missingFields.push('Selected Challenge');
  if (businessGoal.length < 5) missingFields.push('Business Goal');

  if (
    missingFields.length > 0 ||
    parsedSales === null ||
    parsedSales === 'INVALID' ||
    parsedExpenses === null ||
    parsedExpenses === 'INVALID'
  ) {
    sendJson(res, 400, {
      error: `Please complete the missing required values before running profile analysis: ${missingFields.join(', ')}.`,
      missingFields,
    });
    return;
  }

  try {
    const result = await analyzeBusinessProfile({
      businessCategory: businessCategory.slice(0, 80),
      businessStage: businessStage.slice(0, 80),
      monthlySales: parsedSales,
      monthlyExpenses: parsedExpenses,
      selectedChallenge: selectedChallenge.slice(0, 100),
      businessGoal: businessGoal.slice(0, 500),
    });
    sendJson(res, 200, result);
  } catch (err: unknown) {
    respondWithGeminiError(res, err, 'HERBIZ analyze-profile error');
  }
}

export async function handleFeedback(req: ApiRequest, res: ApiResponse): Promise<void> {
  let body: Partial<FeedbackSubmission> | undefined;
  try {
    body = (await readJsonBody(req)) as Partial<FeedbackSubmission> | undefined;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON payload submitted to /api/feedback.' });
    return;
  }

  if (!body || typeof body.comments !== 'string' || body.comments.trim().length < 5) {
    sendJson(res, 400, {
      error: 'Please write at least a short comment (5+ characters) before submitting feedback.',
    });
    return;
  }

  const ratingNum = Number(body.rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    sendJson(res, 400, { error: 'Please select a rating between 1 and 5.' });
    return;
  }

  const category =
    typeof body.category === 'string' && body.category.trim().length > 0
      ? body.category.trim().slice(0, 80)
      : 'General Experience';

  const entry: StoredFeedback = {
    id: `FB-${Date.now().toString(36).toUpperCase()}`,
    category,
    rating: Math.round(ratingNum),
    mostUsefulArea:
      typeof body.mostUsefulArea === 'string' && body.mostUsefulArea.trim().length > 0
        ? body.mostUsefulArea.trim().slice(0, 80)
        : 'Overall Experience',
    comments: body.comments.trim().slice(0, 1200),
    submittedAt: new Date().toISOString(),
  };

  sessionFeedbackLog.push(entry);

  sendJson(res, 201, {
    ok: true,
    referenceId: entry.id,
    category: entry.category,
    rating: entry.rating,
    mostUsefulArea: entry.mostUsefulArea,
    submittedAt: entry.submittedAt,
    note: 'Thank you for sharing your feedback! This is a demonstration form for the current prototype session—your response is not permanently stored in a database.',
  });
}

export async function handleIdeaFinder(req: ApiRequest, res: ApiResponse): Promise<void> {
  let body: Partial<IdeaFinderRequest> | undefined;
  try {
    body = (await readJsonBody(req)) as Partial<IdeaFinderRequest> | undefined;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON payload submitted to /api/idea-finder.' });
    return;
  }

  const parsedBudget = parseOptionalNonNegativeNumber(body?.budgetInr);
  const skillsAndInterests =
    typeof body?.skillsAndInterests === 'string' ? body.skillsAndInterests.trim() : '';
  const preferredBusinessType =
    typeof body?.preferredBusinessType === 'string' ? body.preferredBusinessType.trim() : '';
  const workSetting = body?.workSetting;
  const allowedSettings: Array<IdeaFinderRequest['workSetting']> = [
    'Home-based',
    'Physical shop / studio',
    'Flexible (Home or Physical)',
  ];

  if (parsedBudget === null || parsedBudget === 'INVALID' || parsedBudget <= 0) {
    sendJson(res, 400, {
      error: 'Please enter a valid startup investment budget in INR (greater than 0).',
    });
    return;
  }
  if (skillsAndInterests.length < 3) {
    sendJson(res, 400, {
      error: 'Please enter your skills or interests (at least 3 characters).',
    });
    return;
  }
  if (!preferredBusinessType) {
    sendJson(res, 400, {
      error: 'Please select or enter a preferred business type.',
    });
    return;
  }

  const resolvedSetting = allowedSettings.includes(
    workSetting as IdeaFinderRequest['workSetting']
  )
    ? (workSetting as IdeaFinderRequest['workSetting'])
    : 'Home-based';

  try {
    const result = await generateBusinessIdeas({
      budgetInr: parsedBudget,
      skillsAndInterests: skillsAndInterests.slice(0, 300),
      preferredBusinessType: preferredBusinessType.slice(0, 120),
      workSetting: resolvedSetting,
    });
    sendJson(res, 200, result);
  } catch (err: unknown) {
    respondWithGeminiError(res, err, 'HERBIZ idea-finder error');
  }
}

export async function handleBusinessPlan(req: ApiRequest, res: ApiResponse): Promise<void> {
  let body: Partial<BusinessPlanRequest> | undefined;
  try {
    body = (await readJsonBody(req)) as Partial<BusinessPlanRequest> | undefined;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON payload submitted to /api/business-plan.' });
    return;
  }

  const businessIdea = typeof body?.businessIdea === 'string' ? body.businessIdea.trim() : '';
  const parsedBudget = parseOptionalNonNegativeNumber(body?.budgetInr);
  const location = typeof body?.location === 'string' ? body.location.trim() : '';
  const targetCustomers =
    typeof body?.targetCustomers === 'string' ? body.targetCustomers.trim() : '';
  const productsOrServices =
    typeof body?.productsOrServices === 'string' ? body.productsOrServices.trim() : '';

  if (businessIdea.length < 4) {
    sendJson(res, 400, { error: 'Please describe your business idea (at least 4 characters).' });
    return;
  }
  if (parsedBudget === null || parsedBudget === 'INVALID' || parsedBudget <= 0) {
    sendJson(res, 400, { error: 'Please enter a valid investment budget in INR.' });
    return;
  }
  if (location.length < 2) {
    sendJson(res, 400, { error: 'Please enter your city or location.' });
    return;
  }
  if (targetCustomers.length < 3) {
    sendJson(res, 400, { error: 'Please describe your target customers.' });
    return;
  }
  if (productsOrServices.length < 3) {
    sendJson(res, 400, { error: 'Please list your main products or services.' });
    return;
  }

  try {
    const plan = await generateBusinessPlan({
      businessIdea: businessIdea.slice(0, 250),
      budgetInr: parsedBudget,
      location: location.slice(0, 120),
      targetCustomers: targetCustomers.slice(0, 250),
      productsOrServices: productsOrServices.slice(0, 300),
    });
    sendJson(res, 200, { plan });
  } catch (err: unknown) {
    respondWithGeminiError(res, err, 'HERBIZ business-plan error');
  }
}

export async function handleMarketingAssistant(req: ApiRequest, res: ApiResponse): Promise<void> {
  let body: Partial<MarketingAssistantRequest> | undefined;
  try {
    body = (await readJsonBody(req)) as Partial<MarketingAssistantRequest> | undefined;
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON payload submitted to /api/marketing-assistant.' });
    return;
  }

  const businessName = typeof body?.businessName === 'string' ? body.businessName.trim() : '';
  const productOrService =
    typeof body?.productOrService === 'string' ? body.productOrService.trim() : '';
  const targetAudience =
    typeof body?.targetAudience === 'string' ? body.targetAudience.trim() : '';
  const allowedPlatforms: Array<MarketingAssistantRequest['platform']> = [
    'Instagram',
    'WhatsApp Business',
    'Facebook',
    'Local & Multi-platform',
  ];
  const platform = allowedPlatforms.includes(
    body?.platform as MarketingAssistantRequest['platform']
  )
    ? (body?.platform as MarketingAssistantRequest['platform'])
    : 'Instagram';
  const toneNote = typeof body?.toneNote === 'string' ? body.toneNote.trim() : undefined;

  if (businessName.length < 2) {
    sendJson(res, 400, { error: 'Please enter your business name.' });
    return;
  }
  if (productOrService.length < 3) {
    sendJson(res, 400, { error: 'Please enter the product or service you want to promote.' });
    return;
  }
  if (targetAudience.length < 3) {
    sendJson(res, 400, { error: 'Please describe your target audience.' });
    return;
  }

  try {
    const kit = await generateMarketingKit({
      businessName: businessName.slice(0, 120),
      productOrService: productOrService.slice(0, 250),
      targetAudience: targetAudience.slice(0, 250),
      platform,
      toneNote: toneNote ? toneNote.slice(0, 180) : undefined,
    });
    sendJson(res, 200, { kit });
  } catch (err: unknown) {
    respondWithGeminiError(res, err, 'HERBIZ marketing-assistant error');
  }
}
