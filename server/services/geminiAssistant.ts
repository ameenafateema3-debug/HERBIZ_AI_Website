import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { retrieveRelevantKnowledge, type ScoredKnowledgeChunk } from '../knowledge/retrieval.ts';
import type { BusinessAssessment, ChatSourceNote } from '../../src/types/herbiz.ts';

export interface ChatTurnInput {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantReply {
  reply: string;
  matchedTopics: string[];
  sourceNotes: ChatSourceNote[];
  retrievedExcerpts: Array<{ area: string; section: string; score: number; preview: string }>;
  insufficientKnowledge: boolean;
  fallbackUsed: boolean;
  referencedResources: Array<{ title: string; url: string }>;
}

const SENSITIVE_CREDENTIAL_PATTERN =
  /\b(otp|one[- ]time[- ]password|atm pin|upi pin|cvv|card number|ifsc.*account|bank password|mpin)\b/i;

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

function buildSystemInstruction(userProfileContext: string): string {
  return `You are HERBIZ AI Assistant, a business-support assistant for women running micro and small businesses in India.

YOUR ROLE
Explain business concepts and help users plan practical next steps in finance, marketing, business growth, digital adoption, and verified support resources.

KNOWLEDGE
You will be given retrieved excerpts from the HERBIZ knowledge library inside the user message. Base your answer specifically on those retrieved excerpts (using their exact formulas, checklists, definitions, truth rules, and official URLs). Do NOT give vague generic advice that ignores the retrieved text.
If the retrieved excerpts do not contain a specific fact (such as current interest rates, tax slabs, eligibility rules, funding amounts, or deadlines), explicitly state that you do not have enough verified information in the HERBIZ knowledge library. Never invent facts, schemes, eligibility rules, funding amounts, deadlines, or official links. Never treat the 600-record fictional demonstration dataset as real survey data or real user records.

CLARIFY
Ask one short clarifying question when important details are missing. For calculations, confirm that sales and expenses refer to the same period and currency.

FINANCE
Simple estimated profit = sales minus expenses for the same period. Explain that this is not a full audited profit calculation and may exclude taxes, interest, depreciation, and other adjustments. Never guarantee profit or business success.

RESPONSE FORMAT
When helpful, answer with:
1. What the challenge may be
2. Possible reasons
3. Practical suggested actions
4. Priority (High, Medium or Low)
5. One next step

PRIVACY
Never ask for passwords, OTPs, PINs, full banking credentials, or unnecessary sensitive personal information. Use only business information the user deliberately provides to the app.

LIMITS
You do not approve loans, provide legal decisions, or determine official government scheme eligibility. Direct users to verified official sources for current rules. Use simple English and explain unfamiliar terms. Use only HERBIZ AI's built-in dashboard and tools; never recommend external BI embeds.

USER-SUBMITTED BUSINESS CONTEXT:
${userProfileContext}`;
}

function buildInsufficientKnowledgeFallback(query: string): string {
  const asksAboutExternalSchemeOrTax =
    /\b(gst|tax|slab|rate|interest|subsidy|loan|mudra|standup|stand-up|scheme|deadline|eligibility|grant|registration|license|fssai|trademark)\b/i.test(
      query
    );

  if (asksAboutExternalSchemeOrTax) {
    return (
      'I do not have enough verified information in the HERBIZ knowledge library to answer this specific rule, rate, or scheme detail.\n\n' +
      'HERBIZ AI covers general micro-business guidance across Finance, Marketing, Business Growth, Digital Tools, India Entrepreneurship Resources, and Business FAQ, and does not store live tax rates, loan interest rates, or current scheme deadlines.\n\n' +
      'Where to check verified official rules:\n' +
      '• Ministry of MSME: https://msme.gov.in/\n' +
      '• Startup India Schemes Directory: https://www.startupindia.gov.in/content/sih/en/government-schemes.html\n' +
      '• For tax, GST, or legal compliance, please consult a qualified accountant or official government portal.'
    );
  }

  return (
    'I do not have enough verified information in the HERBIZ knowledge library to answer that question reliably.\n\n' +
    'I can help with practical micro and small business topics covered in the HERBIZ library:\n' +
    '• Finance (profit formulas, budgeting, pricing, cash flow, records)\n' +
    '• Marketing (customer focus, low-cost promotion, catalogues, handling complaints)\n' +
    '• Business Growth (30-day plans, retention, stock & capacity)\n' +
    '• Digital Tools (spreadsheets, digital safety, payments, online catalogues)\n' +
    '• India Resources (official MSME and Startup India portals)\n\n' +
    'Could you share one short question about your business finances, customers, growth plan, or official India portals?'
  );
}

function formatRetrievedExcerpts(scoredChunks: ScoredKnowledgeChunk[]): string {
  return scoredChunks
    .map(
      ({ chunk }) =>
        `[${chunk.area} — ${chunk.sectionTitle}]\n${chunk.content}`
    )
    .join('\n\n---\n\n');
}

export async function generateAssistantReply(params: {
  messages: ChatTurnInput[];
  userProfile?: BusinessAssessment | null;
}): Promise<AssistantReply> {
  const { messages, userProfile } = params;
  const userTurns = messages.filter((m) => m.role === 'user');
  const latestUserMessage = userTurns[userTurns.length - 1]?.content ?? '';
  const previousUserMessage =
    userTurns.length >= 2 ? userTurns[userTurns.length - 2]?.content : undefined;

  if (SENSITIVE_CREDENTIAL_PATTERN.test(latestUserMessage)) {
    return {
      reply:
        'For your safety, please never share OTPs, UPI PINs, ATM PINs, passwords, CVV numbers, or private bank credentials here or with anyone online.\n\nIf you would like business guidance, please share only general figures such as approximate monthly sales, monthly expenses, or your business challenge.',
      matchedTopics: ['Digital Tools · Digital safety checklist'],
      sourceNotes: [{ area: 'Digital Tools', section: 'Digital safety checklist' }],
      retrievedExcerpts: [],
      insufficientKnowledge: false,
      fallbackUsed: true,
      referencedResources: [],
    };
  }

  const activeProfile = userProfile && !userProfile.isDemoSample ? userProfile : null;

  // Step 1: Search the 6-file HERBIZ knowledge library BEFORE calling Gemini
  const retrieval = retrieveRelevantKnowledge(
    latestUserMessage,
    activeProfile,
    previousUserMessage,
    4
  );

  // Step 2: Safe deterministic fallback when no relevant text is found in the library
  if (retrieval.insufficientKnowledge) {
    return {
      reply: buildInsufficientKnowledgeFallback(latestUserMessage),
      matchedTopics: [],
      sourceNotes: [],
      retrievedExcerpts: [],
      insufficientKnowledge: true,
      fallbackUsed: true,
      referencedResources: [],
    };
  }

  // Step 3: Build grounded Gemini prompt with retrieved HERBIZ text injected into the active turn
  const retrievedExcerptsText =
    retrieval.scoredChunks.length > 0
      ? formatRetrievedExcerpts(retrieval.scoredChunks)
      : 'Greeting / conversation opening. Keep welcome brief and invite a question on Finance, Marketing, Business Growth, Digital Tools, or India Resources.';

  const resourcesText =
    retrieval.resources.length > 0
      ? retrieval.resources
          .map((r) => `- ${r.title}: ${r.url} (${r.note})`)
          .join('\n')
      : 'None needed unless user asks for official portals.';

  const userProfileContext = activeProfile
    ? `The user explicitly submitted this business assessment:
- Business Name: ${activeProfile.businessName || 'Not provided'}
- Category: ${activeProfile.businessCategory}
- Stage: ${activeProfile.businessStage}
- City/State: ${activeProfile.cityState || 'Not provided'}
- Monthly Sales: ${activeProfile.monthlySales !== null ? `INR ${activeProfile.monthlySales}` : 'Not provided'}
- Monthly Expenses: ${activeProfile.monthlyExpenses !== null ? `INR ${activeProfile.monthlyExpenses}` : 'Not provided'}
- Same-Month Figures Confirmed: ${activeProfile.sameMonthPeriodConfirmed ? 'Yes' : 'No'}
- Employees: ${activeProfile.employeesCount}
- Main Challenge: ${activeProfile.mainChallenge}
- Digital Tools Used: ${activeProfile.digitalToolsUsed.join(', ') || 'None specified'}
- Business Goal: ${activeProfile.businessGoal}`
    : 'No personal business assessment has been submitted by this user yet. Use only details the user shares directly in chat.';

  const systemInstruction = buildSystemInstruction(userProfileContext);

  const priorTurns = messages.slice(-12, -1).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const groundedCurrentTurn = {
    role: 'user',
    parts: [
      {
        text:
          `RETRIEVED HERBIZ KNOWLEDGE MATERIAL (use these exact concepts, formulas, checklists, and rules):\n` +
          `${retrievedExcerptsText}\n\n` +
          `VERIFIED OFFICIAL RESOURCES:\n${resourcesText}\n\n` +
          `USER QUESTION:\n${latestUserMessage}`,
      },
    ],
  };

  const contents = [...priorTurns, groundedCurrentTurn];

  const ai = getGeminiClient();

  let response;
  let lastError: unknown;
  const attempts: Array<{ model: string; useLowThinking: boolean }> = [
    { model: 'gemini-4-hydrogen', useLowThinking: true },
    { model: 'gemini-3.1-flash-lite', useLowThinking: false },
  ];

  for (let idx = 0; idx < attempts.length; idx++) {
    const { model, useLowThinking } = attempts[idx];
    try {
      response = await ai.models.generateContent({
        model,
        contents,
        config: useLowThinking
          ? {
              systemInstruction,
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW,
              },
            }
          : {
              systemInstruction,
            },
      });
      break;
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : undefined;
      console.warn(
        `HERBIZ Gemini attempt ${idx + 1} (${model}) failed with status=${status ?? 'unknown'}:`,
        err instanceof Error ? err.message : String(err)
      );
      if ((status === 503 || status === 500 || status === 429) && idx < attempts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }
      throw err;
    }
  }

