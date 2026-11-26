import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Calculator,
  CheckCircle2,
  ClipboardList,
  FileText,
  Info,
  Lightbulb,
  Megaphone,
  MessageSquareText,
  Target,
} from 'lucide-react';
import type {
  ActionPlanTask,
  BusinessAssessment,
  BusinessGoal,
  CalculatorSnapshot,
  PageId,
} from '../types/herbiz';

interface DashboardPageProps {
  userAssessment: BusinessAssessment | null;
  calculatorSnapshot: CalculatorSnapshot | null;
  goals: BusinessGoal[];
  tasks: ActionPlanTask[];
  onNavigate: (page: PageId) => void;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

const SAMPLE_PREVIEW_METRICS = {
  label: 'Sample Dataset Preview (Fictional Micro-Business)',
  monthlySales: 48000,
  monthlyExpenses: 32500,
  estimatedProfit: 15500,
  breakEvenSales: 32500,
  marginPercent: 32.3,
  categoryBreakdown: [
    { label: 'Raw Materials / Stock', amount: 18500 },
    { label: 'Rent & Utilities', amount: 9000 },
    { label: 'Packaging & Local Delivery', amount: 5000 },
  ],
};

export default function DashboardPage({
  userAssessment,
  calculatorSnapshot,
  goals,
  tasks,
  onNavigate,
}: DashboardPageProps) {
  const [showSamplePreview, setShowSamplePreview] = useState(false);

  const realAssessment =
    userAssessment && !userAssessment.isDemoSample ? userAssessment : null;

  const hasUserCalculator = Boolean(calculatorSnapshot);
  const hasUserAssessmentNumbers =
    realAssessment !== null &&
    realAssessment.monthlySales !== null &&
    realAssessment.monthlyExpenses !== null &&
    realAssessment.sameMonthPeriodConfirmed;

  const useUserData = hasUserCalculator || hasUserAssessmentNumbers;
  const usingSample = !useUserData && showSamplePreview;

  const activeSales = hasUserCalculator
    ? calculatorSnapshot!.monthlySalesRevenue
    : hasUserAssessmentNumbers
    ? realAssessment!.monthlySales ?? 0
    : usingSample
    ? SAMPLE_PREVIEW_METRICS.monthlySales
    : null;

  const activeExpenses = hasUserCalculator
    ? calculatorSnapshot!.totalMonthlyExpenses
    : hasUserAssessmentNumbers
    ? realAssessment!.monthlyExpenses ?? 0
    : usingSample
    ? SAMPLE_PREVIEW_METRICS.monthlyExpenses
    : null;

  const activeProfit =
    activeSales !== null && activeExpenses !== null ? activeSales - activeExpenses : null;

  const activeMargin =
    activeSales !== null && activeSales > 0 && activeProfit !== null
      ? Number(((activeProfit / activeSales) * 100).toFixed(1))
      : null;

  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'In progress').length;
  const notStartedTasks = tasks.filter((t) => t.status === 'Not started').length;
  const taskProgressPct =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const maxChartValue = Math.max(activeSales ?? 0, activeExpenses ?? 0, 1);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-purple-800">Built-In HERBIZ Overview</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-purple-950">
            HERBIZ Business Dashboard
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            Track your business figures, goals, and task progress directly inside HERBIZ AI using
            the numbers you enter across the calculator, assessment, and progress tracker.
          </p>
        </div>

        {!useUserData && (
          <button
            type="button"
            onClick={() => setShowSamplePreview((prev) => !prev)}
            className="inline-flex min-h-[40px] items-center gap-1.5 self-start rounded-lg border border-purple-200 bg-purple-50/70 px-4 py-2 text-xs font-semibold text-purple-950 hover:bg-purple-100 whitespace-nowrap shrink-0"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>
              {showSamplePreview ? 'Hide Sample Preview' : 'Preview with Fictional Sample Data'}
            </span>
          </button>
        )}
      </div>

