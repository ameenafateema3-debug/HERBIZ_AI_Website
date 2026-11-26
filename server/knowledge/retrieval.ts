import { getHerbizKnowledgeLibrary, type KnowledgeChunk } from './library/index.ts';
import { VERIFIED_RESOURCES } from './verifiedResources.ts';
import type { BusinessAssessment, ChatSourceNote, VerifiedResource } from '../../src/types/herbiz.ts';

export interface ScoredKnowledgeChunk {
  chunk: KnowledgeChunk;
  score: number;
  matchedTerms: string[];
}

export interface RetrievalResult {
  chunks: KnowledgeChunk[];
  scoredChunks: ScoredKnowledgeChunk[];
  sourceNotes: ChatSourceNote[];
  resources: VerifiedResource[];
  insufficientKnowledge: boolean;
  isGreeting: boolean;
  topScore: number;
}

const STOPWORDS = new Set([
  'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
  'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
  'what', 'which', 'who', 'whom', 'how', 'why', 'where', 'can',
  'could', 'should', 'would', 'will', 'do', 'does', 'did', 'have',
  'has', 'had', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'with',
  'from', 'as', 'into', 'about', 'my', 'me', 'i', 'we', 'our', 'you',
  'your', 'it', 'its', 'this', 'that', 'these', 'those', 'please',
  'tell', 'give', 'want', 'need', 'help', 'know', 'make', 'get',
  'use', 'using', 'much', 'many', 'more', 'some', 'any', 'today',
]);

const SYNONYM_MAP: Record<string, string[]> = {
  profit: ['profit', 'margin', 'net', 'gross', 'surplus', 'revenue', 'earnings'],
  margins: ['margin', 'profit', 'pricing', 'cost'],
  expense: ['expense', 'expenses', 'cost', 'costs', 'spending', 'cogs'],
  expenses: ['expense', 'expenses', 'cost', 'costs', 'spending', 'cogs'],
  cost: ['cost', 'costs', 'cogs', 'expense', 'expenses', 'pricing'],
  costs: ['cost', 'costs', 'cogs', 'expense', 'expenses', 'pricing'],
  price: ['price', 'pricing', 'unit', 'margin', 'discount'],
  pricing: ['price', 'pricing', 'unit', 'margin', 'cost'],
  budget: ['budget', 'budgeting', 'monthly', 'cash', 'reserve'],
  breakeven: ['break-even', 'fixed', 'contribution', 'units'],
  break: ['break-even', 'fixed', 'contribution'],
  cashflow: ['cash', 'flow', 'working', 'capital', 'receivables', 'payables'],
  cash: ['cash', 'flow', 'working', 'capital', 'balance'],
  records: ['record', 'records', 'register', 'registers', 'spreadsheet', 'ledger', 'receipts'],
  ledger: ['register', 'records', 'spreadsheet', 'expenses', 'sales'],
  marketing: ['marketing', 'promote', 'promotion', 'customers', 'reach', 'content', 'catalogue'],
  promote: ['marketing', 'promote', 'promotion', 'catalogue', 'referrals', 'content'],
  customers: ['customer', 'customers', 'buyer', 'buyers', 'repeat', 'retention', 'enquiries'],
  customer: ['customer', 'customers', 'buyer', 'enquiries', 'complaint', 'retention'],
  instagram: ['social', 'content', 'marketing', 'post', 'catalogue', 'photos'],
  whatsapp: ['whatsapp', 'messaging', 'catalogue', 'enquiries', 'digital'],
  grow: ['growth', 'expand', 'expansion', 'retention', 'capacity', 'goal', 'goals'],
  growth: ['growth', 'expand', 'expansion', 'retention', 'capacity', 'plan'],
  expand: ['expand', 'expansion', 'capacity', 'growth', 'risk'],
  stock: ['stock', 'inventory', 'reorder', 'wastage', 'slow-moving'],
  inventory: ['inventory', 'stock', 'register', 'reorder', 'closing'],
  digital: ['digital', 'spreadsheet', 'catalogue', 'ecommerce', 'payments', 'safety', 'ai'],
  upi: ['payment', 'payments', 'digital', 'otp', 'pin', 'confirmation'],
  scam: ['fraud', 'safety', 'otp', 'pin', 'password', 'scam', 'imitate'],
  fraud: ['fraud', 'safety', 'otp', 'pin', 'password', 'scam', 'imitate'],
  scheme: ['scheme', 'schemes', 'msme', 'udyam', 'startup', 'yashasvini', 'portal', 'grant', 'loan', 'subsidy'],
  schemes: ['scheme', 'schemes', 'msme', 'udyam', 'startup', 'yashasvini', 'portal', 'grant', 'loan', 'subsidy'],
  loan: ['loan', 'credit', 'guarantee', 'grant', 'subsidy', 'repayment', 'lender'],
  udyam: ['udyam', 'msme', 'formalisation', 'registration', 'portal'],
  msme: ['msme', 'udyam', 'ministry', 'yashasvini', 'schemes'],
  startup: ['startup', 'dpiit', 'recognition', 'schemes', 'portal'],
  dataset: ['dataset', '600', 'fictional', 'sample', 'records', 'demonstration'],
  600: ['600', 'dataset', 'fictional', 'sample', 'records'],
  sample: ['sample', 'fictional', 'dataset', '600', 'demonstration'],
  herbiz: ['herbiz', 'truth', 'dataset', 'rules', 'format', 'chatbot'],
  plan: ['plan', 'goals', '30-day', '7-day', 'business'],
  complaint: ['complaint', 'complaints', 'feedback', 'policy', 'refund'],
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsWholeWord(text: string, term: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
  return pattern.test(text);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens);
  for (const token of tokens) {
    const synonyms = SYNONYM_MAP[token];
    if (synonyms) {
      for (const s of synonyms) {
        expanded.add(s);
      }
    }
    if (token.endsWith('s') && token.length > 4) {
      expanded.add(token.slice(0, -1));
    }
  }
  return Array.from(expanded);
}