  if (!response) {
    throw lastError instanceof Error ? lastError : new Error('GEMINI_UNAVAILABLE');
  }

  const text = response.text?.trim();
  if (!text) {
    throw new Error('EMPTY_MODEL_RESPONSE');
  }

  return {
    reply: text,
    matchedTopics: retrieval.sourceNotes.map((n) => `${n.area} · ${n.section}`),
    sourceNotes: retrieval.sourceNotes,
    retrievedExcerpts: retrieval.scoredChunks.map(({ chunk, score }) => ({
      area: chunk.area,
      section: chunk.sectionTitle,
      score: Number(score.toFixed(1)),
      preview: chunk.content.slice(0, 140),
    })),
    insufficientKnowledge: retrieval.insufficientKnowledge,
    fallbackUsed: false,
    referencedResources: retrieval.resources.map((r) => ({ title: r.title, url: r.url })),
  };
}

export interface ProfileAnalysisInput {
  businessCategory: string;
  businessStage: string;
  monthlySales: number;
  monthlyExpenses: number;
  selectedChallenge: string;
  businessGoal: string;
}

export interface ProfileAnalysisResult {
  monthlySales: number;
  monthlyExpenses: number;
  simpleEstimatedProfit: number;
  profitNote: string;
  guidanceLabel: string;
  guidanceDisclaimer: string;
  analysis: string;
  sourceNotes: ChatSourceNote[];
  referencedResources: Array<{ title: string; url: string }>;
}

