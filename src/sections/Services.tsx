import { useState, useEffect } from 'react';
import { Users, Heart, Stethoscope, Home, RefreshCw, Car, X, ArrowRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '../components/FadeIn';
import { services, type Service } from '../data/services';

const iconMap: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Users, Heart, Stethoscope, Home, RefreshCw, Car,
};

export function Services() {
  const [selected, setSelected] = useState<Service | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <section
        id="services"
        aria-labelledby="services-heading"
        className="dark-section"
        style={{
          position: 'relative',
          padding: '100px 0',
          background:
            'radial-gradient(ellipse 80% 60% at 5% 70%, rgba(123,94,167,0.55) 0%, transparent 65%),' +
            'radial-gradient(ellipse 55% 50% at 92% 8%, rgba(184,159,216,0.28) 0%, transparent 60%),' +
            'radial-gradient(ellipse 45% 45% at 68% 92%, rgba(232,149,109,0.18) 0%, transparent 55%),' +
            'linear-gradient(162deg, #0e0818 0%, #1E1230 40%, #120a1e 100%)',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px' }}>

          {/* Header */}
          <FadeIn>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 24, marginBottom: 64 }}>
              <div>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
                  textTransform: 'uppercase' as const,
                  color: 'rgba(184,159,216,0.7)', marginBottom: 16,
                }}>— 03 / What We Offer</p>
                <h2
                  id="services-heading"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 'clamp(2.2rem, 4.5vw, 3.75rem)',
                    fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em',
                    color: 'white', maxWidth: 460,
                  }}
                >
                  Comprehensive care,{' '}
                  <em className="not-italic" style={{
                    background: 'linear-gradient(125deg, #B89FD8 0%, #E8956D 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>tailored to you.</em>
                </h2>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.48)', maxWidth: 300 }}>
                Every service is designed around the individual — not a program. Click any service to learn more.
              </p>
            </div>
          </FadeIn>

          {/* Card grid */}
          <div
            className="services-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
            }}
          >
            {services.map((service, i) => {
              const Icon = iconMap[service.icon];
              return (
                <FadeIn key={service.id} delay={i * 0.06}>
                  <motion.button
                    whileHover={{ y: -6, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setSelected(service)}
                    aria-label={`Learn more about ${service.title}`}
                    style={{
                      width: '100%',
                      textAlign: 'left' as const,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 24,
                      padding: '32px 28px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'border-color 0.25s, box-shadow 0.25s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = service.accentColor + '40';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 20px 60px ${service.accentColor}18`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* Glow blob */}
                    <div style={{
                      position: 'absolute', top: -40, right: -40,
                      width: 140, height: 140, borderRadius: '50%',
                      background: `radial-gradient(circle, ${service.accentColor}18 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }} />

                    {/* Icon */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 16, marginBottom: 20,
                      background: `${service.accentColor}18`,
                      border: `1px solid ${service.accentColor}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {Icon && <Icon size={22} style={{ color: service.accentColor }} />}
                    </div>

                    {/* Index */}
                    <p style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: 11, fontWeight: 300,
                      color: service.accentColor,
                      opacity: 0.6,
                      letterSpacing: '0.1em',
                      marginBottom: 8,
                    }}>{String(i + 1).padStart(2, '0')}</p>

                    {/* Title */}
                    <h3 style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 17, fontWeight: 700,
                      color: 'rgba(255,255,255,0.95)',
                      marginBottom: 10, lineHeight: 1.3,
                    }}>{service.title}</h3>

                    {/* Tagline */}
                    <p style={{
                      fontSize: 13, fontStyle: 'italic',
                      color: service.accentColor,
                      opacity: 0.75,
                      marginBottom: 14, lineHeight: 1.4,
                    }}>{service.tagline}</p>

                    {/* Short description */}
                    <p style={{
                      fontSize: 13.5, lineHeight: 1.75,
                      color: 'rgba(255,255,255,0.48)',
                      marginBottom: 24,
                    }}>{service.description}</p>

                    {/* CTA */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                      color: service.accentColor,
                    }}>
                      Learn more <ChevronRight size={14} />
                    </div>
                  </motion.button>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal overlay */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelected(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                background: 'rgba(10,6,30,0.82)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />

            {/* Drawer panel */}
            <motion.div
              key="modal"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={selected.title}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(580px, 100vw)',
                zIndex: 9999,
                background: 'linear-gradient(160deg, #110a2e 0%, #120a1e 100%)',
                borderLeft: `1px solid ${selected.accentColor}25`,
                boxShadow: `-40px 0 120px rgba(0,0,0,0.6), inset 1px 0 0 ${selected.accentColor}15`,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header band */}
              <div style={{
                padding: '36px 40px 32px',
                borderBottom: `1px solid rgba(255,255,255,0.06)`,
                position: 'relative',
                flexShrink: 0,
              }}>
                {/* Glow */}
                <div style={{
                  position: 'absolute', top: -60, right: -60,
                  width: 240, height: 240, borderRadius: '50%',
                  background: `radial-gradient(circle, ${selected.accentColor}20 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                {/* Close button */}
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  style={{
                    position: 'absolute', top: 24, right: 28,
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'white';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                  }}
                >
                  <X size={18} />
                </button>

                {/* Icon */}
                <div style={{
                  width: 60, height: 60, borderRadius: 18, marginBottom: 20,
                  background: `${selected.accentColor}18`,
                  border: `1px solid ${selected.accentColor}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {(() => { const Icon = iconMap[selected.icon]; return Icon ? <Icon size={26} style={{ color: selected.accentColor }} /> : null; })()}
                </div>

                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase' as const,
                  color: selected.accentColor, opacity: 0.7, marginBottom: 10,
                }}>Our Services</p>

                <h2 style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                  fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.02em',
                  color: 'white', marginBottom: 10,
                }}>{selected.title}</h2>

                <p style={{
                  fontSize: 14, fontStyle: 'italic',
                  color: selected.accentColor, opacity: 0.8,
                }}>{selected.tagline}</p>
              </div>

              {/* Body */}
              <div style={{ padding: '36px 40px 48px', flex: 1 }}>

                {/* Full description */}
                <p style={{
                  fontSize: 15, lineHeight: 1.85,
                  color: 'rgba(255,255,255,0.65)',
                  marginBottom: 36,
                }}>{selected.details}</p>

                {/* Highlights */}
                <div style={{ marginBottom: 36 }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    color: 'rgba(255,255,255,0.35)',
                    marginBottom: 16,
                  }}>What's Included</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selected.highlights.map((h) => (
                      <div key={h} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <CheckCircle2 size={17} style={{ color: selected.accentColor, flexShrink: 0, marginTop: 1 }} />
                        <p style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.75)' }}>{h}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Who it helps */}
                <div style={{
                  background: `${selected.accentColor}0e`,
                  border: `1px solid ${selected.accentColor}22`,
                  borderRadius: 16, padding: '20px 22px',
                  marginBottom: 36,
                }}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                    textTransform: 'uppercase' as const,
                    color: selected.accentColor, opacity: 0.7, marginBottom: 8,
                  }}>Who This Serves</p>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.65)' }}>
                    {selected.whoItHelps}
                  </p>
                </div>

                {/* CTA */}
                <a
                  href="#contact"
                  onClick={() => setSelected(null)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: '15px 28px',
                    background: `linear-gradient(135deg, ${selected.accentColor}, ${selected.accentColor}bb)`,
                    borderRadius: 14,
                    fontSize: 14, fontWeight: 700,
                    color: '#0e0818',
                    textDecoration: 'none',
                    transition: 'opacity 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
                >
                  Get Started <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Responsive grid */}
      <style>{`
        @media (max-width: 1024px) {
          .services-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .services-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
