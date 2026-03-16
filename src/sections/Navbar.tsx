import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Lock, BookOpen, Users2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle';

const staffPortals = [
  {
    icon: BookOpen,
    label: 'Workforce Compliance',
    sublabel: 'Training & governance',
    href: 'https://compliance.isokedevelops.com/',
  },
  {
    icon: Users2,
    label: 'PeopleHub',
    sublabel: 'HR & staff management',
    href: 'https://isokedevelops.bamboohr.com/',
  },
];

interface NavbarProps { isDark: boolean; onToggleTheme: () => void; }

// Helper to derive nav colors based on dark mode and scroll state.
// When not scrolled: navbar is transparent and always over the dark Hero,
// so links must always be white for legibility regardless of mode.
// When scrolled: switch to mode-aware solid background + matching link colors.
function navColors(isDark: boolean, scrolled: boolean) {
  if (isDark) {
    return {
      bg: scrolled ? 'rgba(13,13,15,0.94)' : 'transparent',
      border: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      shadow: scrolled ? '0 4px 40px rgba(0,0,0,0.6)' : 'none',
      linkColor: 'rgba(255,255,255,0.7)',
      linkActive: 'rgba(255,255,255,1)',
      linkHoverBg: 'rgba(255,255,255,0.09)',
      activePill: 'rgba(184,159,216,0.14)',
      staffColor: 'rgba(255,255,255,0.45)',
      staffBorder: 'rgba(255,255,255,0.1)',
      staffHoverColor: 'rgba(255,255,255,0.75)',
      staffHoverBorder: 'rgba(255,255,255,0.22)',
      staffHoverBg: 'rgba(255,255,255,0.05)',
      burgerBorder: 'rgba(255,255,255,0.15)',
      burgerBg: 'rgba(255,255,255,0.07)',
      burgerColor: 'rgba(255,255,255,0.8)',
    };
  }
  // Light mode — when not yet scrolled we're over the dark Hero, so keep white links
  if (!scrolled) {
    return {
      bg: 'transparent',
      border: '1px solid transparent',
      shadow: 'none',
      linkColor: 'rgba(255,255,255,0.75)',
      linkActive: 'rgba(255,255,255,1)',
      linkHoverBg: 'rgba(255,255,255,0.12)',
      activePill: 'rgba(255,255,255,0.1)',
      staffColor: 'rgba(255,255,255,0.5)',
      staffBorder: 'rgba(255,255,255,0.2)',
      staffHoverColor: 'rgba(255,255,255,0.85)',
      staffHoverBorder: 'rgba(255,255,255,0.35)',
      staffHoverBg: 'rgba(255,255,255,0.08)',
      burgerBorder: 'rgba(255,255,255,0.2)',
      burgerBg: 'rgba(255,255,255,0.08)',
      burgerColor: 'rgba(255,255,255,0.85)',
    };
  }
  // Light mode + scrolled: milky cream navbar matching About section background
  return {
    bg: '#F0EBE1',
    border: '1px solid rgba(123,94,167,0.1)',
    shadow: '0 4px 24px rgba(123,94,167,0.08)',
    linkColor: '#7B5EA7',
    linkActive: '#3D23A0',
    linkHoverBg: 'rgba(123,94,167,0.07)',
    activePill: 'rgba(123,94,167,0.1)',
    staffColor: 'rgba(123,94,167,0.55)',
    staffBorder: 'rgba(123,94,167,0.2)',
    staffHoverColor: '#7B5EA7',
    staffHoverBorder: 'rgba(123,94,167,0.4)',
    staffHoverBg: 'rgba(123,94,167,0.06)',
    burgerBorder: 'rgba(123,94,167,0.2)',
    burgerBg: 'rgba(123,94,167,0.05)',
    burgerColor: '#7B5EA7',
  };
}

const links = [
  { label: 'About',    href: '/#about' },
  { label: 'Services', href: '/#services' },
  { label: 'Admissions', href: '/admissions' },
  { label: 'Careers',  href: '/#careers' },
  { label: 'Contact',  href: '/#contact' },
  { label: 'Chat',     href: '#', openChat: true },
];

