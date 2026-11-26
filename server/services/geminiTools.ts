import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { retrieveRelevantKnowledge, type ScoredKnowledgeChunk } from '../knowledge/retrieval.ts';
import type {
  BusinessPlanRequest,
  BusinessPlanResponse,
  IdeaFinderRequest,
  IdeaFinderResponse,
  MarketingAssistantRequest,
  MarketingAssistantResponse,
} from '../../src/types/herbiz.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatRetrievedExcerpts(scoredChunks: ScoredKnowledgeChunk[]): string {
  if (scoredChunks.length === 0) {
    return 'General HERBIZ micro-business principles: start small, track monthly sales vs. expenses, protect digital accounts, and avoid guaranteed profit claims.';
  }
  return scoredChunks
    .map(({ chunk }) => `[${chunk.area} — ${chunk.sectionTitle}]\n${chunk.content}`)
    .join('\n\n---\n\n');
}

async function generateStructuredJson<T>(params: {
  systemInstruction: string;
  prompt: string;
  responseSchema: Record<string, unknown>;
  logLabel: string;
}): Promise<T> {
  const ai = getGeminiClient();
  const attempts: Array<{ model: string; useLowThinking: boolean }> = [
    { model: 'gemini-4-hydrogen', useLowThinking: true },
    { model: 'gemini-3.1-flash-lite', useLowThinking: false },
  ];

  let lastError: unknown;
  for (let idx = 0; idx < attempts.length; idx++) {
    const { model, useLowThinking } = attempts[idx];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: params.prompt }] }],
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema,
          ...(useLowThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
        },
      });

      const raw = (response.text ?? '').trim();
      if (!raw) {
        throw new Error('EMPTY_MODEL_RESPONSE');
      }
      return JSON.parse(raw) as T;
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : undefined;
      console.warn(
        `HERBIZ ${params.logLabel} attempt ${idx + 1} (${model}) failed:`,
        status ?? '',
        err instanceof Error ? err.message : String(err)
      );
      if ((status === 503 || status === 500 || status === 429) && idx < attempts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('GEMINI_UNAVAILABLE');
}

export async function generateBusinessIdeas(
  input: IdeaFinderRequest
): Promise<IdeaFinderResponse> {
  const retrieval = retrieveRelevantKnowledge(
    `start small business idea ${input.preferredBusinessType} ${input.skillsAndInterests} ${input.workSetting} startup budget INR ${input.budgetInr} marketing customers`,
    null,
    undefined,
    4
  );

  const systemInstruction = `You are HERBIZ AI Business Idea Advisor supporting women entrepreneurs in India.
Generate 3 practical, realistic small business ideas tailored to the user's budget, skills, preferred business type, and work setting (${input.workSetting}).

STRICT HONESTY & SAFETY RULES:
- Use Indian context and INR (₹) ranges realistic for micro/small businesses starting within roughly ₹${input.budgetInr}.
- Label all investment figures as rough estimates ("Estimated ₹X – ₹Y").
- NEVER guarantee profit, income, or business success.
- NEVER invent government subsidies, loan approvals, or official deadlines.
- Keep language simple, encouraging, and practical.
- Never recommend external BI dashboard embeds.`;

  const prompt = `RETRIEVED HERBIZ KNOWLEDGE CONTEXT:
${formatRetrievedExcerpts(retrieval.scoredChunks)}

ENTREPRENEUR INPUTS:
- Available Investment Budget: INR ${input.budgetInr}
- Skills & Interests: ${input.skillsAndInterests}
- Preferred Business Type: ${input.preferredBusinessType}
- Preferred Setup: ${input.workSetting}

Return exactly 3 practical small business ideas as JSON.`;

  const parsed = await generateStructuredJson<{
    ideas: Array<{
      businessName: string;
      shortDescription: string;
      estimatedStartupInvestment: string;
      targetCustomers: string;
      requiredSkills: string[];
      potentialChallenges: string[];
      firstSteps: string[];
    }>;
  }>({
    systemInstruction,
    prompt,
    logLabel: 'idea-finder',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        ideas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              businessName: { type: Type.STRING },
              shortDescription: { type: Type.STRING },
              estimatedStartupInvestment: { type: Type.STRING },
              targetCustomers: { type: Type.STRING },
              requiredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              potentialChallenges: { type: Type.ARRAY, items: { type: Type.STRING } },
              firstSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'businessName',
              'shortDescription',
              'estimatedStartupInvestment',
              'targetCustomers',
              'requiredSkills',
              'potentialChallenges',
              'firstSteps',
            ],
          },
        },
      },
      required: ['ideas'],
    },
  });

  return {
    ideas: Array.isArray(parsed.ideas) ? parsed.ideas.slice(0, 4) : [],
    sourceNotes: retrieval.sourceNotes,
    guidanceDisclaimer:
      'These business ideas and startup investment figures are rough estimates for exploration only—not financial guarantees or formal market feasibility studies.',
  };
}