function isExampleQuestionsSection(chunk: KnowledgeChunk): boolean {
  return /^(\d+\.\s*)?example questions/i.test(chunk.sectionTitle.trim());
}

function scoreChunk(
  chunk: KnowledgeChunk,
  rawQueryLower: string,
  baseTokens: string[],
  expandedTokens: string[]
): { score: number; matchedTerms: string[] } {
  // Skip meta "Example questions" bullet lists so actual guidance sections are retrieved
  if (isExampleQuestionsSection(chunk)) {
    return { score: 0, matchedTerms: [] };
  }

  const titleLower = `${chunk.area} ${chunk.sectionTitle}`.toLowerCase();
  const bodyLower = chunk.content.toLowerCase();

  let score = 0;
  const matchedTerms = new Set<string>();

  if (rawQueryLower.length >= 8) {
    if (titleLower.includes(rawQueryLower)) score += 12;
    if (bodyLower.includes(rawQueryLower)) score += 6;
  }

  // Whole-word matching on the user's actual query tokens
  for (const token of baseTokens) {
    let matched = false;
    if (containsWholeWord(titleLower, token)) {
      score += 5.0;
      matched = true;
    }
    if (containsWholeWord(bodyLower, token)) {
      score += 2.2;
      matched = true;
    }
    if (matched) matchedTerms.add(token);
  }

  // Whole-word matching on expanded domain synonyms (lower weight, capped)
  let synonymHits = 0;
  for (const token of expandedTokens) {
    if (baseTokens.includes(token)) continue;
    if (synonymHits >= 4) break;
    if (containsWholeWord(titleLower, token)) {
      score += 2.0;
      synonymHits++;
      matchedTerms.add(token);
    } else if (containsWholeWord(bodyLower, token)) {
      score += 0.9;
      synonymHits++;
      matchedTerms.add(token);
    }
  }

  // Boost truth/dataset sections when user asks about HERBIZ dataset, 600 records, persistence, or sample data
  if (
    /\b(600|dataset|fictional|sample|permanent|saved|herbiz)\b/i.test(rawQueryLower) &&
    (chunk.sectionTitle.toLowerCase().includes('truth rules') ||
      chunk.sectionTitle.toLowerCase().includes('dataset') ||
      chunk.sectionTitle.toLowerCase().includes('honesty rules'))
  ) {
    score += 8;
  }

  return { score, matchedTerms: Array.from(matchedTerms) };
}

