import { useState, type FormEvent } from 'react';
import { CheckCircle2, ShieldAlert, Clock } from 'lucide-react';
import { fetchJson } from '../utils/apiClient';

const FEEDBACK_CATEGORIES = [
  'General Experience',
  'Clarity & Ease of Use',
  'AI Assistant Guidance',
  'Business Assessment & Recommendations',
  'Action Plan & Resources',
  'Suggestion or Issue',
];

const USEFUL_AREAS = [
  'Business Assessment',
  'HERBIZ AI Assistant',
  'Recommendations',
  'Verified Resources',
  'Action Plan',
  'Overall Experience',
];

export default function FeedbackPage() {
  const [category, setCategory] = useState(FEEDBACK_CATEGORIES[0]);
  const [rating, setRating] = useState<number>(5);
  const [mostUsefulArea, setMostUsefulArea] = useState(USEFUL_AREAS[1]);
  const [comments, setComments] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    referenceId: string;
    category: string;
    rating: number;
    mostUsefulArea: string;
    note: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const sensitivePattern =
      /\b(otp|one[- ]time[- ]password|atm pin|upi pin|cvv|password|mpin|aadhaar|bank account|ifsc)\b/i;
    if (sensitivePattern.test(comments)) {
      setErrorMsg(
        'For your safety, please remove any passwords, OTPs, PINs, or banking details from your feedback.'
      );
      return;
    }

    if (comments.trim().length < 5) {
      setErrorMsg(
        'Please enter a short comment (at least 5 characters) before submitting your feedback.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const data = await fetchJson<{
        referenceId: string;
        category?: string;
        rating?: number;
        mostUsefulArea?: string;
        note: string;
      }>('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          category,
          rating,
          mostUsefulArea,
          comments: comments.trim(),
        }),
      });

      setConfirmation({
        referenceId: data.referenceId,
        category: data.category ?? category,
        rating: data.rating ?? rating,
        mostUsefulArea: data.mostUsefulArea ?? mostUsefulArea,
        note: data.note,
      });
      setCategory(FEEDBACK_CATEGORIES[0]);
      setRating(5);
      setMostUsefulArea(USEFUL_AREAS[1]);
      setComments('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <p className="text-xs font-medium text-purple-800">Prototype Evaluation</p>
      <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-purple-950">
        Share Your Feedback
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Share a quick rating, feedback category, and comments to help improve HERBIZ AI. No personal
        contact details are needed.
      </p>

      {/* Demonstration & Privacy Notice */}
      <div className="mt-5 space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-xs sm:text-sm leading-relaxed text-slate-700">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-purple-800" />
          <div>
            <p className="font-semibold text-purple-950">
              Demonstration Feedback Form (Not Permanently Stored)
            </p>
            <p className="mt-0.5">
              No database is connected to this student prototype. Submitted feedback is processed as
              a demonstration for the current session only and is not permanently saved.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-pink-200 bg-pink-50/40 p-3.5 text-xs leading-relaxed text-slate-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-purple-800" />
          <span>
            Do not enter passwords, OTPs, bank account details, phone numbers, or unnecessary
            personal information in your comments.
          </span>
        </div>
      </div>

      {confirmation ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-8"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
            <div>
              <h2 className="font-display text-xl font-semibold text-emerald-950">
                Thank You — Feedback Received
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900">
                {confirmation.note}
              </p>

              <dl className="mt-4 grid gap-3 rounded-lg border border-emerald-200 bg-white/80 p-3.5 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-slate-500">Category</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">{confirmation.category}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Rating</dt>
                  <dd className="font-mono-num mt-0.5 font-semibold text-slate-900">
                    {confirmation.rating} / 5
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Most Useful Section</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">
                    {confirmation.mostUsefulArea}
                  </dd>
                </div>
              </dl>

              <p className="font-mono-num mt-3 text-xs text-emerald-800">
                Session Reference: {confirmation.referenceId}
              </p>

              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="mt-5 inline-flex min-h-[42px] items-center rounded-lg bg-purple-800 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-900"
              >
                Submit Another Response
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-xl border border-purple-100 bg-white p-6 sm:p-8"
        >
          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {errorMsg}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="fbCategory" className="block text-sm font-medium text-slate-800">
                Feedback Category <span className="text-purple-700">*</span>
              </label>
              <select
                id="fbCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="usefulArea" className="block text-sm font-medium text-slate-800">
                Most Useful Section
              </label>
              <select
                id="usefulArea"
                value={mostUsefulArea}
                onChange={(e) => setMostUsefulArea(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                {USEFUL_AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-800">
              How helpful did you find HERBIZ AI? <span className="text-purple-700">*</span>
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((val) => {
                const selected = rating === val;
                return (
                  <button
                    key={val}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setRating(val)}
                    className={`min-h-[42px] rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      selected
                        ? 'bg-purple-800 text-white'
                        : 'border border-purple-200 bg-white text-slate-700 hover:bg-purple-50'
                    }`}
                  >
                    <span className="font-mono-num">{val}</span> / 5
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="fbComments" className="block text-sm font-medium text-slate-800">
              Comments or Suggestions <span className="text-purple-700">*</span>
            </label>
            <textarea
              id="fbComments"
              rows={4}
              maxLength={1200}
              required
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What worked well? What could be clearer or easier to use?"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
            <p className="mt-1 text-xs text-slate-500">
              Minimum 5 characters. Please share general product feedback only.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-purple-100 pt-4">
            <p className="text-xs text-slate-500">
              Demonstration form only — not saved permanently.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-purple-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-900 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
