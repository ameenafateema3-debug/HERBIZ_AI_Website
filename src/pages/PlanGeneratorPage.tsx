import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import type {
  BusinessPlanRequest,
  BusinessPlanResponse,
  PageId,
} from '../types/herbiz';
import { fetchJson } from '../utils/apiClient';

interface PlanGeneratorPageProps {
  prefill: Partial<BusinessPlanRequest> | null;
  onAddPlanTasksToTracker: (
    businessTitle: string,
    tasks: Array<{ title: string; focusArea: string; weekOffset: number }>
  ) => void;
  onNavigate: (page: PageId) => void;
}

function formatPlanAsText(plan: BusinessPlanResponse): string {
  const lines: string[] = [
    `${plan.businessTitle}`,
    '='.repeat(Math.min(60, plan.businessTitle.length)),
    '',
    '1. BUSINESS OVERVIEW',
    plan.businessOverview,
    '',
    '2. PRODUCTS OR SERVICES',
    ...plan.productsOrServices.map((item) => `- ${item}`),
    '',
    '3. TARGET CUSTOMERS',
    plan.targetCustomers,
    '',
    '4. ESTIMATED STARTUP COSTS',
    ...plan.estimatedStartupCosts.map((item) => `- ${item}`),
    '',
    '5. MARKETING STRATEGY',
    ...plan.marketingStrategy.map((item) => `- ${item}`),
    '',
    '6. BUSINESS CHALLENGES',
    ...plan.businessChallenges.map((item) => `- ${item}`),
    '',
    '7. EXPECTED MONTHLY EXPENSES',
    ...plan.expectedExpenses.map((item) => `- ${item}`),
    '',
    '8. 30-DAY ACTION PLAN',
    ...plan.thirtyDayActionPlan.flatMap((week) => [
      `${week.weekLabel}: ${week.focus}`,
      ...week.tasks.map((t) => `  - ${t}`),
    ]),
    '',
    `Note: ${plan.guidanceDisclaimer}`,
  ];
  return lines.join('\n');
}

