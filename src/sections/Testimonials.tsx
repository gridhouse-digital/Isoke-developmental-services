import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '../components/FadeIn';
import { testimonials } from '../data/testimonials';

const AUTOPLAY_INTERVAL = 5000;

export function Testimonials() {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = (d: 1 | -1) => {
    setDir(d);
    setActive((p) => (p + d + testimonials.length) % testimonials.length);
  };

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setDir(1);
      setActive((p) => (p + 1) % testimonials.length);
    }, AUTOPLAY_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, active]);

  const current = testimonials[active];

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="dark-section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: 'relative',
        padding: '100px 0',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse 80% 60% at 5% 70%, rgba(123,94,167,0.55) 0%, transparent 65%),' +
          'radial-gradient(ellipse 55% 50% at 92% 8%, rgba(184,159,216,0.28) 0%, transparent 60%),' +
          'linear-gradient(162deg, #0e0818 0%, #1E1230 40%, #120a1e 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 48px',
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0 80px',
          alignItems: 'center',
        }}
        className="testimonials-grid"
      >

        {/* LEFT — heading + intro */}
        <FadeIn direction="left">
          <div>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase' as const,
              color: 'rgba(184,159,216,0.7)', marginBottom: 16,
            }}>— 05 / Testimonials</p>

            <h2
              id="testimonials-heading"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 'clamp(1.8rem, 3.2vw, 3rem)',
                fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em',
                color: 'white', marginBottom: 8,
              }}
            >
              Clients are{' '}
              <em className="not-italic" style={{
                background: 'linear-gradient(125deg, #B89FD8 0%, #E8956D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Talking</em>
            </h2>

            <p style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(1.1rem, 1.6vw, 1.4rem)',
              fontStyle: 'italic',
              color: 'rgba(184,159,216,0.85)',
              marginBottom: 24,
              lineHeight: 1.3,
            }}>
              Our Feedbacks
            </p>

            <p style={{
              fontSize: 15, lineHeight: 1.8,
              color: 'rgba(255,255,255,0.5)',
              maxWidth: 380,
              marginBottom: 52,
            }}>
              Discover their stories and how they reflect our commitment to empowering lives and building stronger communities.
            </p>

            {/* Nav controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => go(-1)} aria-label="Previous testimonial"
                style={{
                  width: 48, height: 48, borderRadius: 14, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.55)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(184,159,216,0.2)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(184,159,216,0.4)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#B89FD8';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
                }}
              >
                <ChevronLeft size={20} />
              </button>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    aria-label={'Testimonial ' + (i + 1)}
                    onClick={() => { setDir(i > active ? 1 : -1); setActive(i); }}
                    style={{
                      border: 'none', cursor: 'pointer', borderRadius: 999,
                      width: i === active ? 28 : 8, height: 8,
                      background: i === active ? '#B89FD8' : 'rgba(255,255,255,0.2)',
                      transition: 'all 0.3s',
                      padding: 0,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => go(1)} aria-label="Next testimonial"
                style={{
                  width: 48, height: 48, borderRadius: 14, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.55)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(184,159,216,0.2)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(184,159,216,0.4)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#B89FD8';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </FadeIn>

        {/* RIGHT — testimonial card */}
        <FadeIn direction="right" delay={0.1}>
          <div aria-live="polite" aria-atomic="true">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={active}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -30 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(184,159,216,0.18)',
                  borderRadius: 28,
                  padding: '48px 44px',
                  backdropFilter: 'blur(16px)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative gradient top-right */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 160, height: 160,
                  background: 'radial-gradient(circle, rgba(184,159,216,0.12) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />

                {/* Quote icon */}
                <div style={{ marginBottom: 28 }}>
                  <Quote
                    size={36}
                    style={{
                      color: '#B89FD8',
                      opacity: 0.7,
                      transform: 'scaleX(-1)',
                    }}
                  />
                </div>

                {/* Quote text */}
                <p style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 'clamp(1.05rem, 1.6vw, 1.25rem)',
                  fontWeight: 400, fontStyle: 'italic', lineHeight: 1.75,
                  color: 'rgba(255,255,255,0.88)',
                  marginBottom: 40,
                }}>
                  "{current.quote}"
                </p>

                {/* Divider */}
                <div style={{
                  height: 1,
                  background: 'linear-gradient(90deg, rgba(184,159,216,0.3) 0%, transparent 80%)',
                  marginBottom: 28,
                }} />

                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img
                    src={current.avatarUrl}
                    alt={current.name}
                    style={{
                      width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
                      border: '2px solid rgba(184,159,216,0.45)',
                      boxShadow: '0 0 0 5px rgba(184,159,216,0.08)',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 15, fontWeight: 700,
                      color: 'white', marginBottom: 3, lineHeight: 1,
                    }}>{current.name}</p>
                    <p style={{
                      fontSize: 12, fontWeight: 500,
                      color: 'rgba(184,159,216,0.7)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase' as const,
                    }}>{current.role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </FadeIn>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .testimonials-grid {
            grid-template-columns: 1fr !important;
            gap: 48px 0 !important;
          }
        }
      `}</style>
    </section>
  );
}
