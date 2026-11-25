import type { PageId } from '../types/herbiz';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const handleSelect = (page: PageId) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-purple-100 bg-purple-50/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="font-display text-base font-bold text-purple-950">HERBIZ AI</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 max-w-sm">
              Empowering Women Entrepreneurs Through Intelligent Insights. A student decision-support
              prototype built for women running micro and small businesses in India.
            </p>
          </div>

          <div>
            <p className="font-display text-sm font-semibold text-purple-950">Platform Sections</p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
              <button type="button" onClick={() => handleSelect('home')} className="text-left hover:text-purple-900">
                Home
              </button>
              <button type="button" onClick={() => handleSelect('about')} className="text-left hover:text-purple-900">
                About
              </button>
              <button type="button" onClick={() => handleSelect('assessment')} className="text-left hover:text-purple-900">
                Business Assessment
              </button>
              <button type="button" onClick={() => handleSelect('assistant')} className="text-left hover:text-purple-900">
                AI Assistant
              </button>
              <button type="button" onClick={() => handleSelect('recommendations')} className="text-left hover:text-purple-900">
                Recommendations
              </button>
              <button type="button" onClick={() => handleSelect('resources')} className="text-left hover:text-purple-900">
                Verified Resources
              </button>
              <button type="button" onClick={() => handleSelect('action-plan')} className="text-left hover:text-purple-900">
                Action Plan
              </button>
              <button type="button" onClick={() => handleSelect('feedback')} className="text-left hover:text-purple-900">
                Feedback
              </button>
            </div>
          </div>

          <div>
            <p className="font-display text-sm font-semibold text-purple-950">Important Scope & Privacy</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              HERBIZ AI is a decision-support prototype—not a loan approval service, certified
              accountant, lawyer, or official government eligibility checker. Never enter passwords,
              OTPs, bank PINs, or private banking credentials.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-purple-100 pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <p>HERBIZ AI · Student Project Prototype · Women Entrepreneurship Decision Support</p>
          <p>Always verify scheme rules and deadlines directly on official .gov.in portals.</p>
        </div>
      </div>
    </footer>
  );
}
