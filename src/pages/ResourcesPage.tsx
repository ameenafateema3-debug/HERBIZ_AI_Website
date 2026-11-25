import { useEffect, useState } from 'react';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import type { ResourceCategory, VerifiedResource } from '../types/herbiz';

const CATEGORY_TABS: Array<{ id: 'all' | ResourceCategory; label: string }> = [
  { id: 'all', label: 'All Portals' },
  { id: 'official_government_support', label: 'Government Support' },
  { id: 'business_registration', label: 'Business Registration' },
  { id: 'finance', label: 'Finance' },
  { id: 'training_and_mentorship', label: 'Training & Mentorship' },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<VerifiedResource[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | ResourceCategory>('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadResources = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch('/api/resources');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not fetch verified resources.');
      }
      setResources(data.resources ?? []);
      setDisclaimer(data.disclaimer ?? '');
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to load verified resource links.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadResources();
  }, []);

  const filteredResources =
    activeCategory === 'all'
      ? resources
      : resources.filter((item) => item.category === activeCategory);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="max-w-3xl">
        <p className="text-xs font-medium text-purple-800">Checked Official Directories</p>
        <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-purple-950">
          Verified India Business Resources
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Official Government of India and institutional websites for registration, scheme
          discovery, credit pathways, and entrepreneurship training.
        </p>
      </div>

      {/* Important Verification Notice */}
      <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-purple-800" />
          <div className="text-sm leading-relaxed text-slate-700">
            <p className="font-semibold text-purple-950">Verify Directly on Official Portals</p>
            <p className="mt-1">
              {disclaimer ||
                'HERBIZ AI does not process loan applications, certify eligibility, or guarantee scheme benefits. Always confirm current rules, eligibility, amounts, and deadlines directly on the official website.'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Resource categories"
        className="mt-6 flex flex-wrap gap-2 border-b border-purple-100 pb-4"
      >
        {CATEGORY_TABS.map((tab) => {
          const active = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveCategory(tab.id)}
              className={`min-h-[40px] rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-purple-800 text-white'
                  : 'border border-purple-200 bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-44 rounded-xl border border-purple-100 bg-purple-50/30 p-6"
            />
          ))}
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          <p>{errorMsg}</p>
          <button
            type="button"
            onClick={() => void loadResources()}
            className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !errorMsg && filteredResources.length === 0 && (
        <div className="mt-6 rounded-xl border border-purple-100 bg-white p-8 text-center text-sm text-slate-600">
          No resources matched this category filter.
        </div>
      )}

      {!loading && !errorMsg && filteredResources.length > 0 && (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {filteredResources.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-purple-100 bg-white p-6 transition-colors hover:border-purple-300"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-purple-800">{item.categoryLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.organization}</span>
                </div>

                <h2 className="font-display mt-2 text-lg font-semibold text-purple-950">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>

              <div className="mt-5 border-t border-purple-100 pt-4">
                <p className="text-xs text-slate-500">{item.note}</p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/50 px-4 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-100"
                >
                  <span>Visit Official Website</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
