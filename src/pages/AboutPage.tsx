import { useState } from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Users } from 'lucide-react';
import type { PageId } from '../types/herbiz';
import aboutWomenImg from '../assets/images/about_women_business_1795618493829.jpg';

interface AboutPageProps {
  onNavigate: (page: PageId) => void;
}

export default function AboutPage({ onNavigate }: AboutPageProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="max-w-3xl">
        <p className="text-xs font-medium text-purple-800">About HERBIZ AI</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-purple-950 sm:text-4xl [text-wrap:balance]">
          Supporting Women-Led Micro and Small Businesses with Clear, Honest Guidance
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          HERBIZ AI is a student-built decision-support prototype created to make structured
          business guidance, simple financial checks, and verified Indian government portals easy
          to understand and act on.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-purple-100 bg-purple-50">
        {!imageError ? (
          <img
            src={aboutWomenImg}
            alt="Two Indian women business owners reviewing product packaging and ledger notes together"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="h-64 w-full object-cover sm:h-80 lg:h-96"
          />
        ) : (
          <div className="flex h-64 items-center justify-center bg-gradient-to-r from-purple-100 to-pink-100 p-6 text-center">
            <p className="font-display text-lg font-semibold text-purple-950">
              Built for Women Entrepreneurs Across India
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-purple-100 bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-purple-950">
            Problem Statement
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Many women running home kitchens, tailoring studios, handicraft units, beauty parlours,
            or neighbourhood retail shops manage production, sales, and household responsibilities
            all at once. Yet practical guidance on unit pricing, simple monthly cash tracking, safe
            digital selling, and authentic government portals is often scattered, overly technical,
            or mixed with unreliable social media claims.
          </p>
        </section>

        <section className="rounded-xl border border-purple-100 bg-purple-50/40 p-6">
          <h2 className="font-display text-xl font-semibold text-purple-950">
            Project Objectives
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
            <li>• Provide a plain-English business assessment that respects user privacy.</li>
            <li>• Offer structured recommendations focused on root causes and one clear next step.</li>
            <li>• Connect an AI assistant to curated HERBIZ micro-business knowledge on the server.</li>
            <li>• Point entrepreneurs only to checked, official Indian support portals.</li>
          </ul>
        </section>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-purple-100 bg-white p-6">
          <Users className="h-5 w-5 text-purple-800" />
          <h3 className="font-display mt-3 text-base font-semibold text-purple-950">
            Target Users
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Women founders in India running or planning micro and small enterprises—from home-based
            food and craft makers to local boutiques, salons, tutoring services, and retail shops.
          </p>
        </div>

        <div className="rounded-xl border border-purple-100 bg-white p-6">
          <Sparkles className="h-5 w-5 text-purple-800" />
          <h3 className="font-display mt-3 text-base font-semibold text-purple-950">
            Key Benefits
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Saves time with plain-language answers, makes monthly sales vs. expenses easy to review,
            encourages safe digital tool adoption, and turns advice into weekly tasks.
          </p>
        </div>

        <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-6">
          <ShieldCheck className="h-5 w-5 text-purple-800" />
          <h3 className="font-display mt-3 text-base font-semibold text-purple-950">
            Responsible Boundaries
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            This prototype does not replace a chartered accountant, lawyer, or bank officer, and
            never checks legal scheme eligibility or approves loans.
          </p>
        </div>
      </div>

      <section className="mt-10 rounded-xl border border-purple-100 bg-purple-50/50 p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-purple-950">
          How the Website and AI Guidance Work Together
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 text-sm leading-relaxed text-slate-700">
          <div>
            <p className="font-semibold text-purple-950">1. Structured Assessment & Rules</p>
            <p className="mt-1">
              When you submit the Business Assessment, the server calculates your simple estimated
              monthly profit (Monthly Sales minus Monthly Expenses) when both same-month figures are
              provided, and maps your selected challenge to practical causes and steps. Fictional
              sample profiles are always labelled clearly and kept separate from your real entries.
            </p>
          </div>
          <div>
            <p className="font-semibold text-purple-950">2. Grounded Server-Side Gemini AI</p>
            <p className="mt-1">
              Every message in the HERBIZ AI Assistant goes through our Node.js backend, which
              retrieves relevant HERBIZ knowledge sections (financial basics, marketing, growth,
              digital safety, and verified Indian portals) before calling Gemini so answers stay
              practical, honest, and grounded.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => onNavigate('assessment')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-900"
          >
            <span>Start Business Assessment</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('resources')}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-purple-200 bg-white px-5 py-2.5 text-sm font-semibold text-purple-900 hover:bg-purple-50"
          >
            Browse Verified Resources
          </button>
        </div>
      </section>
    </div>
  );
}
