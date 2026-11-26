import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Megaphone,
  RotateCcw,
} from 'lucide-react';
import type {
  MarketingAssistantRequest,
  MarketingAssistantResponse,
} from '../types/herbiz';
import { fetchJson } from '../utils/apiClient';

const PLATFORMS: Array<MarketingAssistantRequest['platform']> = [
  'Instagram',
  'WhatsApp Business',
  'Facebook',
  'Local & Multi-platform',
];

export default function MarketingAssistantPage() {
  const [businessName, setBusinessName] = useState('');
  const [productOrService, setProductOrService] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] =
    useState<MarketingAssistantRequest['platform']>('Instagram');
  const [toneNote, setToneNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [kit, setKit] = useState<MarketingAssistantResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2200);
    } catch {
      setErrorMsg('Clipboard copy was blocked by your browser. Please select and copy the text.');
    }
  };

  const generateContent = async () => {
    setErrorMsg(null);
    if (businessName.trim().length < 2) {
      setErrorMsg('Please enter your business name.');
      return;
    }
    if (productOrService.trim().length < 3) {
      setErrorMsg('Please enter the product or service you want to promote.');
      return;
    }
    if (targetAudience.trim().length < 3) {
      setErrorMsg('Please describe your target audience.');
      return;
    }

    setLoading(true);
    try {
      const data = await fetchJson<{ kit: MarketingAssistantResponse }>(
        '/api/marketing-assistant',
        {
          method: 'POST',
          body: JSON.stringify({
            businessName: businessName.trim(),
            productOrService: productOrService.trim(),
            targetAudience: targetAudience.trim(),
            platform,
            toneNote: toneNote.trim() || undefined,
          }),
        }
      );
      setKit(data.kit);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to generate marketing content right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void generateContent();
  };

  const formatAllMarketingText = (data: MarketingAssistantResponse): string => {
    return [
      `MARKETING KIT FOR ${businessName.toUpperCase()}`,
      '',
      'BUSINESS SLOGANS',
      ...data.businessSlogans.map((s) => `- ${s}`),
      '',
      'INSTAGRAM CAPTIONS',
      ...data.instagramCaptions.map((c, i) => `Caption ${i + 1}:\n${c}\n`),
      'WHATSAPP PROMOTIONAL MESSAGES',
      ...data.whatsappMessages.map((m, i) => `Message ${i + 1}:\n${m}\n`),
      'PRODUCT DESCRIPTIONS',
      ...data.productDescriptions.map((d) => `${d.label}:\n${d.copy}\n`),
      'MARKETING STRATEGIES',
      ...data.marketingStrategies.map((s) => `- ${s}`),
    ].join('\n');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-medium text-purple-800">Promotion &amp; Customer Outreach</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-purple-950">
            AI Marketing Assistant
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Generate ready-to-use Instagram captions, WhatsApp promotional messages, product
            descriptions, business slogans, and simple low-cost marketing strategies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setBusinessName('Asha Handloom Studio');
            setProductOrService('Breathable handloom cotton sarees and festive dupattas');
            setTargetAudience('Working women aged 25–45 looking for comfortable festive and office wear');
            setPlatform('Instagram');
            setToneNote('Warm, authentic, highlight artisan quality and easy WhatsApp ordering');
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
          <div>
            <label htmlFor="mktBizName" className="block text-sm font-medium text-slate-800">
              Business Name <span className="text-purple-700">*</span>
            </label>
            <input
              id="mktBizName"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Meera Home Bakers"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div>
            <label htmlFor="mktPlatform" className="block text-sm font-medium text-slate-800">
              Primary Marketing Platform <span className="text-purple-700">*</span>
            </label>
            <select
              id="mktPlatform"
              value={platform}
              onChange={(e) =>
                setPlatform(e.target.value as MarketingAssistantRequest['platform'])
              }
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              {PLATFORMS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mktProduct" className="block text-sm font-medium text-slate-800">
              Product or Service <span className="text-purple-700">*</span>
            </label>
            <input
              id="mktProduct"
              type="text"
              value={productOrService}
              onChange={(e) => setProductOrService(e.target.value)}
              placeholder="e.g., Eggless whole-wheat cakes and celebration cupcakes"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div>
            <label htmlFor="mktAudience" className="block text-sm font-medium text-slate-800">
              Target Audience <span className="text-purple-700">*</span>
            </label>
            <input
              id="mktAudience"
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., Families and parents planning birthdays in nearby societies"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="mktTone" className="block text-sm font-medium text-slate-800">
              Optional Tone or Offer Note
            </label>
            <input
              id="mktTone"
              type="text"
              value={toneNote}
              onChange={(e) => setToneNote(e.target.value)}
              placeholder="e.g., Friendly local tone, mention same-day pre-order via WhatsApp"
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
              onClick={() => void generateContent()}
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
            Grounded in HERBIZ Marketing &amp; Digital Tools knowledge. Customize prices and contact
            details before posting.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-900 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Marketing Kit...</span>
              </>
            ) : (
              <>
                <Megaphone className="h-4 w-4" />
                <span>Generate Marketing Content</span>
              </>
            )}
          </button>
        </div>
      </form>

      {kit && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50/50 p-4">
            <p className="text-xs sm:text-sm text-purple-950">{kit.guidanceDisclaimer}</p>
            <button
              type="button"
              onClick={() => void handleCopy('copy-all', formatAllMarketingText(kit))}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-purple-800 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-900 whitespace-nowrap shrink-0"
            >
              {copiedKey === 'copy-all' ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedKey === 'copy-all' ? 'Copied All Content' : 'Copy All Content'}</span>
            </button>
          </div>

          {/* Business Slogans */}
          <section className="rounded-xl border border-purple-100 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-purple-950">
                Business Slogans
              </h2>
              <button
                type="button"
                onClick={() =>
                  void handleCopy('slogans', kit.businessSlogans.map((s) => `• ${s}`).join('\n'))
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-1.5 text-xs font-semibold text-purple-900 hover:bg-purple-100"
              >
                {copiedKey === 'slogans' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedKey === 'slogans' ? 'Copied' : 'Copy Slogans'}</span>
              </button>
            </div>
            <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
              {kit.businessSlogans.map((slogan, i) => (
                <li
                  key={`${slogan}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-purple-100 bg-purple-50/30 px-3.5 py-2.5 text-sm font-medium text-purple-950"
                >
                  <span>{slogan}</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy(`slogan-${i}`, slogan)}
                    aria-label={`Copy slogan ${i + 1}`}
                    className="shrink-0 rounded p-1 text-purple-800 hover:bg-purple-100"
                  >
                    {copiedKey === `slogan-${i}` ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Instagram Captions & WhatsApp Messages */}
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-purple-100 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-purple-950">
                Instagram Captions
              </h2>
              <div className="mt-4 space-y-4">
                {kit.instagramCaptions.map((caption, i) => {
                  const key = `ig-${i}`;
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-purple-100 bg-purple-50/30 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-purple-800">
                          Caption {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(key, caption)}
                          className="inline-flex items-center gap-1 rounded border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-purple-900 hover:bg-purple-50"
                        >
                          {copiedKey === key ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedKey === key ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {caption}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-purple-100 bg-white p-6">
              <h2 className="font-display text-lg font-bold text-purple-950">
                WhatsApp Promotional Messages
              </h2>
              <div className="mt-4 space-y-4">
                {kit.whatsappMessages.map((msg, i) => {
                  const key = `wa-${i}`;
                  return (
                    <div
                      key={key}
                      className="rounded-lg border border-pink-100 bg-pink-50/30 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-purple-800">
                          Message {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(key, msg)}
                          className="inline-flex items-center gap-1 rounded border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-purple-900 hover:bg-purple-50"
                        >
                          {copiedKey === key ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedKey === key ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {msg}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Product Descriptions */}
          <section className="rounded-xl border border-purple-100 bg-white p-6">
            <h2 className="font-display text-lg font-bold text-purple-950">
              Product Descriptions
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {kit.productDescriptions.map((desc, i) => {
                const key = `desc-${i}`;
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-purple-100 bg-purple-50/30 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-purple-900">{desc.label}</span>
                      <button
                        type="button"
                        onClick={() => void handleCopy(key, desc.copy)}
                        className="inline-flex items-center gap-1 rounded border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-purple-900 hover:bg-purple-50"
                      >
                        {copiedKey === key ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span>{copiedKey === key ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {desc.copy}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Simple Marketing Strategies */}
          <section className="rounded-xl border border-purple-100 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-purple-950">
                Simple Marketing Strategies
              </h2>
              <button
                type="button"
                onClick={() =>
                  void handleCopy(
                    'strategies',
                    kit.marketingStrategies.map((s) => `• ${s}`).join('\n')
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-1.5 text-xs font-semibold text-purple-900 hover:bg-purple-100"
              >
                {copiedKey === 'strategies' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedKey === 'strategies' ? 'Copied' : 'Copy Strategies'}</span>
              </button>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
              {kit.marketingStrategies.map((strategy, i) => (
                <li key={i}>• {strategy}</li>
              ))}
            </ul>
            {kit.sourceNotes.length > 0 && (
              <p className="mt-4 border-t border-purple-100 pt-3 text-xs text-slate-500">
                Knowledge sources: {Array.from(new Set(kit.sourceNotes.map((n) => n.area))).join(' · ')}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
