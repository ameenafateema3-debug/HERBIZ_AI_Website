import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Lightbulb,
  Loader2,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import type {
  BusinessIdeaItem,
  BusinessPlanRequest,
  IdeaFinderRequest,
  IdeaFinderResponse,
  PageId,
} from '../types/herbiz';
import { fetchJson } from '../utils/apiClient';

interface IdeaFinderPageProps {
  onUseIdeaForPlan: (prefill: Partial<BusinessPlanRequest>) => void;
  onAddStepToTracker: (taskTitle: string, focusArea: string) => void;
  onNavigate: (page: PageId) => void;
}

const BUSINESS_TYPES = [
  'Food, Tiffin & Homemade Snacks',
  'Tailoring, Boutique & Apparel',
  'Handicrafts, Gifts & Decor',
  'Beauty, Salon & Wellness',
  'Tutoring, Coaching & Childcare',
  'Reselling, Digital & Social Commerce',
  'Neighbourhood Kirana & Retail',
];

const WORK_SETTINGS: Array<IdeaFinderRequest['workSetting']> = [
  'Home-based',
  'Physical shop / studio',
  'Flexible (Home or Physical)',
];

const SKILL_SUGGESTIONS = [
  'Cooking & baking',
  'Stitching & embroidery',
  'Makeup & skincare',
  'Teaching & mentoring',
  'Handmade crafts',
  'Social media & selling',
];

