import { useState, useRef, type FormEvent } from 'react';
import { ShieldAlert, CheckCircle2, Sparkles, Calculator, Clock } from 'lucide-react';
import type { BusinessAssessment, PageId, RecommendationResult } from '../types/herbiz';
import { FICTIONAL_SAMPLE_PROFILE } from '../data/sampleDemoProfile';
import ProfileAnalysisCard from '../components/ProfileAnalysisCard';
import { fetchJson } from '../utils/apiClient';

interface AssessmentPageProps {
  currentAssessment: BusinessAssessment | null;
  onSubmitAssessment: (
    assessment: BusinessAssessment,
    recommendation: RecommendationResult
  ) => void;
  onResetAssessment: () => void;
  onNavigate: (page: PageId) => void;
}

const CATEGORIES = [
  'Food & Home Kitchen',
  'Tailoring & Apparel',
  'Handicrafts & Artisan Goods',
  'Beauty & Wellness',
  'Retail & Kirana',
  'Tutoring & Local Services',
  'Other Micro / Small Business',
];

const STAGES = [
  'Idea / Planning',
  'Early Stage (0–1 year)',
  'Growing (1–3 years)',
  'Established (3+ years)',
];

const CHALLENGES = [
  'Low Sales & Customer Reach',
  'Pricing & Profit Margins',
  'Record Keeping & Cash Flow',
  'Digital Adoption & Online Selling',
  'Operational Capacity & Time',
  'Understanding Support Resources',
];

const DIGITAL_TOOL_OPTIONS = [
  'WhatsApp Business',
  'UPI / QR Payments',
  'Instagram / Facebook',
  'Spreadsheet / Digital Ledger',
  'Online Marketplace / Catalogue',
  'None Yet',
];

type FieldErrorKey =
  | 'businessName'
  | 'cityState'
  | 'businessCategory'
  | 'businessStage'
  | 'monthlySales'
  | 'monthlyExpenses'
  | 'employeesCount'
  | 'mainChallenge'
  | 'businessGoal'
  | 'consentAccepted';

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseOptionalCurrencyInput(raw: string): { value: number | null; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { value: null, error: null };
  }
  const normalized = trimmed.replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return {
      value: null,
      error: 'Enter digits only (0 or higher), for example 35000. Do not include text, minus signs, or currency symbols.',
    };
  }
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0) {
    return { value: null, error: 'Please enter a valid non-negative number (0 or higher).' };
  }
  if (num > 100_000_000) {
    return { value: null, error: 'Please enter a realistic monthly figure below ₹10,00,00,000.' };
  }
  return { value: num, error: null };
}

function parseWholeEmployeeCount(raw: string): { value: number | null; error: string | null } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return {
      value: null,
      error: 'Number of employees is required (enter 1 if you work solo, or 0 if not yet operating).',
    };
  }
  if (!/^\d+$/.test(trimmed)) {
    return {
      value: null,
      error: 'Enter a whole non-negative number (e.g., 0, 1, or 3) without decimals or text.',
    };
  }
  const num = Number(trimmed);
  if (!Number.isSafeInteger(num) || num < 0 || num > 10000) {
    return { value: null, error: 'Please enter a valid whole number between 0 and 10,000.' };
  }
  return { value: num, error: null };
}