/**
 * Searches all six HERBIZ knowledge documents at section granularity using
 * whole-word matching on the user's question before calling Gemini.
 */
export function retrieveRelevantKnowledge(
  userQuery: string,
  userProfile?: BusinessAssessment | null,
  previousUserTurn?: string,
  maxChunks = 4
): RetrievalResult {
  const { chunks } = getHerbizKnowledgeLibrary();

  const queryText = userQuery.trim();
  const isGreeting =
    /^(hi|hello|hey|namaste|good morning|good afternoon|good evening|thanks|thank you)[!.\s]*$/i.test(
      queryText
    );

  const rawQueryTokens = tokenize(queryText);

  // Only include previousUserTurn if current message is a short follow-up (<= 4 content tokens)
  const effectiveQueryText =
    rawQueryTokens.length <= 4 && previousUserTurn
      ? `${queryText} ${previousUserTurn}`
      : queryText;

  const baseTokens = tokenize(effectiveQueryText);
  const expandedTokens = expandTokens(baseTokens);
  const rawQueryLower = queryText.toLowerCase();

  // Score strictly against the user's question (never let profile fields fake relevance)
  const scored: ScoredKnowledgeChunk[] = chunks.map((chunk) => {
    const { score, matchedTerms } = scoreChunk(chunk, rawQueryLower, baseTokens, expandedTokens);
    return { chunk, score, matchedTerms };
  });

  scored.sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score ?? 0;

  // Require at least 3.5 score (e.g., >= 2 body hits or a title hit) to consider knowledge sufficient
  const MIN_RELEVANCE_SCORE = 3.5;
  const relevantScored = scored.filter((item) => item.score >= MIN_RELEVANCE_SCORE);
  const insufficientKnowledge = !isGreeting && relevantScored.length === 0;

  const selectedScored = relevantScored.slice(0, maxChunks);
  const selectedChunks = selectedScored.map((item) => item.chunk);

  // Deduplicate source notes
  const seenNoteKeys = new Set<string>();
  const sourceNotes: ChatSourceNote[] = [];
  for (const ch of selectedChunks) {
    const cleanSection = ch.sectionTitle.replace(/^\d+\.\s*/, '');
    const key = `${ch.area}::${cleanSection}`;
    if (!seenNoteKeys.has(key)) {
      seenNoteKeys.add(key);
      sourceNotes.push({ area: ch.area, section: cleanSection });
    }
  }

  // Match verified official resources only when India support/schemes/registration/training are relevant
  const resourceQueryLower = effectiveQueryText.toLowerCase();
  const matchedResources: VerifiedResource[] = [];
  const wantsIndiaSupport =
    selectedChunks.some((c) => c.docId === '05_india_resources') ||
    /\b(scheme|schemes|government|gov|udyam|msme|startup|mudra|standup|stand-up|loan|subsidy|grant|registration|mentor|training|skill|gem|ondc|wep|sidbi|jansamarth|yashasvini)\b/i.test(
      resourceQueryLower
    );

  if (!insufficientKnowledge && wantsIndiaSupport) {
    for (const res of VERIFIED_RESOURCES) {
      const hay = `${res.title} ${res.organization} ${res.categoryLabel} ${res.description}`.toLowerCase();
      let resScore = 0;
      for (const t of expandedTokens) {
        if (t.length >= 3 && containsWholeWord(hay, t)) resScore += 1;
      }
      if (resScore > 0 || res.id === 'msme-ministry' || res.id === 'startup-india') {
        matchedResources.push(res);
      }
    }
  }

  // Note: userProfile is still passed separately to Gemini prompt context, never used to inflate retrieval scores
  void userProfile;

  return {
    chunks: selectedChunks,
    scoredChunks: selectedScored,
    sourceNotes,
    resources: matchedResources.slice(0, 5),
    insufficientKnowledge,
    isGreeting,
    topScore,
  };
}
