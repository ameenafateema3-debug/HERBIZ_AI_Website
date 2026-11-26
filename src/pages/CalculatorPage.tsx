import { useMemo, useState } from 'react';
import { Calculator, CheckCircle2, Info, RotateCcw } from 'lucide-react';
import type { CalculatorSnapshot, PageId } from '../types/herbiz';

interface CalculatorPageProps {
  savedSnapshot: CalculatorSnapshot | null;
  onSaveSnapshot: (snapshot: CalculatorSnapshot) => void;
  onNavigate: (page: PageId) => void;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseField(raw: string): { value: number; valid: boolean } {
  const trimmed = raw.trim().replace(/,/g, '');
  if (trimmed === '') return { value: 0, valid: true };
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return { value: 0, valid: false };
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return { value: 0, valid: false };
  return { value: num, valid: true };
}

export default function CalculatorPage({
  savedSnapshot,
  onSaveSnapshot,
  onNavigate,
}: CalculatorPageProps) {
  const [initialInvestmentRaw, setInitialInvestmentRaw] = useState(
    savedSnapshot ? String(savedSnapshot.initialInvestment) : '50000'
  );
  const [monthlySalesRaw, setMonthlySalesRaw] = useState(
    savedSnapshot ? String(savedSnapshot.monthlySalesRevenue) : '60000'
  );
  const [monthlyExpensesRaw, setMonthlyExpensesRaw] = useState(
    savedSnapshot ? String(savedSnapshot.monthlyOperatingExpenses) : '12000'
  );
  const [productCostRaw, setProductCostRaw] = useState(
    savedSnapshot ? String(savedSnapshot.productCost) : '24000'
  );
  const [otherCostsRaw, setOtherCostsRaw] = useState(
    savedSnapshot ? String(savedSnapshot.otherBusinessCosts) : '6000'
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const initialInvestment = parseField(initialInvestmentRaw);
  const monthlySales = parseField(monthlySalesRaw);
  const monthlyExpenses = parseField(monthlyExpensesRaw);
  const productCost = parseField(productCostRaw);
  const otherCosts = parseField(otherCostsRaw);

  const allValid =
    initialInvestment.valid &&
    monthlySales.valid &&
    monthlyExpenses.valid &&
    productCost.valid &&
    otherCosts.valid;

  const metrics = useMemo(() => {
    const totalMonthlyExpenses =
      monthlyExpenses.value + productCost.value + otherCosts.value;
    const estimatedMonthlyProfit = monthlySales.value - totalMonthlyExpenses;
    const profitMarginPercent =
      monthlySales.value > 0
        ? Number(((estimatedMonthlyProfit / monthlySales.value) * 100).toFixed(1))
        : 0;
    const breakEvenMonthlySales = totalMonthlyExpenses;
    const paybackMonths =
      estimatedMonthlyProfit > 0 && initialInvestment.value > 0
        ? Number((initialInvestment.value / estimatedMonthlyProfit).toFixed(1))
        : null;

    return {
      totalMonthlyExpenses,
      estimatedMonthlyProfit,
      profitMarginPercent,
      breakEvenMonthlySales,
      paybackMonths,
    };
  }, [
    initialInvestment.value,
    monthlySales.value,
    monthlyExpenses.value,
    productCost.value,
    otherCosts.value,
  ]);

  const handleSaveToDashboard = () => {
    if (!allValid) return;
    onSaveSnapshot({
      initialInvestment: initialInvestment.value,
      monthlySalesRevenue: monthlySales.value,
      monthlyOperatingExpenses: monthlyExpenses.value,
      productCost: productCost.value,
      otherBusinessCosts: otherCosts.value,
      totalMonthlyExpenses: metrics.totalMonthlyExpenses,
      estimatedMonthlyProfit: metrics.estimatedMonthlyProfit,
      profitMarginPercent: metrics.profitMarginPercent,
      breakEvenMonthlySales: metrics.breakEvenMonthlySales,
      paybackMonths: metrics.paybackMonths,
      updatedAt: new Date().toISOString(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleReset = () => {
    setInitialInvestmentRaw('0');
    setMonthlySalesRaw('0');
    setMonthlyExpensesRaw('0');
    setProductCostRaw('0');
    setOtherCostsRaw('0');
    setSavedNotice(false);
  };

  const maxVisualBar = Math.max(monthlySales.value, metrics.totalMonthlyExpenses, 1);
  const salesBarWidth = Math.round((monthlySales.value / maxVisualBar) * 100);
  const expensesBarWidth = Math.round((metrics.totalMonthlyExpenses / maxVisualBar) * 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-medium text-purple-800">Financial Planning Tool</p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-purple-950">
            Profit &amp; Budget Calculator
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Enter your initial investment, same-month sales revenue, and monthly cost items to
            calculate estimated monthly expenses, estimated profit, profit margin, and monthly
            break-even sales.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-3.5 py-2 text-xs font-semibold text-purple-900 hover:bg-purple-50 whitespace-nowrap shrink-0 self-start"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Clear Numbers</span>
        </button>
      </div>

      {/* Estimate Disclaimer */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50/60 p-4 text-xs sm:text-sm leading-relaxed text-slate-700">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-purple-800" />
        <div>
          <p className="font-semibold text-purple-950">
            Estimates Only — Not Financial Guarantees
          </p>
          <p className="mt-0.5">
            These results are simplified mathematical estimates based solely on the numbers you enter
            for the same month. They exclude GST/income taxes, loan interest, depreciation, and
            seasonal changes, and do not guarantee future profit.
          </p>
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-12">
        {/* Inputs */}
        <div className="rounded-xl border border-purple-100 bg-white p-6 lg:col-span-6">
          <h2 className="font-display text-base font-bold text-purple-950">
            Enter Business Figures (INR ₹)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Ensure monthly sales and all monthly costs refer to the same month.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="calcInitial" className="block text-sm font-medium text-slate-800">
                Initial Investment (One-time setup ₹)
              </label>
              <input
                id="calcInitial"
                type="text"
                inputMode="decimal"
                value={initialInvestmentRaw}
                onChange={(e) => setInitialInvestmentRaw(e.target.value)}
                className="font-mono-num mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              {!initialInvestment.valid && (
                <p className="mt-1 text-xs text-red-700">Enter a non-negative number.</p>
              )}
            </div>

            <div>
              <label htmlFor="calcSales" className="block text-sm font-medium text-slate-800">
                Monthly Sales Revenue (₹)
              </label>
              <input
                id="calcSales"
                type="text"
                inputMode="decimal"
                value={monthlySalesRaw}
                onChange={(e) => setMonthlySalesRaw(e.target.value)}
                className="font-mono-num mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              {!monthlySales.valid && (
                <p className="mt-1 text-xs text-red-700">Enter a non-negative number.</p>
              )}
            </div>

            <div>
              <label htmlFor="calcExpenses" className="block text-sm font-medium text-slate-800">
                Monthly Expenses (Rent, electricity, phone, helpers ₹)
              </label>
              <input
                id="calcExpenses"
                type="text"
                inputMode="decimal"
                value={monthlyExpensesRaw}
                onChange={(e) => setMonthlyExpensesRaw(e.target.value)}
                className="font-mono-num mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              {!monthlyExpenses.valid && (
                <p className="mt-1 text-xs text-red-700">Enter a non-negative number.</p>
              )}
            </div>

            <div>
              <label htmlFor="calcProductCost" className="block text-sm font-medium text-slate-800">
                Product / Raw Material Cost (Monthly ₹)
              </label>
              <input
                id="calcProductCost"
                type="text"
                inputMode="decimal"
                value={productCostRaw}
                onChange={(e) => setProductCostRaw(e.target.value)}
                className="font-mono-num mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              {!productCost.valid && (
                <p className="mt-1 text-xs text-red-700">Enter a non-negative number.</p>
              )}
            </div>

