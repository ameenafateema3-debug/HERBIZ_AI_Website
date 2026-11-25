import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { PageId } from '../types/herbiz';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV_LINKS: Array<{ id: PageId; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'resources', label: 'Resources' },
  { id: 'action-plan', label: 'Action Plan' },
  { id: 'feedback', label: 'Feedback' },
];

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  const handleSelect = (page: PageId) => {
    onNavigate(page);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-purple-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="font-display text-lg font-bold tracking-tight text-purple-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-700"
        >
          HERBIZ AI
        </button>

        <nav aria-label="Primary" className="hidden lg:flex items-center gap-5">
          {NAV_LINKS.map((link) => {
            const active = currentPage === link.id;
            return (
              <button
                key={link.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => handleSelect(link.id)}
                className={`py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-700 ${
                  active
                    ? 'border-purple-800 text-purple-900'
                    : 'border-transparent text-slate-600 hover:text-purple-900 hover:border-purple-200'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleSelect('assistant')}
            className={`hidden sm:inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-700 ${
              currentPage === 'assistant'
                ? 'bg-purple-950 text-white'
                : 'bg-purple-800 text-white hover:bg-purple-900'
            }`}
          >
            AI Assistant
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-purple-200 text-purple-900 hover:bg-purple-50 lg:hidden focus-visible:outline-2 focus-visible:outline-purple-700"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-purple-100 bg-white px-4 py-3 lg:hidden">
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleSelect(link.id)}
                  className={`flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'bg-purple-50 text-purple-950 font-semibold'
                      : 'text-slate-700 hover:bg-purple-50/60 hover:text-purple-900'
                  }`}
                >
                  <span>{link.label}</span>
                  {active && <span className="text-xs text-purple-700">Current</span>}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleSelect('assistant')}
              className="mt-2 flex min-h-[44px] items-center justify-center rounded-lg bg-purple-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-900"
            >
              Open HERBIZ AI Assistant
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
