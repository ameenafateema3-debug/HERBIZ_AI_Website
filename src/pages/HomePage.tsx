import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Calculator,
  CheckSquare,
  ClipboardList,
  Compass,
  FileText,
  Lightbulb,
  Megaphone,
  MessageSquareText,
} from 'lucide-react';
import type { PageId } from '../types/herbiz';
import heroWomanImg from '../assets/images/hero_woman_entrepreneur_1795618493048.jpg';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

const FEATURES: Array<{
  id: PageId;
  title: string;
  description: string;
  icon: typeof ClipboardList;
}> = [
  {
    id: 'idea-finder',
    title: 'AI Business Idea Finder',
    description:
      'Enter your budget, skills, preferred business category, and home or shop setup to discover realistic micro-business ideas.',
    icon: Lightbulb,
  },
  {
    id: 'plan-generator',
    title: 'AI Business Plan Generator',
    description:
      'Build a structured 8-section business plan including startup costs, marketing strategy, and a 30-day action plan.',
    icon: FileText,
  },
  {
    id: 'calculator',
    title: 'Profit & Budget Calculator',
    description:
      'Calculate total monthly expenses, estimated monthly profit, profit margin, and break-even sales in seconds.',
    icon: Calculator,
  },
  {
    id: 'marketing-assistant',
    title: 'AI Marketing Assistant',
    description:
      'Generate Instagram captions, WhatsApp messages, product descriptions, business slogans, and outreach ideas.',
    icon: Megaphone,
  },
  {
    id: 'dashboard',
    title: 'HERBIZ Business Dashboard',
    description:
      'Review your own entered monthly numbers, goals, and task progress directly inside HERBIZ AI.',
    icon: BarChart3,
  },
  {
    id: 'action-plan',
    title: 'Business Progress Tracker',
    description:
      'Set business goals, track tasks with priorities, and monitor completion percentage saved locally in your browser.',
    icon: CheckSquare,
  },
  {
    id: 'assessment',
    title: 'Business Assessment',
    description:
      'Share your business stage, monthly sales, monthly expenses, and main challenge for structured recommendations.',
    icon: ClipboardList,
  },
  {
    id: 'assistant',
    title: 'HERBIZ AI Assistant',
    description:
      'Ask practical questions in plain English and get answers grounded in HERBIZ micro-business knowledge.',
    icon: MessageSquareText,
  },
  {
    id: 'resources',
    title: 'Verified India Resources',
    description:
      'Explore checked official government portals for Udyam registration, finance pathways, mentorship, and training.',
    icon: BookOpenCheck,
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Discover & Plan Your Idea',
    detail:
      'Start with the AI Business Idea Finder and Business Plan Generator—or fill the Business Assessment for an active business.',
  },
  {
    step: '02',
    title: 'Check Monthly Numbers',
    detail:
      'Use the Profit & Budget Calculator to review estimated monthly expenses, profit margin, and break-even sales.',
  },
  {
    step: '03',
    title: 'Promote & Ask HERBIZ AI',
    detail:
      'Create WhatsApp and Instagram marketing copy, or ask the Gemini-powered HERBIZ AI Assistant any practical question.',
  },
  {
    step: '04',
    title: 'Track Goals & Official Portals',
    detail:
      'Track your goals and tasks in the Business Progress Tracker and verify official Indian government portals directly.',
  },
];

export default function HomePage({ onNavigate }: HomePageProps) {
  const [heroImageError, setHeroImageError] = useState(false);

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-purple-100 bg-gradient-to-b from-purple-50/60 via-white to-pink-50/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-medium tracking-wide text-purple-800">
                Women Entrepreneurship Growth &amp; Decision Support Platform
              </p>

              <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-purple-950 sm:text-5xl leading-[1.12] [text-wrap:balance]">
                HERBIZ AI
              </h1>

              <p className="font-display mt-3 text-lg font-semibold text-purple-800 sm:text-xl [text-wrap:balance]">
                Empowering Women Entrepreneurs Through Intelligent Insights
              </p>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-700">
                Designed for women running or starting micro and small businesses in India, HERBIZ
                AI brings together an AI business idea finder, business plan generator, profit
                calculator, marketing assistant, progress tracker, verified government portals, and
                a grounded AI advisor in one approachable space.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-purple-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700"
                >
                  <span>Open Workspace Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('assistant')}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-purple-900 transition-colors hover:bg-purple-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-purple-700"
                >
                  Ask HERBIZ AI Assistant
                </button>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-slate-500 max-w-lg">
                Student decision-support prototype · Not a loan approval service, certified
                accountant, lawyer, or government eligibility checker.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] overflow-hidden rounded-xl border border-purple-100 bg-purple-50">
                {!heroImageError ? (
                  <img
                    src={heroWomanImg}
                    alt="Indian woman entrepreneur reviewing inventory and orders in her sunlit studio"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImageError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full min-h-[300px] flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-purple-50 to-pink-100 p-8 text-center">
                    <Compass className="h-10 w-10 text-purple-800" />
                    <p className="font-display mt-3 text-lg font-semibold text-purple-950">
                      HERBIZ AI Decision Support
                    </p>
                    <p className="mt-1 text-sm text-slate-600 max-w-xs">
                      Clear steps for ideas, business plans, finances, marketing, and verified
                      support.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold tracking-tight text-purple-950 sm:text-3xl [text-wrap:balance]">
            Practical Tools Built for Everyday Micro-Business Decisions
          </h2>
          <p className="mt-2.5 text-base leading-relaxed text-slate-600">
            Explore AI planning tools, budget calculations, marketing templates, and verified
            official India portals at your own pace.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="flex flex-col justify-between rounded-xl border border-purple-100 bg-white p-6 transition-colors hover:border-purple-300"
              >
                <div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 text-purple-800 border border-pink-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display mt-4 text-lg font-semibold text-purple-950">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-purple-100/80">
                  <button
                    type="button"
                    onClick={() => onNavigate(feature.id)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-800 hover:text-purple-950"
                  >
                    <span>Open {feature.title}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-purple-100 bg-pink-50/35">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-purple-950 sm:text-3xl">
              How It Works
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Four clear steps from finding a business idea to tracking daily progress.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-purple-100 bg-white p-6"
              >
                <p className="font-mono-num text-sm font-semibold text-purple-700">
                  {item.step}
                </p>
                <h3 className="font-display mt-2 text-base font-semibold text-purple-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
