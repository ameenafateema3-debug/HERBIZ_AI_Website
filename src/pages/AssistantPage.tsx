import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  Send,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import type { BusinessAssessment, ChatMessage, ChatSourceNote, PageId } from '../types/herbiz';
import ProfileAnalysisCard from '../components/ProfileAnalysisCard';
import { fetchJson } from '../utils/apiClient';

interface AssistantPageProps {
  userAssessment: BusinessAssessment | null;
  onNavigate: (page: PageId) => void;
}

const STARTER_PROMPTS = [
  'How do I calculate monthly net profit and profit margin?',
  'How can I promote a home-based business with a small budget?',
  'What is a simple 30-day business improvement plan?',
  'Which official Indian portals should I check for MSME or Startup India schemes?',
  'How should I separate personal money from business money?',
];

export default function AssistantPage({ userAssessment, onNavigate }: AssistantPageProps) {
  const realUserProfile =
    userAssessment && !userAssessment.isDemoSample ? userAssessment : null;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: realUserProfile
        ? `Namaste! I can see your submitted assessment for ${realUserProfile.businessName || realUserProfile.businessCategory} (${realUserProfile.businessStage}), where your main challenge is "${realUserProfile.mainChallenge}".\n\nAsk me any practical question about sales, simple profit checks, marketing, digital tools, or official Indian support portals.`
        : 'Namaste! I am the HERBIZ AI Business Assistant. Ask me any question about managing sales and expenses, attracting repeat customers, adopting digital tools safely, or finding verified Indian business support portals.\n\nShare your business type and rough monthly figures whenever you want tailored guidance.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopyResponse = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2200);
    } catch {
      setErrorMsg('Clipboard copy was blocked by your browser. Please select and copy the text.');
    }
  };

  const sendMessage = async (textToSend: string, isRetry = false) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    setErrorMsg(null);
    if (!isRetry) {
      setLastFailedPrompt(null);
    }

    let nextMessages = messages;
    if (!isRetry) {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput('');
    }
    setLoading(true);

    try {
      const apiMessages = nextMessages
        .filter((m) => m.id !== 'welcome-msg')
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await fetchJson<{
        reply: string;
        matchedTopics?: string[];
        sourceNotes?: ChatSourceNote[];
        retrievedExcerpts?: Array<{ area: string; section: string; score: number; preview: string }>;
        insufficientKnowledge?: boolean;
        fallbackUsed?: boolean;
        referencedResources?: Array<{ title: string; url: string }>;
      }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: apiMessages,
          userProfile: realUserProfile,
        }),
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        matchedTopics: data.matchedTopics,
        sourceNotes: data.sourceNotes,
        retrievedExcerpts: data.retrievedExcerpts,
        insufficientKnowledge: Boolean(data.insufficientKnowledge),
        fallbackUsed: Boolean(data.fallbackUsed),
        referencedResources: data.referencedResources,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLastFailedPrompt(null);
    } catch (err: unknown) {
      setLastFailedPrompt(trimmed);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'We could not reach the HERBIZ AI assistant right now. Please click Retry or try again in a moment.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleResetChat = () => {
    setErrorMsg(null);
    setLastFailedPrompt(null);
    setCopiedId(null);
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: realUserProfile
          ? `Conversation cleared. Your submitted profile (${realUserProfile.businessName || realUserProfile.businessCategory}) is still active if you want to ask about it.`
          : 'Conversation cleared. How can I help with your business today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-purple-800">Gemini-Powered Guidance</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-purple-950">
            HERBIZ AI Assistant
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Connected to our server-side HERBIZ knowledge base for practical, simple-English
            guidance.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          disabled={loading}
          className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-lg border border-purple-200 bg-white px-3.5 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-50 disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Clear Conversation</span>
        </button>
      </div>

      {/* Context & Safety Banner */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-xs leading-relaxed text-slate-700">
          {realUserProfile ? (
            <div>
              <span className="font-semibold text-purple-950">Active Business Context: </span>
              <span>
                {realUserProfile.businessName || realUserProfile.businessCategory} ·{' '}
                {realUserProfile.mainChallenge}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong className="text-purple-950">No assessment submitted yet:</strong> Assistant
                uses only details you type here.
              </span>
              <button
                type="button"
                onClick={() => onNavigate('assessment')}
                className="font-semibold text-purple-800 underline hover:text-purple-950 whitespace-nowrap shrink-0"
              >
                Fill Assessment
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-pink-100 bg-pink-50/40 px-4 py-3 text-xs leading-relaxed text-slate-700">
          <ShieldCheck className="h-4 w-4 shrink-0 text-purple-800" />
          <span>
            Never share OTPs, UPI/ATM PINs, passwords, or private bank details in chat.
          </span>
        </div>
      </div>

      {/* Controlled Business Profile Analysis */}
      <div className="mt-4">
        <ProfileAnalysisCard
          profile={realUserProfile}
          onNavigateToAssessment={() => onNavigate('assessment')}
        />
      </div>

      {/* Chat Panel */}
      <div className="mt-5 flex flex-col rounded-xl border border-purple-200 bg-white">
        <div className="h-[340px] sm:h-[430px] overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isCopied = copiedId === msg.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-purple-800 text-white'
                      : 'border border-purple-100 bg-purple-50/50 text-slate-800'
                  }`}
                >
                  {msg.content}

                  {!isUser && msg.referencedResources && msg.referencedResources.length > 0 && (
                    <div className="mt-3 border-t border-purple-200/70 pt-2.5">
                      <p className="text-xs font-semibold text-purple-950">
                        Verified Official Portals Referenced
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {msg.referencedResources.map((res) => (
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
                  {!isUser && msg.sourceNotes && msg.sourceNotes.length > 0 && (
                    <div className="mt-3 border-t border-purple-200/70 pt-2.5 text-xs text-slate-600">
                      <span className="font-semibold text-purple-950">Knowledge source: </span>
                      <span>
                        {msg.sourceNotes
                          .slice(0, 3)
                          .map((note) => `${note.area} (${note.section})`)
                          .join(' · ')}
                      </span>
                    </div>
                  )}

                  {!isUser && msg.insufficientKnowledge && (
                    <div className="mt-3 border-t border-purple-200/70 pt-2.5 text-xs text-purple-900">
                      <span className="font-semibold">Knowledge check: </span>
                      <span>
                        No matching section found in the 6 HERBIZ knowledge documents; safe
                        fallback returned without guessing.
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-2 px-1 text-xs text-slate-600">
                  <span>{isUser ? 'You' : 'HERBIZ AI'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => void handleCopyResponse(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 font-medium text-purple-800 hover:text-purple-950"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-700" />
                            <span className="text-emerald-800">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy response</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {!isUser && msg.sourceNotes && msg.sourceNotes.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>
                        Areas: {Array.from(new Set(msg.sourceNotes.map((s) => s.area))).join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start" aria-live="polite">
              <div className="inline-flex items-center gap-2.5 rounded-xl border border-purple-200 bg-purple-50/70 px-4 py-3 text-sm text-purple-900">
                <Loader2 className="h-4 w-4 animate-spin text-purple-800" />
                <span>Searching HERBIZ knowledge library and preparing guidance...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800 sm:mx-6"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {lastFailedPrompt && (
              <button
                type="button"
                disabled={loading}
                onClick={() => void sendMessage(lastFailedPrompt, true)}
                className="inline-flex items-center gap-1 rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Quick Prompts */}
        <div className="border-t border-purple-100 bg-purple-50/30 px-4 py-3 sm:px-6">
          <p className="text-xs font-medium text-slate-500">Suggested questions</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => void sendMessage(prompt)}
                className="rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-left text-xs text-purple-900 transition-colors hover:bg-purple-50 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-3 border-t border-purple-100 p-4 sm:px-6"
        >
          <label htmlFor="chat-input" className="sr-only">
            Ask HERBIZ AI a business question
          </label>
          <textarea
            id="chat-input"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder="Ask about sales, expenses, product photos, digital tools, or official portals..."
            className="min-w-0 flex-1 resize-none rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          <button
            type="submit"
            disabled={loading || input.trim().length === 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-900 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <Send className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
