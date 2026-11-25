import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Info,
  PlusCircle,
  MessageSquareText,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import type { PageId, RecommendationPriority, RecommendationResult } from '../types/herbiz';
import { FICTIONAL_SAMPLE_PROFILE } from '../data/sampleDemoProfile';

interface RecommendationsPageProps {
  userRecommendation: RecommendationResult | null;
  onNavigate: (page: PageId) => void;
  onAddNextStepToPlan: (
    taskTitle: string,
    focusArea: string,
    isSample?: boolean,
    priority?: RecommendationPriority
  ) => void;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPriorityStyle(priority: RecommendationPriority): string {
  if (priority === 'High') {
    return 'border-purple-300 bg-purple-100 text-purple-950';
  }
  if (priority === 'Medium') {
    return 'border-pink-200 bg-pink-50 text-purple-900';
  }
  return 'border-slate-200 bg-slate-100 text-slate-800';
}

export default function RecommendationsPage({
  userRecommendation,
  onNavigate,
  onAddNextStepToPlan,
}: RecommendationsPageProps) {
  const [demoRecommendation, setDemoRecommendation] = useState<RecommendationResult | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userRecommendation) return;

    let cancelled = false;
    const fetchDemoRecommendation = async () => {
      setLoadingDemo(true);
      setErrorMsg(null);
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(FICTIONAL_SAMPLE_PROFILE),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Could not load sample recommendations.');
        }
        if (!cancelled) {
          setDemoRecommendation(data.recommendation);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Unable to load recommendations right now.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingDemo(false);
        }
      }
    };

    void fetchDemoRecommendation();
    return () => {
      cancelled = true;
    };
  }, [userRecommendation]);

  const activeRec = userRecommendation ?? demoRecommendation;
  const isSample = !userRecommendation || Boolean(activeRec?.isDemoSample);

  useEffect(() => {
    setAddedIds({});
  }, [activeRec?.businessLabel, activeRec?.selectedChallenge]);

  const handleAddRecommendationStep = (
    recId: string,
    nextStep: string,
    challenge: string,
    priority: RecommendationPriority
  ) => {
    onAddNextStepToPlan(nextStep, challenge, isSample, priority);
    setAddedIds((prev) => ({ ...prev, [recId]: true }));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-purple-800">HERBIZ Knowledge-Grounded Guidance</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-purple-950">
            Business Recommendations
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            Each recommendation lists your selected business challenge, possible reasons, suggested
            actions, priority (High, Medium, or Low), and a measurable next step grounded in the
            HERBIZ knowledge library.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('assessment')}
          className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-lg border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-50 whitespace-nowrap shrink-0"
        >
          <span>{userRecommendation && !isSample ? 'Update Assessment' : 'Enter Your Own Business'}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Explicit Sample vs User-Submitted Banner */}
      {isSample ? (
        <div className="mt-6 rounded-xl border border-pink-200 bg-pink-50/70 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-purple-800" />
            <div className="text-sm leading-relaxed text-slate-800">
              <p className="font-semibold text-purple-950">
                Sample Recommendations — Fictional Example Profile
              </p>
              <p className="mt-1">
                You have not submitted your own Business Assessment yet (or you loaded the sample
                example). The cards below are labeled as <strong>Sample Recommendations</strong>{' '}
                generated from the fictional demonstration profile{' '}
                <strong>Asha Home Kitchen &amp; Snacks</strong>. Submit your own details in Business
                Assessment to see personalized guidance based strictly on your inputs.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-sm text-purple-950">
          <strong>Personalized Recommendations:</strong> Generated using only the profile details you
          submitted for <strong>{activeRec?.businessLabel}</strong> and the HERBIZ knowledge
          library.
        </div>
      )}

      {/* Explicit No-Guarantee Guidance Notice */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-purple-100 bg-white p-4 text-xs leading-relaxed text-slate-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-purple-800" />
        <p>
          <strong className="text-purple-950">Guidance Only — No Revenue or Profit Guarantee:</strong>{' '}
          These suggestions are educational decision-support steps drawn from your submitted details
          and the HERBIZ knowledge library. Actual business results depend on local market
          conditions, execution, and costs—no action is guaranteed to increase sales, revenue, or
          profit.
        </p>
      </div>

      {loadingDemo && !activeRec && (
        <div className="mt-6 rounded-xl border border-purple-100 bg-white p-8 text-sm text-slate-600">
          Loading recommendations...
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errorMsg}
        </div>
      )}

      {activeRec && (
        <div className="mt-6 space-y-6">
          {/* Profile Details Used + Monthly Numbers */}
          <div className="rounded-xl border border-purple-100 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3">
              <p className="text-xs font-semibold text-purple-950">
                {isSample
                  ? 'Sample Profile Details Used'
                  : 'Profile Details Provided by You'}
              </p>
              <span className="rounded-md border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-900">
                {isSample ? 'Sample Data' : 'Session Profile Only'}
              </span>
            </div>

            <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-slate-500">Category &amp; Stage</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {activeRec.profileBasis.businessCategory} · {activeRec.profileBasis.businessStage}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Team Size &amp; Tools</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {activeRec.profileBasis.employeesCount} employee(s) ·{' '}
                  {activeRec.profileBasis.digitalToolsUsed.length > 0
                    ? activeRec.profileBasis.digitalToolsUsed.join(', ')
                    : 'None selected'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">City / State</dt>
                <dd className="mt-0.5 font-medium text-slate-900">
                  {activeRec.profileBasis.cityState ?? 'Not provided'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Monthly Sales / Expenses</dt>
                <dd className="font-mono-num mt-0.5 font-medium text-slate-900">
                  {activeRec.monthlySales !== null ? formatINR(activeRec.monthlySales) : 'Not provided'}{' '}
                  /{' '}
                  {activeRec.monthlyExpenses !== null
                    ? formatINR(activeRec.monthlyExpenses)
                    : 'Not provided'}
                </dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-4 border-t border-purple-100 pt-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Monthly Sales</p>
                <p className="font-mono-num mt-1 text-xl font-semibold text-purple-950">
                  {activeRec.monthlySales !== null ? formatINR(activeRec.monthlySales) : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Monthly Expenses</p>
                <p className="font-mono-num mt-1 text-xl font-semibold text-slate-900">
                  {activeRec.monthlyExpenses !== null
                    ? formatINR(activeRec.monthlyExpenses)
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600">
                  Simplified Estimated Profit (Estimate Only)
                </p>
                {activeRec.estimatedMonthlyProfit !== null ? (
                  <p
                    className={`font-mono-num mt-1 text-xl font-semibold ${
                      activeRec.estimatedMonthlyProfit >= 0 ? 'text-purple-950' : 'text-red-700'
                    }`}
                  >
                    {formatINR(activeRec.estimatedMonthlyProfit)}
                  </p>
                ) : (
                  <p className="mt-1 text-base font-semibold text-slate-700">Not calculated</p>
                )}
                <p className="mt-1 text-[11px] leading-snug text-slate-600">
                  {activeRec.profitCalculationNote}
                </p>
              </div>
            </div>
          </div>

          {/* Recommendation Cards */}
          <div className="space-y-5">
            {activeRec.recommendations.map((rec, index) => {
              const isAdded = Boolean(addedIds[rec.id]);
              return (
                <article
                  key={rec.id}
                  className="rounded-xl border border-purple-200 bg-white p-6"
                >
                  {/* Card Header: Challenge, Sample Label, Priority */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-purple-100 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono-num text-xs font-semibold text-purple-800">
                          Recommendation 0{index + 1}
                        </span>
                        {rec.isSample && (
                          <span className="rounded-md border border-pink-200 bg-pink-50 px-2 py-0.5 text-[11px] font-semibold text-purple-900">
                            Sample Recommendation
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Selected Business Challenge
                      </p>
                      <h2 className="font-display mt-0.5 text-xl font-bold text-purple-950">
                        {rec.selectedChallenge}
                      </h2>
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                      <span
                        className={`rounded-md border px-3 py-1 text-xs font-bold ${getPriorityStyle(
                          rec.priority
                        )}`}
                      >
                        Priority: {rec.priority}
                      </span>
                      <p className="mt-1.5 max-w-xs text-xs leading-snug text-slate-600 sm:text-right">
                        {rec.priorityReason}
                      </p>
                    </div>
                  </div>

                  {/* Possible Reasons & Suggested Actions */}
                  <div className="mt-5 grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="font-display text-sm font-semibold text-purple-950">
                        Possible Reasons
                      </h3>
                      <ul className="mt-2.5 space-y-2 text-sm leading-relaxed text-slate-700">
                        {rec.possibleReasons.map((reason) => (
                          <li key={reason} className="flex gap-2">
                            <span className="text-purple-700" aria-hidden="true">
                              •
                            </span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-display text-sm font-semibold text-purple-950">
                        Suggested Actions
                      </h3>
                      <ol className="mt-2.5 space-y-2.5 text-sm leading-relaxed text-slate-700">
                        {rec.suggestedActions.map((action, actionIdx) => (
                          <li key={action} className="flex gap-2.5">
                            <span className="font-mono-num shrink-0 font-semibold text-purple-800">
                              0{actionIdx + 1}.
                            </span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Measurable Next Step */}
                  <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-purple-800">
                          Measurable Next Step
                        </p>
                        <p className="mt-1 text-sm font-medium leading-relaxed text-purple-950">
                          {rec.measurableNextStep}
                        </p>
                      </div>

                      {!isAdded ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleAddRecommendationStep(
                              rec.id,
                              rec.measurableNextStep,
                              rec.selectedChallenge,
                              rec.priority
                            )
                          }
                          className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-lg bg-purple-800 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-900 whitespace-nowrap shrink-0"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          <span>Add to Action Plan</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigate('action-plan')}
                          className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Added — Open Plan</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* HERBIZ Knowledge Library Sources */}
                  {rec.knowledgeSources && rec.knowledgeSources.length > 0 && (
                    <div className="mt-4 flex items-start gap-2 border-t border-purple-100 pt-3 text-xs text-slate-600">
                      <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-700" />
                      <p>
                        <strong className="text-purple-950">HERBIZ knowledge source: </strong>
                        {rec.knowledgeSources
                          .map((src) => `${src.area} (${src.section})`)
                          .join(' · ')}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Bottom Follow-up Links */}
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-100 bg-purple-50/40 p-5">
            <p className="text-xs leading-relaxed text-slate-600">
              Want to explore one recommendation deeper or verify an official Indian support
              portal?
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onNavigate('assistant')}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-purple-800 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-900"
              >
                <MessageSquareText className="h-4 w-4" />
                <span>Discuss with AI Assistant</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('resources')}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-50"
              >
                <span>View Official Portals</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