      {/* Data Source Transparency Banner */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-xs sm:text-sm text-slate-700">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-purple-800" />
        <div>
          {useUserData ? (
            <p>
              <strong className="text-purple-950">Showing Your Entered Business Estimates: </strong>
              Financial figures below come from{' '}
              {hasUserCalculator
                ? 'your Profit & Budget Calculator snapshot (saved locally in this browser).'
                : 'your current-session Business Assessment.'}{' '}
              All profit numbers are simplified estimates, not audited accounts.
            </p>
          ) : usingSample ? (
            <p>
              <strong className="text-purple-950">
                Sample Dataset Preview (Fictional Example Only):{' '}
              </strong>
              These numbers are simulated for demonstration and are not real business records. Enter
              your own figures in the Profit &amp; Budget Calculator or Business Assessment anytime.
            </p>
          ) : (
            <p>
              <strong className="text-purple-950">No Personal Business Figures Added Yet: </strong>
              Use the <strong>Profit &amp; Budget Calculator</strong> or{' '}
              <strong>Business Assessment</strong> to view your own estimates here, or toggle the
              fictional sample preview above.
            </p>
          )}
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-purple-100 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Monthly Sales</p>
          <p className="font-mono-num mt-1.5 text-2xl font-bold text-purple-950">
            {activeSales !== null ? formatINR(activeSales) : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {usingSample
              ? 'Sample preview figure'
              : activeSales !== null
              ? 'User-entered monthly sales'
              : 'Enter in Calculator or Assessment'}
          </p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Monthly Expenses</p>
          <p className="font-mono-num mt-1.5 text-2xl font-bold text-purple-950">
            {activeExpenses !== null ? formatINR(activeExpenses) : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {usingSample
              ? 'Sample preview costs'
              : activeExpenses !== null
              ? 'Same-month entered expenses'
              : 'Enter in Calculator or Assessment'}
          </p>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-5">
          <p className="text-xs font-medium text-slate-600">Estimated Monthly Profit</p>
          <p
            className={`font-mono-num mt-1.5 text-2xl font-bold ${
              activeProfit !== null && activeProfit < 0 ? 'text-red-800' : 'text-purple-950'
            }`}
          >
            {activeProfit !== null ? formatINR(activeProfit) : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {activeMargin !== null
              ? `Estimated margin: ${activeMargin}%`
              : 'Estimate (Sales minus Expenses)'}
          </p>
        </div>

        <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-5">
          <p className="text-xs font-medium text-slate-600">Goal &amp; Task Progress</p>
          <p className="font-mono-num mt-1.5 text-2xl font-bold text-purple-950">
            {taskProgressPct}%
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {completedTasks} of {tasks.length} tasks done · {goals.length} goals set
          </p>
        </div>
      </div>

      {/* Native Financial Overview + Progress Overview */}
      <div className="mt-7 grid gap-6 lg:grid-cols-12">
        {/* Financial Summary Chart Card */}
        <section className="rounded-xl border border-purple-100 bg-white p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-purple-950">
                Monthly Financial Snapshot
              </h2>
              <p className="text-xs text-slate-500">
                {usingSample
                  ? SAMPLE_PREVIEW_METRICS.label
                  : hasUserCalculator
                  ? 'From your saved Profit & Budget Calculator figures'
                  : hasUserAssessmentNumbers
                  ? `From ${realAssessment?.businessName || realAssessment?.businessCategory}`
                  : 'Waiting for your sales & expense entries'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('calculator')}
              className="text-xs font-semibold text-purple-800 underline hover:text-purple-950"
            >
              Open Calculator
            </button>
          </div>

          {activeSales !== null && activeExpenses !== null ? (
            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>Monthly Sales Revenue</span>
                  <span className="font-mono-num font-semibold text-purple-950">
                    {formatINR(activeSales)}
                  </span>
                </div>
                <div className="mt-1.5 h-3.5 w-full overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-full rounded-full bg-purple-800"
                    style={{ width: `${Math.round((activeSales / maxChartValue) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>Total Monthly Expenses</span>
                  <span className="font-mono-num font-semibold text-purple-950">
                    {formatINR(activeExpenses)}
                  </span>
                </div>
                <div className="mt-1.5 h-3.5 w-full overflow-hidden rounded-full bg-pink-100">
                  <div
                    className="h-full rounded-full bg-pink-500"
                    style={{ width: `${Math.round((activeExpenses / maxChartValue) * 100)}%` }}
                  />
                </div>
              </div>

              {hasUserCalculator && calculatorSnapshot && (
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-purple-100 pt-4 text-xs">
                  <div>
                    <p className="text-slate-500">Operating Costs</p>
                    <p className="font-mono-num mt-0.5 font-semibold text-purple-950">
                      {formatINR(calculatorSnapshot.monthlyOperatingExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Product Costs</p>
                    <p className="font-mono-num mt-0.5 font-semibold text-purple-950">
                      {formatINR(calculatorSnapshot.productCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Break-Even Sales</p>
                    <p className="font-mono-num mt-0.5 font-semibold text-purple-950">
                      {formatINR(calculatorSnapshot.breakEvenMonthlySales)}
                    </p>
                  </div>
                </div>
              )}

              {usingSample && (
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-purple-100 pt-4 text-xs">
                  {SAMPLE_PREVIEW_METRICS.categoryBreakdown.map((item) => (
                    <div key={item.label}>
                      <p className="text-slate-500">{item.label}</p>
                      <p className="font-mono-num mt-0.5 font-semibold text-purple-950">
                        {formatINR(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-purple-200 bg-purple-50/30 p-6 text-center">
              <p className="text-sm font-medium text-purple-950">
                Enter your monthly numbers to view your breakdown
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Calculate profit margin and break-even sales in seconds, or fill your Business
                Assessment.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate('calculator')}
                  className="rounded-lg bg-purple-800 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-900"
                >
                  Open Profit Calculator
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('assessment')}
                  className="rounded-lg border border-purple-200 bg-white px-4 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-50"
                >
                  Fill Assessment
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Native Progress Summary Card */}
        <section className="rounded-xl border border-purple-100 bg-white p-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-purple-950">
                Goals &amp; Execution Progress
              </h2>
              <p className="text-xs text-slate-500">Saved locally in this browser</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('action-plan')}
              className="text-xs font-semibold text-purple-800 underline hover:text-purple-950"
            >
              Manage Tracker
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <span>Task Completion</span>
              <span className="font-mono-num font-bold text-purple-950">{taskProgressPct}%</span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-purple-100">
              <div
                className="h-full rounded-full bg-purple-800 transition-all duration-300"
                style={{ width: `${taskProgressPct}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-purple-100 bg-purple-50/30 p-2">
                <p className="text-slate-500">Not started</p>
                <p className="font-mono-num mt-0.5 font-bold text-slate-800">{notStartedTasks}</p>
              </div>
              <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-2">
                <p className="text-slate-500">In progress</p>
                <p className="font-mono-num mt-0.5 font-bold text-purple-900">{inProgressTasks}</p>
              </div>
              <div className="rounded-lg border border-pink-100 bg-pink-50/50 p-2">
                <p className="text-slate-500">Completed</p>
                <p className="font-mono-num mt-0.5 font-bold text-emerald-800">{completedTasks}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-purple-100 pt-4">
            <p className="text-xs font-semibold text-purple-950">Active Business Goals</p>
            {goals.length === 0 ? (
              <p className="mt-1.5 text-xs text-slate-500">
                No goals added yet. Set your first milestone in the Business Progress Tracker.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {goals.slice(0, 3).map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-2 text-xs text-slate-700"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Target className="h-3.5 w-3.5 shrink-0 text-purple-800" />
                      <span className="truncate font-medium">{g.title}</span>
                    </span>
                    <span className="font-mono-num shrink-0 text-slate-500">{g.targetDate}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* All HERBIZ AI Tools Hub */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold text-purple-950">
          HERBIZ AI Entrepreneurship Workspace
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Jump straight into any planning, financial, marketing, or advisory tool.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              id: 'idea-finder' as PageId,
              title: 'Business Idea Finder',
              desc: 'Discover micro-business ideas for your budget and skills.',
              icon: Lightbulb,
            },
            {
              id: 'plan-generator' as PageId,
              title: 'Business Plan Generator',
              desc: 'Create an 8-part business plan with a 30-day roadmap.',
              icon: FileText,
            },
            {
              id: 'calculator' as PageId,
              title: 'Profit & Budget Calculator',
              desc: 'Compute monthly profit, margin, and break-even sales.',
              icon: Calculator,
            },
            {
              id: 'marketing-assistant' as PageId,
              title: 'AI Marketing Assistant',
              desc: 'Generate Instagram captions, WhatsApp copy, and slogans.',
              icon: Megaphone,
            },
            {
              id: 'assistant' as PageId,
              title: 'HERBIZ AI Chatbot',
              desc: 'Ask business questions grounded in HERBIZ knowledge.',
              icon: MessageSquareText,
            },
            {
              id: 'assessment' as PageId,
              title: 'Business Assessment',
              desc: 'Evaluate your current sales, expenses, and challenge.',
              icon: ClipboardList,
            },
            {
              id: 'action-plan' as PageId,
              title: 'Progress Tracker',
              desc: 'Set goals, check off tasks, and save progress locally.',
              icon: CheckCircle2,
            },
            {
              id: 'resources' as PageId,
              title: 'India Support Portals',
              desc: 'Access verified Udyam, MSME, and Startup India portals.',
              icon: BookOpenCheck,
            },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onNavigate(tool.id)}
                className="flex flex-col justify-between rounded-xl border border-purple-100 bg-white p-5 text-left transition-colors hover:border-purple-300 hover:bg-purple-50/30"
              >
                <div>
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-purple-100 bg-purple-50 text-purple-800">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-display mt-3 text-sm font-bold text-purple-950">
                    {tool.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{tool.desc}</p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-purple-800">
                  <span>Open tool</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
