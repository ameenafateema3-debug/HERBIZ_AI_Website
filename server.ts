import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERIFIED_RESOURCES } from './server/knowledge/verifiedResources.ts';
import { getKnowledgeAreasSummary } from './server/knowledge/herbizKnowledge.ts';
import { generateRecommendations } from './server/services/recommendationEngine.ts';
import {
  analyzeBusinessProfile,
  generateAssistantReply,
  type ChatTurnInput,
} from './server/services/geminiAssistant.ts';
import type {
  BusinessAssessment,
  FeedbackSubmission,
  ProfileAnalysisRequest,
} from './src/types/herbiz.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

// In-memory session store for prototype feedback submissions
interface StoredFeedback extends FeedbackSubmission {
  id: string;
  submittedAt: string;
}
const sessionFeedbackLog: StoredFeedback[] = [];

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'HERBIZ AI',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

app.get('/api/resources', (_req: Request, res: Response) => {
  res.json({
    resources: VERIFIED_RESOURCES,
    disclaimer:
      'HERBIZ AI is not a government eligibility checker or loan approval service. Always verify current scheme details, eligibility, amounts, and deadlines directly on the official portal.',
  });
});

app.get('/api/knowledge/topics', (_req: Request, res: Response) => {
  res.json({
    topics: getKnowledgeAreasSummary(),
  });
});

function parseOptionalNonNegativeNumber(value: unknown): number | null | 'INVALID' {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 'INVALID';
  return num;
}

app.post('/api/recommendations', (req: Request, res: Response) => {
  const body = req.body as Partial<BusinessAssessment> | undefined;
  if (
    !body ||
    typeof body.businessCategory !== 'string' ||
    !body.businessCategory.trim() ||
    typeof body.mainChallenge !== 'string' ||
    !body.mainChallenge.trim()
  ) {
    res.status(400).json({
      error: 'Please provide a business category and main challenge to generate recommendations.',
    });
    return;
  }

  const parsedSales = parseOptionalNonNegativeNumber(body.monthlySales);
  const parsedExpenses = parseOptionalNonNegativeNumber(body.monthlyExpenses);
  if (parsedSales === 'INVALID' || parsedExpenses === 'INVALID') {
    res.status(400).json({
      error: 'Monthly sales and monthly expenses must be valid non-negative numbers when provided.',
    });
    return;
  }

  const parsedEmployees = Number(body.employeesCount);
  if (!Number.isFinite(parsedEmployees) || parsedEmployees < 0 || !Number.isInteger(parsedEmployees)) {
    res.status(400).json({
      error: 'Number of employees must be a valid non-negative whole number.',
    });
    return;
  }

  const assessment: BusinessAssessment = {
    businessName: typeof body.businessName === 'string' ? body.businessName.slice(0, 120) : '',
    businessCategory: body.businessCategory.slice(0, 80),
    businessStage: typeof body.businessStage === 'string' ? body.businessStage.slice(0, 80) : 'Early Stage (0–1 year)',
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
  res.json({ recommendation: result });
});

app.post('/api/chat', async (req: Request, res: Response) => {
  const body = req.body as {
    messages?: ChatTurnInput[];
    userProfile?: BusinessAssessment | null;
  };

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: 'Please enter a message to ask the HERBIZ AI assistant.' });
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
    res.status(400).json({ error: 'Message content cannot be empty.' });
    return;
  }

  try {
    const reply = await generateAssistantReply({
      messages: cleanMessages,
      userProfile: body.userProfile ?? null,
    });
    res.json(reply);
  } catch (err: unknown) {
    respondWithGeminiError(res, err, 'HERBIZ AI chat error');
  }
});

function respondWithGeminiError(res: Response, err: unknown, logPrefix: string) {
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
    res.status(503).json({
      error:
        'This Gemini AI connection is currently unavailable because the server Gemini API key is missing or invalid. Please check Settings > Secrets.',
    });
    return;
  }

  if (message.includes('RESOURCE_EXHAUSTED') || statusCode === 429) {
    res.status(429).json({
      error:
        'The Gemini AI service reached its request limit right now. This analysis is temporarily unavailable; please wait a moment and try again.',
    });
    return;
  }

  if (statusCode === 503) {
    res.status(503).json({
      error:
        'The Gemini AI service is temporarily unavailable due to high demand. Please try again in a moment.',
    });
    return;
  }

  res.status(500).json({
    error: 'The Gemini AI profile analysis is currently unavailable. Please try again in a moment.',
  });
}

app.post('/api/analyze-profile', async (req: Request, res: Response) => {
  const body = req.body as Partial<ProfileAnalysisRequest> | undefined;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Please submit your business profile fields first.' });
    return;
  }

  const missingFields: string[] = [];
  const businessCategory = typeof body.businessCategory === 'string' ? body.businessCategory.trim() : '';
  const businessStage = typeof body.businessStage === 'string' ? body.businessStage.trim() : '';
  const selectedChallenge =
    typeof body.selectedChallenge === 'string' ? body.selectedChallenge.trim() : '';
  const businessGoal = typeof body.businessGoal === 'string' ? body.businessGoal.trim() : '';
  const parsedSales = parseOptionalNonNegativeNumber(body.monthlySales);
  const parsedExpenses = parseOptionalNonNegativeNumber(body.monthlyExpenses);

  if (!businessCategory) missingFields.push('Business Category');
  if (!businessStage) missingFields.push('Business Stage');
  if (parsedSales === null || parsedSales === 'INVALID') missingFields.push('Monthly Sales (INR)');
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
    res.status(400).json({
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
    res.json(result);
  } catch (err: unknown) {
    respondWithGeminiError(res, err, 'HERBIZ analyze-profile error');
  }
});

app.post('/api/feedback', (req: Request, res: Response) => {
  const body = req.body as Partial<FeedbackSubmission> | undefined;
  if (!body || typeof body.comments !== 'string' || body.comments.trim().length < 5) {
    res.status(400).json({
      error: 'Please write at least a short comment (5+ characters) before submitting feedback.',
    });
    return;
  }

  const ratingNum = Number(body.rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: 'Please select a rating between 1 and 5.' });
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

  res.status(201).json({
    ok: true,
    referenceId: entry.id,
    category: entry.category,
    rating: entry.rating,
    mostUsefulArea: entry.mostUsefulArea,
    submittedAt: entry.submittedAt,
    note: 'Thank you for sharing your feedback! This is a demonstration form for the current prototype session—your response is not permanently stored in a database.',
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HERBIZ AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
