import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { PageId } from '../types/herbiz';

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

const PRIMARY_LINKS: Array<{ id: PageId; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'dashboard', label: 'Dashboard' },
];

const TOOL_LINKS: Array<{ id: PageId; label: string; description: string }> = [
  {
    id: 'idea-finder',
    label: 'AI Business Idea Finder',
    description: 'Discover business ideas for your budget & skills',
  },
  {
    id: 'plan-generator',
    label: 'AI Business Plan Generator',
    description: 'Create an 8-part plan with a 30-day roadmap',
  },
  {
    id: 'calculator',
    label: 'Profit & Budget Calculator',
    description: 'Estimate monthly profit, margin & break-even',
  },
  {
    id: 'marketing-assistant',
    label: 'AI Marketing Assistant',
    description: 'Generate Instagram, WhatsApp & slogan copy',
  },
  {
    id: 'assessment',
    label: 'Business Assessment',
    description: 'Analyze your current sales, costs & challenge',
  },
  {
    id: 'recommendations',
    label: 'Recommendations',
    description: 'View structured next steps & priorities',
  },
];

const SECONDARY_LINKS: Array<{ id: PageId; label: string }> = [
  { id: 'action-plan', label: 'Progress Tracker' },
  { id: 'resources', label: 'Resources' },
  { id: 'about', label: 'About' },
  { id: 'feedback', label: 'Feedback' },
];

const ALL_MOBILE_LINKS: Array<{ id: PageId; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'dashboard', label: 'Business Dashboard' },
  { id: 'idea-finder', label: 'AI Business Idea Finder' },
  { id: 'plan-generator', label: 'AI Business Plan Generator' },
  { id: 'calculator', label: 'Profit & Budget Calculator' },
  { id: 'marketing-assistant', label: 'AI Marketing Assistant' },
  { id: 'assessment', label: 'Business Assessment' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'action-plan', label: 'Business Progress Tracker' },
  { id: 'resources', label: 'Verified Resources' },
  { id: 'about', label: 'About' },
  { id: 'feedback', label: 'Feedback' },
];

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);

  const isToolActive = TOOL_LINKS.some((t) => t.id === currentPage);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setToolsOpen(false);
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const handleSelect = (page: PageId) => {
    onNavigate(page);
    setMobileOpen(false);
    setToolsOpen(false);
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
          {PRIMARY_LINKS.map((link) => {
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

          {/* Tools Dropdown */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              type="button"
              aria-expanded={toolsOpen}
              aria-haspopup="menu"
              onClick={() => setToolsOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1 py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-700 ${
                isToolActive
                  ? 'border-purple-800 text-purple-900'
                  : 'border-transparent text-slate-600 hover:text-purple-900 hover:border-purple-200'
              }`}
            >
              <span>Business Tools</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {toolsOpen && (
              <div
                role="menu"
                className="absolute left-0 mt-2 w-80 rounded-xl border border-purple-100 bg-white p-2 shadow-lg"
              >
                {TOOL_LINKS.map((item) => {
                  const active = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleSelect(item.id)}
                      className={`flex w-full flex-col rounded-lg px-3.5 py-2.5 text-left transition-colors ${
                        active
                          ? 'bg-purple-50 text-purple-950'
                          : 'text-slate-700 hover:bg-purple-50/70 hover:text-purple-950'
                      }`}
                    >
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="mt-0.5 text-xs text-slate-500">{item.description}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {SECONDARY_LINKS.map((link) => {
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
        <div className="max-h-[80vh] overflow-y-auto border-t border-purple-100 bg-white px-4 py-3 lg:hidden">
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-1">
            {ALL_MOBILE_LINKS.map((link) => {
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
