import { useEffect, useState } from 'react';
import { Sparkles, AlertCircle, ShieldCheck, ExternalLink, Calculator } from 'lucide-react';
import type {
  BusinessAssessment,
  ProfileAnalysisRequest,
  ProfileAnalysisResponse,
} from '../types/herbiz';
import { ApiRequestError, fetchJson } from '../utils/apiClient';

interface ProfileAnalysisCardProps {
  profile: BusinessAssessment | null;
  onNavigateToAssessment?: () => void;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getMissingRequiredFields(profile: BusinessAssessment | null): string[] {
  if (!profile) {
    return [
      'Business Category',
      'Business Stage',
      'Monthly Sales (INR)',
      'Monthly Expenses (INR)',
      'Same-Month Period Confirmation',
      'Main Business Challenge',
      'Business Goal',
    ];
  }
  const missing: string[] = [];
  if (!profile.businessCategory?.trim()) missing.push('Business Category');
  if (!profile.businessStage?.trim()) missing.push('Business Stage');
  if (profile.monthlySales === null || !Number.isFinite(profile.monthlySales) || profile.monthlySales < 0) {
    missing.push('Monthly Sales (INR)');
  }
  if (
    profile.monthlyExpenses === null ||
    !Number.isFinite(profile.monthlyExpenses) ||
    profile.monthlyExpenses < 0
  ) {
    missing.push('Monthly Expenses (INR)');
  }
  if (
    profile.monthlySales !== null &&
    profile.monthlyExpenses !== null &&
    !profile.sameMonthPeriodConfirmed
  ) {
    missing.push('Same-Month Period Confirmation');
  }
  if (!profile.mainChallenge?.trim()) missing.push('Main Business Challenge');
  if (!profile.businessGoal?.trim() || profile.businessGoal.trim().length < 5) {
    missing.push('Business Goal');
  }
  return missing;
}

export default function ProfileAnalysisCard({
  profile,
  onNavigateToAssessment,
}: ProfileAnalysisCardProps) {
  const [loading, setLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ProfileAnalysisResponse | null>(null);

  const profileSignature = profile
    ? `${profile.businessCategory}|${profile.businessStage}|${profile.monthlySales}|${profile.monthlyExpenses}|${profile.sameMonthPeriodConfirmed}|${profile.mainChallenge}|${profile.businessGoal}`
    : 'none';

  useEffect(() => {
    setResult(null);
    setErrorMsg(null);
    setMissingFields([]);
  }, [profileSignature]);

  const handleAnalyzeClick = async () => {
    if (loading) return;
    setErrorMsg(null);

    const missing = getMissingRequiredFields(profile);
    if (missing.length > 0 || !profile) {
      setMissingFields(missing);
      setResult(null);
      return;
    }

    setMissingFields([]);
    setLoading(true);

    // Send ONLY the 6 relevant business fields + same-month flag (no name, city, contacts, or personal info)
    const minimalPayload: ProfileAnalysisRequest = {
      businessCategory: profile.businessCategory,
      businessStage: profile.businessStage,
      monthlySales: profile.monthlySales,
      monthlyExpenses: profile.monthlyExpenses,
      sameMonthPeriodConfirmed: profile.sameMonthPeriodConfirmed,
      selectedChallenge: profile.mainChallenge,
      businessGoal: profile.businessGoal,
    };

    try {
      const data = await fetchJson<ProfileAnalysisResponse>('/api/analyze-profile', {
        method: 'POST',
        body: JSON.stringify(minimalPayload),
      });
      setResult(data);
    } catch (err: unknown) {
      setResult(null);
      if (err instanceof ApiRequestError && err.missingFields && err.missingFields.length > 0) {
        setMissingFields(err.missingFields);
      }
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Gemini business profile analysis is currently unavailable.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-purple-950">
            Controlled AI Profile Analysis (Guidance Only)
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            Runs only when you click below. Sends only Category, Stage, Same-Month Sales & Expenses,
            Challenge, and Goal — never names, locations, or personal details.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleAnalyzeClick()}
          disabled={loading}
          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-purple-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-900 disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{loading ? 'Analyzing Profile...' : 'Analyze my business profile'}</span>
        </button>
      </div>

      {missingFields.length > 0 && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-950"
        >
          <p className="font-semibold">
            Please complete the required values before analyzing your business profile:
          </p>
          <p className="mt-1">Missing: {missingFields.join(', ')}.</p>
          {onNavigateToAssessment && (
            <button
              type="button"
              onClick={onNavigateToAssessment}
              className="mt-2.5 inline-flex items-center rounded-md bg-purple-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-900"
            >
              Complete in Business Assessment
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Profile Analysis Unavailable</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleAnalyzeClick()}
            className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 whitespace-nowrap shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4 rounded-xl border border-purple-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-800" />
              <span className="text-xs font-bold text-purple-950">{result.guidanceLabel}</span>
            </div>
            <span className="rounded-md border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-900">
              Not Financial Advice · Not a Guarantee
            </span>
          </div>

          {/* Simple Estimated Profit Summary */}
          <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-950">
              <Calculator className="h-3.5 w-3.5 text-purple-800" />
              <span>Simple Estimated Monthly Profit (Estimate Only)</span>
            </div>
            <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
              <div>
                <span className="text-slate-500">Same-Month Sales: </span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {formatINR(result.monthlySales)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Same-Month Expenses: </span>
                <span className="font-mono-num font-semibold text-slate-900">
                  {formatINR(result.monthlyExpenses)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Simple Estimated Profit: </span>
                <span
                  className={`font-mono-num font-bold ${
                    result.simpleEstimatedProfit >= 0 ? 'text-purple-950' : 'text-red-700'
                  }`}
                >
                  {formatINR(result.simpleEstimatedProfit)}
                </span>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-slate-600">{result.profitNote}</p>
          </div>

          {/* Gemini Grounded Explanation & Next Steps */}
          <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
            {result.analysis}
          </div>

          {result.referencedResources && result.referencedResources.length > 0 && (
            <div className="border-t border-purple-100 pt-3">
              <p className="text-xs font-semibold text-purple-950">
                Verified Official Portals Referenced
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-3">
                {result.referencedResources.map((res) => (
                  <li key={res.url}>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-purple-800 underline hover:text-purple-950"
                    >
                      <span>{res.title}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.sourceNotes && result.sourceNotes.length > 0 && (
            <p className="border-t border-purple-100 pt-2.5 text-xs text-slate-600">
              <strong className="text-purple-950">Knowledge source: </strong>
              {result.sourceNotes
                .slice(0, 4)
                .map((n) => `${n.area} (${n.section})`)
                .join(' · ')}
            </p>
          )}

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
            <strong>Disclaimer:</strong> {result.guidanceDisclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