export async function analyzeBusinessProfile(
  input: ProfileAnalysisInput
): Promise<ProfileAnalysisResult> {
  const simpleEstimatedProfit = input.monthlySales - input.monthlyExpenses;
  const profitNote =
    'Simple estimated profit = Monthly Sales minus Monthly Expenses for the same month. This is an estimate only and is not a full audited profit calculation (it excludes taxes, interest, depreciation, and other adjustments).';

  const guidanceLabel = 'Guidance Only — Not a Guarantee';
  const guidanceDisclaimer =
    'This analysis is decision-support guidance based on the HERBIZ knowledge library and the figures you provided. It is not financial, tax, or legal advice, and does not guarantee profit or business success.';

  const searchQuery = `${input.selectedChallenge} ${input.businessGoal} ${input.businessCategory} ${input.businessStage} simple estimated profit margin practical next steps`;
  const retrieval = retrieveRelevantKnowledge(searchQuery, null, undefined, 5);

  const retrievedExcerptsText =
    retrieval.scoredChunks.length > 0
      ? formatRetrievedExcerpts(retrieval.scoredChunks)
      : 'No specific section matched directly; state clearly where HERBIZ knowledge is limited.';

  const resourcesText =
    retrieval.resources.length > 0
      ? retrieval.resources.map((r) => `- ${r.title}: ${r.url} (${r.note})`).join('\n')
      : 'None required unless helpful for official portal verification.';

  const systemInstruction = `You are HERBIZ AI Assistant, a business-support assistant for women running micro and small businesses in India.

ROLE & GROUNDING
Explain the calculated simple estimated profit and suggest practical next steps using ONLY the retrieved HERBIZ knowledge material below and the user's submitted business profile fields.
- Simple estimated profit = Monthly Sales minus Monthly Expenses for the same month. Always explain that this is NOT a full audited profit calculation and may exclude taxes, interest, depreciation, and other adjustments.
- Never guarantee profit, income, or business success.
- Never invent government schemes, eligibility rules, interest rates, or links not present in the retrieved material.
- Use simple, clear English.

RESPONSE STRUCTURE
1. Simple Estimated Profit Explanation (explain INR ${simpleEstimatedProfit} from INR ${input.monthlySales} sales minus INR ${input.monthlyExpenses} expenses for the same month, plus the estimate disclaimer)
2. What the Challenge May Be & Possible Reasons (tied to "${input.selectedChallenge}")
3. Practical Next Steps (3–4 concrete actions tailored to "${input.businessCategory}" at "${input.businessStage}" stage toward their goal)
4. Priority (High, Medium, or Low) and One Immediate Next Step`;

  const userPrompt = `RETRIEVED HERBIZ KNOWLEDGE MATERIAL:
${retrievedExcerptsText}

VERIFIED OFFICIAL RESOURCES:
${resourcesText}

MINIMAL BUSINESS PROFILE FOR ANALYSIS (NO PERSONAL/CONTACT DATA):
- Business Category: ${input.businessCategory}
- Business Stage: ${input.businessStage}
- Same-Month Sales: INR ${input.monthlySales}
- Same-Month Expenses: INR ${input.monthlyExpenses}
- Calculated Simple Estimated Profit: INR ${simpleEstimatedProfit}
- Selected Challenge: ${input.selectedChallenge}
- Business Goal: ${input.businessGoal}

Please explain the simple estimated profit result and suggest practical next steps based on the HERBIZ knowledge library.`;

  const ai = getGeminiClient();
  let response;
  let lastError: unknown;
  const attempts: Array<{ model: string; useLowThinking: boolean }> = [
    { model: 'gemini-4-hydrogen', useLowThinking: true },
    { model: 'gemini-3.1-flash-lite', useLowThinking: false },
  ];

  for (let idx = 0; idx < attempts.length; idx++) {
    const { model, useLowThinking } = attempts[idx];
    try {
      response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        config: useLowThinking
          ? {
              systemInstruction,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            }
          : { systemInstruction },
      });
      break;
    } catch (err: unknown) {
      lastError = err;
      const status =
        typeof err === 'object' && err !== null && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : undefined;
      console.warn(
        `HERBIZ profile analysis attempt ${idx + 1} (${model}) failed with status=${status ?? 'unknown'}:`,
        err instanceof Error ? err.message : String(err)
      );
      if ((status === 503 || status === 500 || status === 429) && idx < attempts.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }
      throw err;
    }
  }

  if (!response) {
    throw lastError instanceof Error ? lastError : new Error('GEMINI_UNAVAILABLE');
  }

  const text = response.text?.trim();
  if (!text) {
    throw new Error('EMPTY_MODEL_RESPONSE');
  }

  return {
    monthlySales: input.monthlySales,
    monthlyExpenses: input.monthlyExpenses,
    simpleEstimatedProfit,
    profitNote,
    guidanceLabel,
    guidanceDisclaimer,
    analysis: text,
    sourceNotes: retrieval.sourceNotes,
    referencedResources: retrieval.resources.map((r) => ({ title: r.title, url: r.url })),
  };
}