export default function IdeaFinderPage({
  onUseIdeaForPlan,
  onAddStepToTracker,
  onNavigate,
}: IdeaFinderPageProps) {
  const [budgetRaw, setBudgetRaw] = useState('25000');
  const [skillsAndInterests, setSkillsAndInterests] = useState('');
  const [preferredBusinessType, setPreferredBusinessType] = useState(BUSINESS_TYPES[0]);
  const [workSetting, setWorkSetting] =
    useState<IdeaFinderRequest['workSetting']>('Home-based');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<IdeaFinderResponse | null>(null);
  const [savedIdeas, setSavedIdeas] = useState<Record<string, boolean>>({});

  const appendSkillSuggestion = (skill: string) => {
    setSkillsAndInterests((prev) => {
      const current = prev.trim();
      if (!current) return skill;
      if (current.toLowerCase().includes(skill.toLowerCase())) return current;
      return `${current}, ${skill}`;
    });
  };

  const generateIdeas = async () => {
    setErrorMsg(null);
    const cleanedBudget = budgetRaw.replace(/,/g, '').trim();
    const budgetNum = Number(cleanedBudget);

    if (!cleanedBudget || !Number.isFinite(budgetNum) || budgetNum <= 0) {
      setErrorMsg('Please enter a valid startup investment budget in INR (greater than 0).');
      return;
    }
    if (skillsAndInterests.trim().length < 3) {
      setErrorMsg('Please enter at least one skill or interest (e.g., baking, stitching, teaching).');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchJson<IdeaFinderResponse>('/api/idea-finder', {
        method: 'POST',
        body: JSON.stringify({
          budgetInr: budgetNum,
          skillsAndInterests: skillsAndInterests.trim(),
          preferredBusinessType,
          workSetting,
        }),
      });
      setResult(data);
      setSavedIdeas({});
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to generate business ideas right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void generateIdeas();
  };

  const handlePlanFromIdea = (idea: BusinessIdeaItem) => {
    const budgetNum = Number(budgetRaw.replace(/,/g, '').trim()) || 25000;
    onUseIdeaForPlan({
      businessIdea: idea.businessName,
      budgetInr: budgetNum,
      targetCustomers: idea.targetCustomers,
      productsOrServices: idea.shortDescription,
    });
  };

  const handleSaveFirstStep = (idea: BusinessIdeaItem) => {
    const firstStep = idea.firstSteps[0] || `Research first steps for ${idea.businessName}`;
    onAddStepToTracker(`${idea.businessName}: ${firstStep}`, 'Business Launch Prep');
    setSavedIdeas((prev) => ({ ...prev, [idea.businessName]: true }));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="max-w-3xl">
        <p className="text-xs font-medium text-purple-800">AI Startup Discovery</p>
        <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-purple-950">
          AI Business Idea Finder
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Share your budget, skills, preferred business category, and work setup to get realistic
          micro-business ideas tailored for women entrepreneurs in India.
        </p>
      </div>

      {/* Form Card */}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-7 rounded-xl border border-purple-100 bg-white p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="ideaBudget" className="block text-sm font-medium text-slate-800">
              Investment Budget (INR ₹) <span className="text-purple-700">*</span>
            </label>
            <input
              id="ideaBudget"
              type="text"
              inputMode="numeric"
              value={budgetRaw}
              onChange={(e) => setBudgetRaw(e.target.value)}
              placeholder="e.g., 25000"
              className="font-mono-num mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['10000', '25000', '50000', '100000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBudgetRaw(preset)}
                  className={`font-mono-num rounded-md border px-2.5 py-1 text-xs transition-colors ${
                    budgetRaw === preset
                      ? 'border-purple-700 bg-purple-100 font-semibold text-purple-950'
                      : 'border-purple-200 bg-purple-50/40 text-purple-900 hover:bg-purple-100/70'
                  }`}
                >
                  ₹{Number(preset).toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="businessType" className="block text-sm font-medium text-slate-800">
              Preferred Business Type <span className="text-purple-700">*</span>
            </label>
            <select
              id="businessType"
              value={preferredBusinessType}
              onChange={(e) => setPreferredBusinessType(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="skillsInput" className="block text-sm font-medium text-slate-800">
              Your Skills &amp; Interests <span className="text-purple-700">*</span>
            </label>
            <textarea
              id="skillsInput"
              rows={2}
              value={skillsAndInterests}
              onChange={(e) => setSkillsAndInterests(e.target.value)}
              placeholder="e.g., Homemade snacks, festival gift packaging, managing WhatsApp customer groups"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-500">Quick add:</span>
              {SKILL_SUGGESTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => appendSkillSuggestion(skill)}
                  className="rounded-md border border-purple-200 bg-purple-50/40 px-2.5 py-1 text-xs text-purple-900 hover:bg-purple-100"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-slate-800">
              Preferred Business Setup <span className="text-purple-700">*</span>
            </p>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
              {WORK_SETTINGS.map((setting) => {
                const active = workSetting === setting;
                return (
                  <button
                    key={setting}
                    type="button"
                    onClick={() => setWorkSetting(setting)}
                    className={`min-h-[44px] rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors text-left ${
                      active
                        ? 'border-purple-800 bg-purple-800 text-white'
                        : 'border-purple-200 bg-purple-50/40 text-purple-950 hover:bg-purple-100/70'
                    }`}
                  >
                    {setting}
                  </button>
                );
              })}
            </div>
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
              onClick={() => void generateIdeas()}
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
            Powered by server-side Gemini AI and the HERBIZ knowledge library. Results are estimates,
            not financial guarantees.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-900 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Ideas...</span>
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4" />
                <span>Find Business Ideas</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-xs sm:text-sm text-purple-950">
            <span className="font-semibold">Guidance Note: </span>
            <span>{result.guidanceDisclaimer}</span>
            {result.sourceNotes.length > 0 && (
              <p className="mt-1.5 text-xs text-slate-600">
                <span className="font-semibold text-purple-900">Knowledge areas consulted: </span>
                {Array.from(new Set(result.sourceNotes.map((n) => n.area))).join(' · ')}
              </p>
            )}
          </div>

          <div className="grid gap-6">
            {result.ideas.map((idea, index) => {
              const isSaved = Boolean(savedIdeas[idea.businessName]);
              return (
                <article
                  key={`${idea.businessName}-${index}`}
                  className="rounded-xl border border-purple-100 bg-white p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-purple-100 pb-4">
                    <div>
                      <p className="text-xs font-medium text-purple-700">
                        Idea 0{index + 1} · {workSetting}
                      </p>
                      <h2 className="font-display mt-1 text-xl font-bold text-purple-950">
                        {idea.businessName}
                      </h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                        {idea.shortDescription}
                      </p>
                    </div>
                    <div className="rounded-lg border border-purple-200 bg-purple-50/70 px-4 py-2.5 shrink-0">
                      <p className="text-xs text-slate-600">Estimated Startup Investment</p>
                      <p className="font-mono-num mt-0.5 text-sm font-bold text-purple-950">
                        {idea.estimatedStartupInvestment}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-900">
                        Target Customers
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                        {idea.targetCustomers}
                      </p>

                      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-purple-900">
                        Required Skills
                      </h3>
                      <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
                        {idea.requiredSkills.map((skill) => (
                          <li key={skill}>• {skill}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-purple-900">
                        Potential Challenges
                      </h3>
                      <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
                        {idea.potentialChallenges.map((challenge) => (
                          <li key={challenge}>• {challenge}</li>
                        ))}
                      </ul>

                      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-purple-900">
                        First Steps to Begin
                      </h3>
                      <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-sm text-slate-700">
                        {idea.firstSteps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-purple-100 pt-4">
                    <button
                      type="button"
                      onClick={() => handlePlanFromIdea(idea)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-purple-800 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-900 whitespace-nowrap"
                    >
                      <Compass className="h-3.5 w-3.5" />
                      <span>Generate 30-Day Business Plan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={isSaved}
                      onClick={() => handleSaveFirstStep(idea)}
                      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold whitespace-nowrap ${
                        isSaved
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-purple-200 bg-white text-purple-900 hover:bg-purple-50'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>First Step Added to Tracker</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-3.5 w-3.5" />
                          <span>Save First Step to Progress Tracker</span>
                        </>
                      )}
                    </button>

                    {isSaved && (
                      <button
                        type="button"
                        onClick={() => onNavigate('action-plan')}
                        className="text-xs font-semibold text-purple-800 underline hover:text-purple-950"
                      >
                        Open Progress Tracker
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