export default function AssessmentPage({
  currentAssessment,
  onSubmitAssessment,
  onResetAssessment,
  onNavigate,
}: AssessmentPageProps) {
  const initialSource =
    currentAssessment && !currentAssessment.isDemoSample ? currentAssessment : null;

  const [businessName, setBusinessName] = useState(initialSource?.businessName ?? '');
  const [businessCategory, setBusinessCategory] = useState(initialSource?.businessCategory ?? '');
  const [businessStage, setBusinessStage] = useState(initialSource?.businessStage ?? '');
  const [cityState, setCityState] = useState(initialSource?.cityState ?? '');
  const [monthlySales, setMonthlySales] = useState(
    initialSource && initialSource.monthlySales !== null ? String(initialSource.monthlySales) : ''
  );
  const [monthlyExpenses, setMonthlyExpenses] = useState(
    initialSource && initialSource.monthlyExpenses !== null
      ? String(initialSource.monthlyExpenses)
      : ''
  );
  const [sameMonthPeriodConfirmed, setSameMonthPeriodConfirmed] = useState(
    initialSource?.sameMonthPeriodConfirmed ?? true
  );
  const [employeesCount, setEmployeesCount] = useState(
    initialSource ? String(initialSource.employeesCount) : ''
  );
  const [mainChallenge, setMainChallenge] = useState(initialSource?.mainChallenge ?? '');
  const [digitalToolsUsed, setDigitalToolsUsed] = useState<string[]>(
    initialSource?.digitalToolsUsed ?? []
  );
  const [businessGoal, setBusinessGoal] = useState(initialSource?.businessGoal ?? '');
  const [consentAccepted, setConsentAccepted] = useState(Boolean(initialSource));

  const [isLoadedDemo, setIsLoadedDemo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [submittedSummary, setSubmittedSummary] = useState<{
    assessment: BusinessAssessment;
    recommendation: RecommendationResult;
  } | null>(null);

  const summaryRef = useRef<HTMLDivElement | null>(null);

  const clearFieldError = (key: FieldErrorKey) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleTool = (tool: string) => {
    if (tool === 'None Yet') {
      setDigitalToolsUsed((prev) => (prev.includes('None Yet') ? [] : ['None Yet']));
      return;
    }
    setDigitalToolsUsed((prev) => {
      const withoutNone = prev.filter((item) => item !== 'None Yet');
      return withoutNone.includes(tool)
        ? withoutNone.filter((item) => item !== tool)
        : [...withoutNone, tool];
    });
  };

  const handleLoadFictionalSample = () => {
    setBusinessName(FICTIONAL_SAMPLE_PROFILE.businessName ?? '');
    setBusinessCategory(FICTIONAL_SAMPLE_PROFILE.businessCategory);
    setBusinessStage(FICTIONAL_SAMPLE_PROFILE.businessStage);
    setCityState(FICTIONAL_SAMPLE_PROFILE.cityState ?? '');
    setMonthlySales(
      FICTIONAL_SAMPLE_PROFILE.monthlySales !== null
        ? String(FICTIONAL_SAMPLE_PROFILE.monthlySales)
        : ''
    );
    setMonthlyExpenses(
      FICTIONAL_SAMPLE_PROFILE.monthlyExpenses !== null
        ? String(FICTIONAL_SAMPLE_PROFILE.monthlyExpenses)
        : ''
    );
    setSameMonthPeriodConfirmed(FICTIONAL_SAMPLE_PROFILE.sameMonthPeriodConfirmed);
    setEmployeesCount(String(FICTIONAL_SAMPLE_PROFILE.employeesCount));
    setMainChallenge(FICTIONAL_SAMPLE_PROFILE.mainChallenge);
    setDigitalToolsUsed(FICTIONAL_SAMPLE_PROFILE.digitalToolsUsed);
    setBusinessGoal(FICTIONAL_SAMPLE_PROFILE.businessGoal);
    setConsentAccepted(true);
    setIsLoadedDemo(true);
    setErrorMsg(null);
    setFieldErrors({});
  };

  const handleClearForm = () => {
    setBusinessName('');
    setBusinessCategory('');
    setBusinessStage('');
    setCityState('');
    setMonthlySales('');
    setMonthlyExpenses('');
    setSameMonthPeriodConfirmed(true);
    setEmployeesCount('');
    setMainChallenge('');
    setDigitalToolsUsed([]);
    setBusinessGoal('');
    setConsentAccepted(false);
    setIsLoadedDemo(false);
    setErrorMsg(null);
    setFieldErrors({});
    setSubmittedSummary(null);
    onResetAssessment();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const nextErrors: Partial<Record<FieldErrorKey, string>> = {};
    const sensitivePattern =
      /\b(otp|one[- ]time[- ]password|atm pin|upi pin|cvv|password|mpin|aadhaar|bank account)\b/i;

    if (sensitivePattern.test(businessName)) {
      nextErrors.businessName =
        'Do not enter passwords, OTPs, PINs, or banking credentials in Business Name.';
    }
    if (sensitivePattern.test(cityState)) {
      nextErrors.cityState =
        'Do not enter passwords, OTPs, PINs, or private credentials in City / State.';
    }
    if (sensitivePattern.test(businessGoal)) {
      nextErrors.businessGoal =
        'Please remove any passwords, OTPs, PINs, or bank details from your Business Goal.';
    }

    if (!businessCategory) {
      nextErrors.businessCategory = 'Please select a business category.';
    }
    if (!businessStage) {
      nextErrors.businessStage = 'Please select your current business stage.';
    }

    const salesCheck = parseOptionalCurrencyInput(monthlySales);
    if (salesCheck.error) {
      nextErrors.monthlySales = salesCheck.error;
    }

    const expensesCheck = parseOptionalCurrencyInput(monthlyExpenses);
    if (expensesCheck.error) {
      nextErrors.monthlyExpenses = expensesCheck.error;
    }

    const employeesCheck = parseWholeEmployeeCount(employeesCount);
    if (employeesCheck.error) {
      nextErrors.employeesCount = employeesCheck.error;
    }

    if (!mainChallenge) {
      nextErrors.mainChallenge = 'Please select your main business challenge.';
    }

    if (businessGoal.trim().length < 10) {
      nextErrors.businessGoal =
        nextErrors.businessGoal ??
        'Please describe your business goal in a clear sentence (at least 10 characters).';
    }

    if (!consentAccepted) {
      nextErrors.consentAccepted =
        'Please confirm the privacy & consent acknowledgement before submitting.';
    }

    if (Object.keys(nextErrors).length > 0 || employeesCheck.value === null) {
      setFieldErrors(nextErrors);
      setErrorMsg('Please review the highlighted fields below before submitting.');
      return;
    }

    const hasBothSameMonth =
      salesCheck.value !== null && expensesCheck.value !== null && sameMonthPeriodConfirmed;

    const payload: BusinessAssessment = {
      businessName: businessName.trim(),
      businessCategory,
      businessStage,
      cityState: cityState.trim(),
      monthlySales: salesCheck.value,
      monthlyExpenses: expensesCheck.value,
      sameMonthPeriodConfirmed: hasBothSameMonth,
      employeesCount: employeesCheck.value,
      mainChallenge,
      digitalToolsUsed,
      businessGoal: businessGoal.trim(),
      submittedAt: new Date().toISOString(),
      isDemoSample: isLoadedDemo,
    };

    setLoading(true);
    try {
      const data = await fetchJson<{ recommendation: RecommendationResult }>('/api/recommendations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      onSubmitAssessment(payload, data.recommendation);
      setSubmittedSummary({
        assessment: payload,
        recommendation: data.recommendation,
      });
      setFieldErrors({});
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong while submitting the assessment.'
      );
    } finally {
      setLoading(false);
    }
  };

  const activeSummaryAssessment = submittedSummary?.assessment ?? initialSource;
  const activeSummaryProfit =
    activeSummaryAssessment &&
    activeSummaryAssessment.monthlySales !== null &&
    activeSummaryAssessment.monthlyExpenses !== null &&
    activeSummaryAssessment.sameMonthPeriodConfirmed
      ? activeSummaryAssessment.monthlySales - activeSummaryAssessment.monthlyExpenses
      : null;

  const bothFiguresTyped = monthlySales.trim() !== '' && monthlyExpenses.trim() !== '';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-purple-800">Step 01 · Business Snapshot</p>
          <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-purple-950">
            Business Assessment
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Enter basic business details you are comfortable sharing to review a session summary,
            tailored recommendations, and guided AI support.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={handleLoadFictionalSample}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/70 px-3.5 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-100 whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Try Fictional Sample</span>
          </button>
          <button
            type="button"
            onClick={handleClearForm}
            className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Reset Form
          </button>
        </div>
      </div>

      {/* Consent & Privacy Notice */}
      <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-purple-800" />
          <div className="text-sm leading-relaxed text-slate-700">
            <p className="font-semibold text-purple-950">Privacy, Consent & Prototype Storage Note</p>
            <ul className="mt-1.5 space-y-1 text-xs sm:text-sm">
              <li>
                • <strong>Share only what you are comfortable sharing:</strong> Optional fields
                (Business Name, City/State, Monthly Sales, Monthly Expenses) can be left blank.
              </li>
              <li>
                • <strong>Never enter sensitive credentials:</strong> Do not enter passwords, OTPs,
                ATM/UPI PINs, CVVs, Aadhaar numbers, or bank account credentials anywhere on this
                site.
              </li>
              <li>
                • <strong>Session-only storage:</strong> Because no database is connected to this
                student prototype, your submitted assessment is stored only in your current browser
                session and is not permanently saved. Refreshing or closing the tab clears it.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {isLoadedDemo && (
        <div className="mt-4 rounded-xl border border-pink-200 bg-pink-50 p-4 text-sm text-purple-950">
          <strong>Demonstration Sample Loaded:</strong> Pre-filled with the fictional sample
          business (<em>Asha Home Kitchen & Snacks</em>) so you can test the flow. Replace these
          values with your own details anytime.
        </div>
      )}

      {/* Clear Submission Summary Card */}
      {activeSummaryAssessment && (
        <section
          ref={summaryRef}
          aria-label="Submitted Business Assessment Summary"
          className="mt-6 rounded-xl border border-emerald-200 bg-white p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-purple-100 pb-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <h2 className="font-display text-lg font-bold text-purple-950">
                  {activeSummaryAssessment.isDemoSample
                    ? 'Submitted Summary (Fictional Sample)'
                    : 'Submitted Business Assessment Summary'}
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-purple-700" />
                  <span>
                    Stored only for this active browser session — not permanently saved to a
                    database.
                  </span>
                </p>
              </div>
            </div>
            <span className="rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-900">
              {activeSummaryAssessment.isDemoSample ? 'Demonstration Sample' : 'Current Session'}
            </span>
          </div>

          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-slate-500">Business Name</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {activeSummaryAssessment.businessName || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">City / State</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {activeSummaryAssessment.cityState || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Category & Stage</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {activeSummaryAssessment.businessCategory} · {activeSummaryAssessment.businessStage}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Number of Employees</dt>
              <dd className="font-mono-num mt-0.5 font-medium text-slate-900">
                {activeSummaryAssessment.employeesCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Main Challenge</dt>
              <dd className="mt-0.5 font-medium text-purple-950">
                {activeSummaryAssessment.mainChallenge}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Digital Tools Used</dt>
              <dd className="mt-0.5 font-medium text-slate-900">
                {activeSummaryAssessment.digitalToolsUsed.length > 0
                  ? activeSummaryAssessment.digitalToolsUsed.join(', ')
                  : 'None selected'}
              </dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-xs font-medium text-slate-500">Business Goal (1–3 Months)</dt>
              <dd className="mt-0.5 text-slate-800">{activeSummaryAssessment.businessGoal}</dd>
            </div>
          </dl>

          {/* Financial & Conditional Simplified Profit Estimate */}
          <div className="mt-5 grid gap-4 rounded-xl border border-purple-100 bg-purple-50/50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-slate-600">Monthly Sales (INR)</p>
              <p className="font-mono-num mt-1 text-lg font-semibold text-purple-950">
                {activeSummaryAssessment.monthlySales !== null
                  ? formatINR(activeSummaryAssessment.monthlySales)
                  : 'Not provided'}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600">Monthly Expenses (INR)</p>
              <p className="font-mono-num mt-1 text-lg font-semibold text-slate-900">
                {activeSummaryAssessment.monthlyExpenses !== null
                  ? formatINR(activeSummaryAssessment.monthlyExpenses)
                  : 'Not provided'}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-purple-800" />
                <p className="text-xs font-semibold text-purple-950">
                  Simplified Estimated Profit (Estimate Only)
                </p>
              </div>
              {activeSummaryProfit !== null ? (
                <>
                  <p
                    className={`font-mono-num mt-1 text-lg font-bold ${
                      activeSummaryProfit >= 0 ? 'text-purple-950' : 'text-red-700'
                    }`}
                  >
                    {formatINR(activeSummaryProfit)}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-600">
                    Estimate only (Sales − Expenses for the same month). Excludes taxes, interest,
                    depreciation, and other adjustments.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-base font-semibold text-slate-700">Not calculated</p>
                  <p className="mt-1 text-[11px] leading-snug text-slate-600">
                    Calculated only when both Monthly Sales and Monthly Expenses for the same month
                    are provided.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('recommendations')}
              className="inline-flex min-h-[40px] items-center rounded-lg bg-purple-800 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-900"
            >
              View Recommendations
            </button>
            <button
              type="button"
              onClick={() => onNavigate('assistant')}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-purple-300 bg-white px-4 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-50"
            >
              Discuss with AI Assistant
            </button>
            <button
              type="button"
              onClick={() => onNavigate('action-plan')}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-50"
            >
              Open Action Plan
            </button>
          </div>

          <div className="mt-5">
            <ProfileAnalysisCard profile={activeSummaryAssessment} />
          </div>
        </section>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errorMsg}
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-6 space-y-6 rounded-xl border border-purple-100 bg-white p-6 sm:p-8"
      >
        <p className="text-xs text-slate-600">
          Fields marked with <span className="font-semibold text-purple-700">*</span> are
          required. All others are optional.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-slate-800">
              Business Name <span className="font-normal text-slate-500">(Optional)</span>
            </label>
            <input
              id="businessName"
              type="text"
              maxLength={120}
              value={businessName}
              onChange={(e) => {
                setBusinessName(e.target.value);
                setIsLoadedDemo(false);
                clearFieldError('businessName');
              }}
              placeholder="e.g., Meera Handloom Studio"
              aria-invalid={Boolean(fieldErrors.businessName)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <p className="mt-1 text-xs text-slate-500">
              Example: Priya Tiffin Service. Leave blank if you prefer not to share a name.
            </p>
            {fieldErrors.businessName && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                {fieldErrors.businessName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="cityState" className="block text-sm font-medium text-slate-800">
              City / State <span className="font-normal text-slate-500">(Optional)</span>
            </label>
            <input
              id="cityState"
              type="text"
              maxLength={100}
              value={cityState}
              onChange={(e) => {
                setCityState(e.target.value);
                setIsLoadedDemo(false);
                clearFieldError('cityState');
              }}
              placeholder="e.g., Pune, Maharashtra"
              aria-invalid={Boolean(fieldErrors.cityState)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <p className="mt-1 text-xs text-slate-500">
              Example: Jaipur, Rajasthan or Coimbatore, Tamil Nadu.
            </p>
            {fieldErrors.cityState && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                {fieldErrors.cityState}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="businessCategory" className="block text-sm font-medium text-slate-800">
              Business Category <span className="text-purple-700">*</span>
            </label>
            <select
              id="businessCategory"
              required
              value={businessCategory}
              onChange={(e) => {
                setBusinessCategory(e.target.value);
                setIsLoadedDemo(false);
                clearFieldError('businessCategory');
              }}
              aria-invalid={Boolean(fieldErrors.businessCategory)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="">Select a business category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Examples: home kitchen, tailoring boutique, pottery, salon, or kirana store.
            </p>
            {fieldErrors.businessCategory && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                {fieldErrors.businessCategory}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="businessStage" className="block text-sm font-medium text-slate-800">
              Business Stage <span className="text-purple-700">*</span>
            </label>
            <select
              id="businessStage"
              required
              value={businessStage}
              onChange={(e) => {
                setBusinessStage(e.target.value);
                setIsLoadedDemo(false);
                clearFieldError('businessStage');
              }}
              aria-invalid={Boolean(fieldErrors.businessStage)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="">Select your current business stage...</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Example: Idea / Planning if pre-launch, or Early Stage if under 1 year.
            </p>
            {fieldErrors.businessStage && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                {fieldErrors.businessStage}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 sm:p-5 space-y-4">
          <div>
            <h2 className="font-display text-sm font-semibold text-purple-950">
              Monthly Snapshot & Team Size
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Monthly Sales and Expenses are optional. If you enter both for the same month, we
              will show a simplified estimated profit on submission.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="monthlySales" className="block text-sm font-medium text-slate-800">
                Monthly Sales (INR){' '}
                <span className="font-normal text-slate-500">(Optional)</span>
              </label>
              <input
                id="monthlySales"
                type="text"
                inputMode="decimal"
                value={monthlySales}
                onChange={(e) => {
                  setMonthlySales(e.target.value);
                  setIsLoadedDemo(false);
                  clearFieldError('monthlySales');
                }}
                placeholder="e.g., 35000"
                aria-invalid={Boolean(fieldErrors.monthlySales)}
                className="font-mono-num mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                Example: 35000 (total revenue earned in one month, or 0 if pre-revenue).
              </p>
              {fieldErrors.monthlySales && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                  {fieldErrors.monthlySales}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="monthlyExpenses" className="block text-sm font-medium text-slate-800">
                Monthly Expenses (INR){' '}
                <span className="font-normal text-slate-500">(Optional)</span>
              </label>
              <input
                id="monthlyExpenses"
                type="text"
                inputMode="decimal"
                value={monthlyExpenses}
                onChange={(e) => {
                  setMonthlyExpenses(e.target.value);
                  setIsLoadedDemo(false);
                  clearFieldError('monthlyExpenses');
                }}
                placeholder="e.g., 24000"
                aria-invalid={Boolean(fieldErrors.monthlyExpenses)}
                className="font-mono-num mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                Example: 24000 (materials, packaging, rent, and transport for that month).
              </p>
              {fieldErrors.monthlyExpenses && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                  {fieldErrors.monthlyExpenses}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="employeesCount" className="block text-sm font-medium text-slate-800">
                Number of Employees <span className="text-purple-700">*</span>
              </label>
              <input
                id="employeesCount"
                type="text"
                inputMode="numeric"
                required
                value={employeesCount}
                onChange={(e) => {
                  setEmployeesCount(e.target.value);
                  setIsLoadedDemo(false);
                  clearFieldError('employeesCount');
                }}
                placeholder="e.g., 1"
                aria-invalid={Boolean(fieldErrors.employeesCount)}
                className="font-mono-num mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <p className="mt-1 text-xs text-slate-500">
                Example: 1 if solo, 0 if planning, or 3 with helpers (whole numbers only).
              </p>
              {fieldErrors.employeesCount && (
                <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                  {fieldErrors.employeesCount}
                </p>
              )}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-purple-200 bg-white p-3 text-xs leading-relaxed text-slate-700">
            <input
              type="checkbox"
              checked={sameMonthPeriodConfirmed}
              onChange={(e) => {
                setSameMonthPeriodConfirmed(e.target.checked);
                setIsLoadedDemo(false);
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-800 focus:ring-purple-700"
            />
            <span>
              <strong className="text-purple-950">
                Both Monthly Sales and Monthly Expenses above refer to the same month (in INR)
              </strong>
              <span className="block text-slate-500">
                {bothFiguresTyped
                  ? sameMonthPeriodConfirmed
                    ? 'A simplified estimated monthly profit (Estimate Only) will be shown on submission.'
                    : 'Unchecked — simplified estimated profit will NOT be calculated since periods differ.'
                  : 'Leave unchecked or leave either amount blank if you do not have both figures for the same month.'}
              </span>
            </span>
          </label>
        </div>

        <div>
          <label htmlFor="mainChallenge" className="block text-sm font-medium text-slate-800">
            Main Business Challenge <span className="text-purple-700">*</span>
          </label>
          <select
            id="mainChallenge"
            required
            value={mainChallenge}
            onChange={(e) => {
              setMainChallenge(e.target.value);
              setIsLoadedDemo(false);
              clearFieldError('mainChallenge');
            }}
            aria-invalid={Boolean(fieldErrors.mainChallenge)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="">Select your #1 current business challenge...</option>
            {CHALLENGES.map((challenge) => (
              <option key={challenge} value={challenge}>
                {challenge}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Example: Choose &ldquo;Pricing & Profit Margins&rdquo; if sales are steady but little cash
            remains.
          </p>
          {fieldErrors.mainChallenge && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-700">
              {fieldErrors.mainChallenge}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-slate-800">
            Digital Tools Currently Used{' '}
            <span className="font-normal text-slate-500">(Optional)</span>
          </legend>
          <p className="mt-0.5 text-xs text-slate-500">
            Example: Select WhatsApp Business and UPI / QR Payments if you already use them, or pick
            &ldquo;None Yet&rdquo;.
          </p>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {DIGITAL_TOOL_OPTIONS.map((tool) => {
              const checked = digitalToolsUsed.includes(tool);
              return (
                <label
                  key={tool}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2 text-sm transition-colors ${
                    checked
                      ? 'border-purple-700 bg-purple-50 text-purple-950 font-medium'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-purple-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTool(tool)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-800 focus:ring-purple-700"
                  />
                  <span>{tool}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="businessGoal" className="block text-sm font-medium text-slate-800">
            Business Goal (Next 1–3 Months) <span className="text-purple-700">*</span>
          </label>
          <textarea
            id="businessGoal"
            rows={3}
            maxLength={500}
            required
            value={businessGoal}
            onChange={(e) => {
              setBusinessGoal(e.target.value);
              setIsLoadedDemo(false);
              clearFieldError('businessGoal');
            }}
            placeholder="e.g., Get 15 repeat local orders per week and track weekly raw material costs clearly."
            aria-invalid={Boolean(fieldErrors.businessGoal)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          <p className="mt-1 text-xs text-slate-500">
            Example: &ldquo;Separate business and household cash and reach 20 orders a week.&rdquo;
            (Minimum 10 characters.)
          </p>
          {fieldErrors.businessGoal && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-700">
              {fieldErrors.businessGoal}
            </p>
          )}
        </div>

        {/* Required Consent Confirmation */}
        <div className="rounded-xl border border-pink-200 bg-pink-50/40 p-4">
          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-slate-800 sm:text-sm">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => {
                setConsentAccepted(e.target.checked);
                clearFieldError('consentAccepted');
              }}
              aria-invalid={Boolean(fieldErrors.consentAccepted)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-purple-800 focus:ring-purple-700"
            />
            <span>
              <strong className="text-purple-950">Consent & Session-Only Confirmation *</strong>
              <span className="block text-xs text-slate-600">
                I am sharing only business details I am comfortable entering, I have NOT included
                passwords, OTPs, PINs, or bank credentials, and I understand this prototype stores my
                profile only for the current session (not permanently saved).
              </span>
            </span>
          </label>
          {fieldErrors.consentAccepted && (
            <p role="alert" className="mt-2 text-xs font-medium text-red-700">
              {fieldErrors.consentAccepted}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-purple-100 pt-5">
          <p className="text-xs text-slate-500">
            Simplified estimated profit = Sales − Expenses for the same month (estimate only; not
            an audited calculation).
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-purple-800 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-900 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {loading ? 'Processing Assessment...' : 'Submit Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
}