export default function PlanGeneratorPage({
  prefill,
  onAddPlanTasksToTracker,
  onNavigate,
}: PlanGeneratorPageProps) {
  const [businessIdea, setBusinessIdea] = useState(prefill?.businessIdea || '');
  const [budgetRaw, setBudgetRaw] = useState(
    prefill?.budgetInr ? String(prefill.budgetInr) : '30000'
  );
  const [location, setLocation] = useState(prefill?.location || '');
  const [targetCustomers, setTargetCustomers] = useState(prefill?.targetCustomers || '');
  const [productsOrServices, setProductsOrServices] = useState(
    prefill?.productsOrServices || ''
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [plan, setPlan] = useState<BusinessPlanResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [addedToTracker, setAddedToTracker] = useState(false);

  useEffect(() => {
    if (!prefill) return;
    if (prefill.businessIdea) setBusinessIdea(prefill.businessIdea);
    if (prefill.budgetInr) setBudgetRaw(String(prefill.budgetInr));
    if (prefill.targetCustomers) setTargetCustomers(prefill.targetCustomers);
    if (prefill.productsOrServices) setProductsOrServices(prefill.productsOrServices);
    if (prefill.location) setLocation(prefill.location);
  }, [prefill]);

  const generatePlan = async () => {
    setErrorMsg(null);
    const cleanedBudget = budgetRaw.replace(/,/g, '').trim();
    const budgetNum = Number(cleanedBudget);

    if (businessIdea.trim().length < 4) {
      setErrorMsg('Please enter your business idea (at least 4 characters).');
      return;
    }
    if (!cleanedBudget || !Number.isFinite(budgetNum) || budgetNum <= 0) {
      setErrorMsg('Please enter a valid investment budget in INR (greater than 0).');
      return;
    }
    if (location.trim().length < 2) {
      setErrorMsg('Please enter your city or town (e.g., Jaipur, Rajasthan).');
      return;
    }
    if (targetCustomers.trim().length < 3) {
      setErrorMsg('Please describe your target customers.');
      return;
    }
    if (productsOrServices.trim().length < 3) {
      setErrorMsg('Please list your products or services.');
      return;
    }

    setLoading(true);
    setAddedToTracker(false);
    try {
      const data = await fetchJson<{ plan: BusinessPlanResponse }>('/api/business-plan', {
        method: 'POST',
        body: JSON.stringify({
          businessIdea: businessIdea.trim(),
          budgetInr: budgetNum,
          location: location.trim(),
          targetCustomers: targetCustomers.trim(),
          productsOrServices: productsOrServices.trim(),
        }),
      });
      setPlan(data.plan);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to generate your business plan right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void generatePlan();
  };

  const handleCopyPlan = async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(formatPlanAsText(plan));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErrorMsg('Clipboard copy was blocked by your browser. You can select and copy the text directly.');
    }
  };

  const handleSaveTasks = () => {
    if (!plan || addedToTracker) return;
    const tasksToAdd = plan.thirtyDayActionPlan.flatMap((week, idx) =>
      week.tasks.slice(0, 2).map((task) => ({
        title: `${week.weekLabel}: ${task}`,
        focusArea: week.focus || '30-Day Launch Plan',
        weekOffset: idx + 1,
      }))
    );
    onAddPlanTasksToTracker(plan.businessTitle, tasksToAdd);
    setAddedToTracker(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-medium text-purple-800">Structured 8-Section Planning</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-purple-950">
            AI Business Plan Generator
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Enter your business idea, budget, location, customers, and products/services to create
            a clear 8-section plan with a practical 30-day roadmap.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setBusinessIdea('Home-based millet snacks and festive gift boxes');
            setBudgetRaw('30000');
            setLocation('Pune, Maharashtra');
            setTargetCustomers('Health-conscious families and office teams nearby');
            setProductsOrServices('Roasted millet snacks, ragi laddoos, and custom festive hampers');
          }}
          className="inline-flex min-h-[40px] items-center rounded-lg border border-purple-200 bg-purple-50/60 px-3.5 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-100 whitespace-nowrap shrink-0 self-start"
        >
          Fill Sample Example
        </button>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-7 rounded-xl border border-purple-100 bg-white p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="planIdea" className="block text-sm font-medium text-slate-800">
              Business Idea <span className="text-purple-700">*</span>
            </label>
            <input
              id="planIdea"
              type="text"
              value={businessIdea}
              onChange={(e) => setBusinessIdea(e.target.value)}
              placeholder="e.g., Home-based custom tailoring and blouse stitching studio"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div>
            <label htmlFor="planBudget" className="block text-sm font-medium text-slate-800">
              Investment Budget (INR ₹) <span className="text-purple-700">*</span>
            </label>
            <input
              id="planBudget"
              type="text"
              inputMode="numeric"
              value={budgetRaw}
              onChange={(e) => setBudgetRaw(e.target.value)}
              placeholder="e.g., 30000"
              className="font-mono-num mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div>
            <label htmlFor="planLocation" className="block text-sm font-medium text-slate-800">
              Location (City / Town &amp; State) <span className="text-purple-700">*</span>
            </label>
            <input
              id="planLocation"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Bengaluru, Karnataka"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div>
            <label htmlFor="planCustomers" className="block text-sm font-medium text-slate-800">
              Target Customers <span className="text-purple-700">*</span>
            </label>
            <input
              id="planCustomers"
              type="text"
              value={targetCustomers}
              onChange={(e) => setTargetCustomers(e.target.value)}
              placeholder="e.g., Working women and college students in nearby apartments"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div>
            <label htmlFor="planProducts" className="block text-sm font-medium text-slate-800">
              Products or Services <span className="text-purple-700">*</span>
            </label>
            <input
              id="planProducts"
              type="text"
              value={productsOrServices}
              onChange={(e) => setProductsOrServices(e.target.value)}
              placeholder="e.g., Designer blouses, alteration packages, festive kurtis"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-800"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => void generatePlan()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-purple-100 pt-5">
          <p className="text-xs text-slate-500">
            Generates all 8 planning sections grounded in HERBIZ knowledge. Cost figures are
            estimates only.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-900 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Building Business Plan...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Generate Business Plan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Generated 8-Section Business Plan */}
      {plan && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-purple-200 bg-purple-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-purple-800">Generated Business Plan</p>
              <h2 className="font-display mt-1 text-2xl font-bold text-purple-950">
                {plan.businessTitle}
              </h2>
              <p className="mt-1 text-xs text-slate-600">{plan.guidanceDisclaimer}</p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => void handleCopyPlan()}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-purple-800 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-900 whitespace-nowrap"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied Business Plan' : 'Copy Business Plan'}</span>
              </button>

              <button
                type="button"
                disabled={addedToTracker}
                onClick={handleSaveTasks}
                className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold whitespace-nowrap ${
                  addedToTracker
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-purple-200 bg-white text-purple-900 hover:bg-purple-50'
                }`}
              >
                {addedToTracker ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>30-Day Steps Saved</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    <span>Save 30-Day Tasks to Tracker</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {addedToTracker && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs sm:text-sm text-emerald-900">
              <span>Your 30-day goal and starter tasks were added to Business Progress Tracker.</span>
              <button
                type="button"
                onClick={() => onNavigate('action-plan')}
                className="font-semibold underline whitespace-nowrap ml-3"
              >
                Open Tracker
              </button>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-xl border border-purple-100 bg-white p-6 md:col-span-2">
              <h3 className="font-display text-base font-bold text-purple-950">
                1. Business Overview
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {plan.businessOverview}
              </p>
            </section>

            <section className="rounded-xl border border-purple-100 bg-white p-6">
              <h3 className="font-display text-base font-bold text-purple-950">
                2. Products or Services
              </h3>
              <ul className="mt-2.5 space-y-1.5 text-sm text-slate-700">
                {plan.productsOrServices.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-purple-100 bg-white p-6">
              <h3 className="font-display text-base font-bold text-purple-950">
                3. Target Customers
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-700">
                {plan.targetCustomers}
              </p>
            </section>

            <section className="rounded-xl border border-purple-100 bg-white p-6">
              <h3 className="font-display text-base font-bold text-purple-950">
                4. Estimated Startup Costs
              </h3>
              <ul className="mt-2.5 space-y-1.5 text-sm text-slate-700">
                {plan.estimatedStartupCosts.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-purple-100 bg-white p-6">
              <h3 className="font-display text-base font-bold text-purple-950">
                5. Marketing Strategy
              </h3>
              <ul className="mt-2.5 space-y-1.5 text-sm text-slate-700">
                {plan.marketingStrategy.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-purple-100 bg-white p-6">
              <h3 className="font-display text-base font-bold text-purple-950">
                6. Business Challenges
              </h3>
              <ul className="mt-2.5 space-y-1.5 text-sm text-slate-700">
                {plan.businessChallenges.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-purple-100 bg-white p-6">
              <h3 className="font-display text-base font-bold text-purple-950">
                7. Expected Monthly Expenses
              </h3>
              <ul className="mt-2.5 space-y-1.5 text-sm text-slate-700">
                {plan.expectedExpenses.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-purple-200 bg-purple-50/40 p-6 md:col-span-2">
              <h3 className="font-display text-base font-bold text-purple-950">
                8. 30-Day Action Plan
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {plan.thirtyDayActionPlan.map((week) => (
                  <div
                    key={week.weekLabel}
                    className="rounded-lg border border-purple-100 bg-white p-4"
                  >
                    <p className="text-xs font-semibold text-purple-800">{week.weekLabel}</p>
                    <p className="mt-0.5 text-sm font-semibold text-purple-950">{week.focus}</p>
                    <ul className="mt-2 space-y-1 text-xs sm:text-sm text-slate-700">
                      {week.tasks.map((task) => (
                        <li key={task}>• {task}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {plan.sourceNotes.length > 0 && (
            <p className="text-xs text-slate-500">
              HERBIZ knowledge areas used:{' '}
              {Array.from(new Set(plan.sourceNotes.map((n) => n.area))).join(' · ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