            <div>
              <label htmlFor="calcOther" className="block text-sm font-medium text-slate-800">
                Other Business Costs (Packaging, delivery, promo ₹)
              </label>
              <input
                id="calcOther"
                type="text"
                inputMode="decimal"
                value={otherCostsRaw}
                onChange={(e) => setOtherCostsRaw(e.target.value)}
                className="font-mono-num mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              {!otherCosts.valid && (
                <p className="mt-1 text-xs text-red-700">Enter a non-negative number.</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-purple-100 pt-4">
            <button
              type="button"
              disabled={!allValid}
              onClick={handleSaveToDashboard}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-purple-800 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-purple-900 disabled:opacity-50 whitespace-nowrap"
            >
              <Calculator className="h-4 w-4" />
              <span>Save Snapshot to Dashboard</span>
            </button>

            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>Saved locally</span>
              </span>
            )}
          </div>
        </div>

        {/* Live Calculated Results */}
        <div className="space-y-4 lg:col-span-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-purple-100 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Total Monthly Expenses</p>
              <p className="font-mono-num mt-1.5 text-2xl font-bold text-purple-950">
                {formatINR(metrics.totalMonthlyExpenses)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Operating + Product + Other monthly costs
              </p>
            </div>

            <div
              className={`rounded-xl border p-5 ${
                metrics.estimatedMonthlyProfit >= 0
                  ? 'border-purple-200 bg-purple-50/50'
                  : 'border-red-200 bg-red-50/50'
              }`}
            >
              <p className="text-xs font-medium text-slate-600">
                {metrics.estimatedMonthlyProfit >= 0
                  ? 'Estimated Monthly Profit'
                  : 'Estimated Monthly Loss'}
              </p>
              <p
                className={`font-mono-num mt-1.5 text-2xl font-bold ${
                  metrics.estimatedMonthlyProfit >= 0 ? 'text-purple-950' : 'text-red-800'
                }`}
              >
                {formatINR(metrics.estimatedMonthlyProfit)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Sales minus Total Monthly Expenses</p>
            </div>

            <div className="rounded-xl border border-purple-100 bg-white p-5">
              <p className="text-xs font-medium text-slate-500">Estimated Profit Margin</p>
              <p className="font-mono-num mt-1.5 text-2xl font-bold text-purple-950">
                {metrics.profitMarginPercent}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                (Estimated Profit / Monthly Sales) × 100
              </p>
            </div>

            <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-5">
              <p className="text-xs font-medium text-slate-600">Monthly Break-Even Sales</p>
              <p className="font-mono-num mt-1.5 text-2xl font-bold text-purple-950">
                {formatINR(metrics.breakEvenMonthlySales)}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Minimum monthly sales needed to cover monthly costs
              </p>
            </div>
          </div>

          {/* Investment Recovery Card */}
          <div className="rounded-xl border border-purple-100 bg-white p-5">
            <h3 className="font-display text-sm font-bold text-purple-950">
              Initial Investment Payback Estimate
            </h3>
            <p className="mt-1.5 text-sm text-slate-700">
              {initialInvestment.value === 0 ? (
                'Enter an initial investment above ₹0 to estimate how many months of current profit would recover startup costs.'
              ) : metrics.paybackMonths !== null ? (
                <>
                  At an estimated monthly profit of{' '}
                  <strong className="font-mono-num">{formatINR(metrics.estimatedMonthlyProfit)}</strong>,
                  recovering your initial investment of{' '}
                  <strong className="font-mono-num">{formatINR(initialInvestment.value)}</strong>{' '}
                  would take approximately{' '}
                  <strong className="font-mono-num text-purple-900">
                    {metrics.paybackMonths} months
                  </strong>{' '}
                  (estimate only).
                </>
              ) : (
                'With zero or negative estimated monthly profit, initial investment cannot be recovered yet. Review pricing or reduce monthly costs first.'
              )}
            </p>
          </div>

          {/* Native Visual Comparison Bar */}
          <div className="rounded-xl border border-purple-100 bg-white p-5">
            <h3 className="font-display text-sm font-bold text-purple-950">
              Monthly Sales vs. Expenses Comparison
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>Monthly Sales Revenue</span>
                  <span className="font-mono-num font-semibold text-purple-950">
                    {formatINR(monthlySales.value)}
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-full rounded-full bg-purple-800 transition-all duration-300"
                    style={{ width: `${salesBarWidth}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>Total Monthly Expenses</span>
                  <span className="font-mono-num font-semibold text-purple-950">
                    {formatINR(metrics.totalMonthlyExpenses)}
                  </span>
                </div>
                <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-pink-100">
                  <div
                    className="h-full rounded-full bg-pink-500 transition-all duration-300"
                    style={{ width: `${expensesBarWidth}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end border-t border-purple-100 pt-3">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="text-xs font-semibold text-purple-800 underline hover:text-purple-950"
              >
                View on HERBIZ Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
