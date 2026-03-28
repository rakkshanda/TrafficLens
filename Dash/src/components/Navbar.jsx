import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Sun, Moon, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard' },
];

export default function Navbar({ darkMode, onToggleTheme }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-bg-primary/90 backdrop-blur-xl border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.2)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" onClick={closeMobile} className="flex items-center gap-2.5 no-underline group">
          <div className="relative">
            <Shield className="w-7 h-7 text-accent transition-transform duration-200 group-hover:scale-105" />
            <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">
            Traffic<span className="text-accent">Lens</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 no-underline ${
                location.pathname === link.to
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
              {location.pathname === link.to && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-accent rounded-full" />
              )}
            </Link>
          ))}

          <div className="w-px h-5 bg-border mx-2" />

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg transition-colors duration-150 cursor-pointer text-text-secondary hover:text-text-primary hover:bg-bg-card btn-press"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            to="/dashboard"
            className="ml-2 px-4 py-2 rounded-lg text-sm font-semibold bg-accent text-text-inverse no-underline transition-all duration-150 hover:bg-accent-hover btn-press"
          >
            Open Dashboard
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-1">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="p-2 rounded-lg transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-bg-card/95 backdrop-blur-xl px-6 py-3 flex flex-col gap-1 animate-fade-in">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMobile}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                location.pathname === link.to
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/dashboard"
            onClick={closeMobile}
            className="mt-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-accent text-text-inverse no-underline text-center btn-press"
          >
            Open Dashboard
          </Link>
        </div>
      )}
    </nav>
  );
}