export async function generateBusinessPlan(
  input: BusinessPlanRequest
): Promise<BusinessPlanResponse> {
  const retrieval = retrieveRelevantKnowledge(
    `business plan 30-day action plan startup costs expected expenses marketing strategy challenges ${input.businessIdea} ${input.productsOrServices}`,
    null,
    undefined,
    5
  );

  const systemInstruction = `You are HERBIZ AI Business Planning Assistant helping women entrepreneurs in India structure practical small business plans.

STRICT RULES:
- Base planning principles on the retrieved HERBIZ knowledge library (30-day step-by-step growth, keeping personal and business finances separate, unit pricing, low-cost marketing).
- Clearly present startup costs and monthly expenses as rough estimates in INR (₹) calibrated to their stated budget of INR ${input.budgetInr}.
- Do NOT promise or guarantee revenue, profit, or loan approval.
- Keep every section plain-English, structured, and immediately actionable.`;

  const prompt = `RETRIEVED HERBIZ KNOWLEDGE CONTEXT:
${formatRetrievedExcerpts(retrieval.scoredChunks)}

BUSINESS PLAN INPUTS:
- Business Idea: ${input.businessIdea}
- Investment Budget: INR ${input.budgetInr}
- Location: ${input.location}
- Target Customers: ${input.targetCustomers}
- Products or Services: ${input.productsOrServices}

Generate a complete 8-part structured business plan with a 4-week (30-day) action plan.`;

  const parsed = await generateStructuredJson<{
    businessTitle: string;
    businessOverview: string;
    productsOrServices: string[];
    targetCustomers: string;
    estimatedStartupCosts: string[];
    marketingStrategy: string[];
    businessChallenges: string[];
    expectedExpenses: string[];
    thirtyDayActionPlan: Array<{
      weekLabel: string;
      focus: string;
      tasks: string[];
    }>;
  }>({
    systemInstruction,
    prompt,
    logLabel: 'business-plan',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        businessTitle: { type: Type.STRING },
        businessOverview: { type: Type.STRING },
        productsOrServices: { type: Type.ARRAY, items: { type: Type.STRING } },
        targetCustomers: { type: Type.STRING },
        estimatedStartupCosts: { type: Type.ARRAY, items: { type: Type.STRING } },
        marketingStrategy: { type: Type.ARRAY, items: { type: Type.STRING } },
        businessChallenges: { type: Type.ARRAY, items: { type: Type.STRING } },
        expectedExpenses: { type: Type.ARRAY, items: { type: Type.STRING } },
        thirtyDayActionPlan: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              weekLabel: { type: Type.STRING },
              focus: { type: Type.STRING },
              tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['weekLabel', 'focus', 'tasks'],
          },
        },
      },
      required: [
        'businessTitle',
        'businessOverview',
        'productsOrServices',
        'targetCustomers',
        'estimatedStartupCosts',
        'marketingStrategy',
        'businessChallenges',
        'expectedExpenses',
        'thirtyDayActionPlan',
      ],
    },
  });

  return {
    ...parsed,
    sourceNotes: retrieval.sourceNotes,
    guidanceDisclaimer:
      'Startup costs, expected expenses, and 30-day action steps are planning estimates for educational guidance—not guaranteed financial projections.',
  };
}

export async function generateMarketingKit(
  input: MarketingAssistantRequest
): Promise<MarketingAssistantResponse> {
  const retrieval = retrieveRelevantKnowledge(
    `marketing captions whatsapp promotional message product descriptions slogans ${input.platform} ${input.productOrService} ${input.targetAudience}`,
    null,
    undefined,
    4
  );

  const systemInstruction = `You are HERBIZ AI Marketing Assistant for women-led micro and small businesses in India.

STRICT RULES:
- Use simple, warm, trustworthy English tailored to Indian customers and the requested platform (${input.platform}).
- Avoid exaggerated or false claims (never promise guaranteed results or fake discounts).
- Make WhatsApp messages concise and easy to forward/broadcast, Instagram captions engaging with 4–6 relevant hashtags, and product descriptions clear about benefits and how to order.
- Base low-cost marketing strategy suggestions on the retrieved HERBIZ Marketing and Digital Tools knowledge.`;

  const prompt = `RETRIEVED HERBIZ KNOWLEDGE CONTEXT:
${formatRetrievedExcerpts(retrieval.scoredChunks)}

MARKETING INPUTS:
- Business Name: ${input.businessName}
- Product or Service: ${input.productOrService}
- Target Audience: ${input.targetAudience}
- Primary Platform: ${input.platform}
- Optional Tone / Offer Note: ${input.toneNote || 'Warm, clear, trustworthy small-business voice'}

Generate:
- 3 Instagram captions
- 3 WhatsApp promotional messages
- 2 product descriptions (1 short catalogue blurb, 1 detailed storytelling description)
- 4 business slogans
- 4 practical marketing strategies`;

  const parsed = await generateStructuredJson<{
    instagramCaptions: string[];
    whatsappMessages: string[];
    productDescriptions: Array<{ label: string; copy: string }>;
    businessSlogans: string[];
    marketingStrategies: string[];
  }>({
    systemInstruction,
    prompt,
    logLabel: 'marketing-assistant',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        instagramCaptions: { type: Type.ARRAY, items: { type: Type.STRING } },
        whatsappMessages: { type: Type.ARRAY, items: { type: Type.STRING } },
        productDescriptions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              copy: { type: Type.STRING },
            },
            required: ['label', 'copy'],
          },
        },
        businessSlogans: { type: Type.ARRAY, items: { type: Type.STRING } },
        marketingStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: [
        'instagramCaptions',
        'whatsappMessages',
        'productDescriptions',
        'businessSlogans',
        'marketingStrategies',
      ],
    },
  });

  return {
    ...parsed,
    sourceNotes: retrieval.sourceNotes,
    guidanceDisclaimer:
      'Review and customize prices, order links, and local details before publishing. Marketing copy is generated guidance, not a sales guarantee.',
  };
}