export function Navbar({ isDark, onToggleTheme }: NavbarProps) {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeId, setActiveId]     = useState<string>('');
  const [staffOpen, setStaffOpen]   = useState(false);
  const staffRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const c = navColors(isDark, scrolled);

  // Close staff dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (staffRef.current && !staffRef.current.contains(e.target as Node)) {
        setStaffOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  // Track which section is in view
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveId('');
      return;
    }

    const ids = links
      .filter(l => l.href.startsWith('/#'))
      .map(l => l.href.replace('/#', ''))
      .filter(Boolean);
    const observers: IntersectionObserver[] = [];
    const visible = new Map<string, number>();

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          visible.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
          // Pick the section with the highest visible ratio
          let best = '';
          let bestRatio = 0;
          visible.forEach((ratio, key) => {
            if (ratio > bestRatio) { bestRatio = ratio; best = key; }
          });
          setActiveId(best);
        },
        { threshold: [0, 0.15, 0.5], rootMargin: '-72px 0px 0px 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [location.pathname]);

  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#') && location.pathname === '/') {
      e.preventDefault();
      document.getElementById(href.replace('/#', ''))?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  };

  return (
    <>
      <header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          transition: 'background 0.35s ease, backdrop-filter 0.35s ease, box-shadow 0.35s ease',
          background: c.bg,
          backdropFilter: (isDark && scrolled) ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: (isDark && scrolled) ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: c.border,
          boxShadow: c.shadow,
        }}
      >
        <nav
          style={{
            maxWidth: 1280, margin: '0 auto',
            padding: '0 48px', height: 72,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link to="/" aria-label="Isoke Developmental Services — Home" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="/isoke logo.png"
              alt="Isoke Developmental Services"
              style={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
            {links.map((link) => {
              const isRouteLink = link.href.startsWith('/') && !link.href.startsWith('/#');
              const id = link.href.startsWith('/#') ? link.href.replace('/#', '') : '';
              const isActive = isRouteLink ? location.pathname === link.href : activeId === id;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if ('openChat' in link && link.openChat) {
                      e.preventDefault()
                      window.dispatchEvent(new CustomEvent('isoke-open-chat'))
                      return
                    }
                    if (isRouteLink) {
                      setMobileOpen(false)
                      return
                    }
                    handleAnchor(e, link.href)
                  }}
                  style={{
                    position: 'relative',
                    padding: '8px 18px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: isActive ? c.linkActive : c.linkColor,
                    textDecoration: 'none',
                    letterSpacing: '0.01em',
                    background: isActive ? c.activePill : 'transparent',
                    transition: 'color 0.2s, background 0.2s, font-weight 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.color = c.linkActive;
                      (e.currentTarget as HTMLAnchorElement).style.background = c.linkHoverBg;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLAnchorElement).style.color = c.linkColor;
                      (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    }
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      bottom: 4, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 18, height: 2,
                      borderRadius: 1,
                      background: 'linear-gradient(90deg, #B89FD8, #E8956D)',
                    }} />
                  )}
                </a>
              );
            })}
          </div>

          {/* Staff portal dropdown — desktop only */}
          <div ref={staffRef} className="hidden md:block" style={{ position: 'relative' }}>
            <button
              onClick={() => setStaffOpen(v => !v)}
              aria-expanded={staffOpen}
              aria-haspopup="true"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 13px',
                borderRadius: 10,
                fontSize: 12.5, fontWeight: 500,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: c.staffColor,
                background: 'transparent',
                border: `1px solid ${c.staffBorder}`,
                cursor: 'pointer',
                letterSpacing: '0.01em',
                transition: 'color 0.2s, background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = c.staffHoverColor;
                (e.currentTarget as HTMLButtonElement).style.borderColor = c.staffHoverBorder;
                (e.currentTarget as HTMLButtonElement).style.background = c.staffHoverBg;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = c.staffColor;
                (e.currentTarget as HTMLButtonElement).style.borderColor = c.staffBorder;
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <Lock size={11} style={{ opacity: 0.6 }} />
              Staff
              <ChevronDown size={11} style={{ opacity: 0.5, transform: staffOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            <AnimatePresence>
              {staffOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    minWidth: 220,
                    background: isDark ? 'rgba(13,13,15,0.96)' : '#F0EBE1',
                    backdropFilter: isDark ? 'blur(24px)' : 'none',
                    WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(123,94,167,0.12)',
                    borderRadius: 14,
                    padding: '6px',
                    boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.5)' : '0 8px 32px rgba(123,94,167,0.12)',
                    zIndex: 60,
                  }}
                >
                  <p style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(123,94,167,0.4)',
                    padding: '8px 12px 4px',
                  }}>Staff Portals</p>
                  {staffPortals.map(({ icon: Icon, label, sublabel, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank" rel="noopener noreferrer"
                      onClick={() => setStaffOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px',
                        borderRadius: 10,
                        textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(123,94,167,0.06)'}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: isDark ? 'rgba(184,159,216,0.1)' : 'rgba(123,94,167,0.08)',
                        border: isDark ? '1px solid rgba(184,159,216,0.18)' : '1px solid rgba(123,94,167,0.18)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={15} style={{ color: isDark ? '#B89FD8' : '#7B5EA7' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.85)' : '#3D23A0', lineHeight: 1.2 }}>{label}</p>
                        <p style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(123,94,167,0.5)', marginTop: 2 }}>{sublabel}</p>
                      </div>
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle isDark={isDark} onToggle={onToggleTheme} lightSurface={!isDark && scrolled} />

            {/* CTA button */}
            <a
              href="/#contact"
              onClick={(e) => handleAnchor(e, '/#contact')}
              className="hidden md:inline-flex"
              style={{
                alignItems: 'center', gap: 8,
                padding: '10px 22px',
                borderRadius: 12,
                fontSize: 13.5, fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: 'white',
                background: 'linear-gradient(135deg, #7B5EA7 0%, #7355D4 100%)',
                textDecoration: 'none',
                letterSpacing: '0.01em',
                boxShadow: '0 4px 18px rgba(123,94,167,0.45)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 24px rgba(123,94,167,0.6)';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 18px rgba(123,94,167,0.45)';
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
              }}
            >
              Get Support
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu" aria-expanded={mobileOpen}
              className="burger-btn md:hidden"
              style={{
                width: 40, height: 40,
                borderRadius: 10, border: `1px solid ${c.burgerBorder}`,
                background: c.burgerBg,
                color: c.burgerColor,
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: 72, left: 0, right: 0, zIndex: 40,
              background: isDark ? 'rgba(13,13,15,0.97)' : '#F0EBE1',
              backdropFilter: isDark ? 'blur(24px)' : 'none',
              WebkitBackdropFilter: isDark ? 'blur(24px)' : 'none',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(123,94,167,0.1)',
              boxShadow: isDark ? 'none' : '0 8px 32px rgba(123,94,167,0.08)',
            }}
            className="md:hidden"
          >
            <nav style={{ padding: '20px 32px 28px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    if ('openChat' in link && link.openChat) {
                      e.preventDefault()
                      setMobileOpen(false)
                      window.dispatchEvent(new CustomEvent('isoke-open-chat'))
                      return
                    }
                    if (link.href.startsWith('/') && !link.href.startsWith('/#')) {
                      setMobileOpen(false)
                      return
                    }
                    handleAnchor(e, link.href)
                  }}
                  style={{
                    padding: '13px 16px', borderRadius: 12,
                    fontSize: 16, fontWeight: 500,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: isDark ? 'rgba(255,255,255,0.75)' : '#7B5EA7',
                    textDecoration: 'none',
                    transition: 'color 0.2s, background 0.2s',
                  }}
                >
                  {link.label}
                </a>
              ))}
              {/* Staff portals — mobile */}
              <div style={{ marginTop: 8, paddingTop: 12, borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(123,94,167,0.08)' }}>
                <p style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase' as const,
                  color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(123,94,167,0.4)',
                  padding: '0 16px 8px',
                }}>Staff Portals</p>
                {staffPortals.map(({ icon: Icon, label, sublabel, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px', borderRadius: 12,
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: 'rgba(123,94,167,0.08)',
                      border: '1px solid rgba(123,94,167,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} style={{ color: '#7B5EA7' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.7)' : '#3D2380', lineHeight: 1.2 }}>{label}</p>
                      <p style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(123,94,167,0.5)', marginTop: 1 }}>{sublabel}</p>
                    </div>
                  </a>
                ))}
              </div>

              <a
                href="/#contact"
                onClick={(e) => handleAnchor(e, '/#contact')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 12, padding: '14px 24px',
                  borderRadius: 12, fontSize: 15, fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: 'white', textDecoration: 'none',
                  background: 'linear-gradient(135deg, #7B5EA7 0%, #7355D4 100%)',
                  boxShadow: '0 4px 18px rgba(123,94,167,0.5)',
                }}
              >
                Get Support
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
