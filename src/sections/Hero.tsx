import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';

const SLIDES = [
  {
    image: '/images/1.png',
    headline: 'Empowering',
    accent: 'Every Ability.',
    sub: 'Person-centered support for individuals with intellectual and developmental disabilities — building independence, dignity, and joy.',
  },
  {
    image: '/images/2.png',
    headline: 'Rooted in',
    accent: 'Compassion.',
    sub: 'Our team builds genuine, lasting relationships — treating every individual as the gift they truly are.',
  },
  {
    image: '/images/3.png',
    headline: 'Building',
    accent: 'Independence.',
    sub: 'From in-home support to community participation — we walk alongside individuals at every stage of life.',
  },
  {
    image: '/images/4.jpeg',
    headline: 'Care that',
    accent: 'Feels Like Home.',
    sub: 'Collaborative, trauma-informed support that centers each person’s strengths, culture, and goals.',
  },
];

const INTERVAL = 6000;
const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  // Auto-advance
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setActive((p) => (p + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused, active]);

  const slide = SLIDES[active];

  return (
    <section
      className="dark-section"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse 80% 60% at 5% 70%, rgba(123,94,167,0.55) 0%, transparent 65%),' +
          'radial-gradient(ellipse 55% 50% at 92% 8%, rgba(184,159,216,0.28) 0%, transparent 60%),' +
          'radial-gradient(ellipse 45% 45% at 68% 92%, rgba(232,149,109,0.18) 0%, transparent 55%),' +
          'linear-gradient(162deg, #0e0818 0%, #1E1230 40%, #120a1e 100%)',
      }}
      aria-label="Hero"
    >
      {/* Sliding background images */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active}
          aria-hidden="true"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.1, ease }}
          style={{
            position: 'absolute',
            top: 0, bottom: 0, right: 0,
            width: '55%',
            zIndex: 0,
          }}
          className="hero-image-panel"
        >
          <img
            src={slide.image}
            alt=""
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center top',
              opacity: 0.22, mixBlendMode: 'luminosity',
            }}
          />
          {/* Left fade */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: '60%',
            background: 'linear-gradient(to right, #0e0818 0%, transparent 100%)',
          }} />
          {/* Bottom fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 200,
            background: 'linear-gradient(to top, #1E1230 0%, transparent 100%)',
          }} />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div
        className="hero-content-wrap"
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: 1280,
          margin: '0 auto',
          padding: '160px 48px 80px',
        }}
      >
        <div style={{ maxWidth: 620 }}>

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}
          >
            <div style={{ width: 28, height: 1, background: 'rgba(184,159,216,0.7)', flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(184,159,216,0.85)',
            }}>Pennsylvania's trusted IDD provider</span>
          </motion.div>

          {/* Headline — animates on slide change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active + '-text'}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease }}
            >
              <h1
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 'clamp(2.8rem, 6vw, 6rem)',
                  fontWeight: 700,
                  lineHeight: 1.03,
                  letterSpacing: '0.01em',
                  color: 'white',
                  marginBottom: 24,
                }}
              >
                {slide.headline}<br />
                <em className="not-italic" style={{
                  background: 'linear-gradient(125deg, #B89FD8 0%, #E8956D 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>{slide.accent}</em>
              </h1>

              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 18, lineHeight: 1.75,
                  color: 'rgba(255,255,255,0.55)',
                  maxWidth: 440, marginBottom: 36,
                }}
              >
                {slide.sub}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.46, ease }}
            className="hero-cta-row"
            style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 14, marginBottom: 56 }}
          >
            <button
              onClick={() => scrollTo('contact')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 32px',
                borderRadius: 14, border: 'none', cursor: 'pointer',
                fontSize: 16, fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.01em',
                color: 'white',
                background: 'linear-gradient(135deg, #7B5EA7 0%, #9070BF 60%, #9070BF 100%)',
                boxShadow: '0 8px 32px rgba(123,94,167,0.55), 0 2px 8px rgba(123,94,167,0.3)',
                transition: 'box-shadow 0.25s ease, transform 0.2s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(123,94,167,0.7), 0 2px 8px rgba(123,94,167,0.4)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(123,94,167,0.55), 0 2px 8px rgba(123,94,167,0.3)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              Get Support <ArrowRight size={17} />
            </button>

            <button
              onClick={() => scrollTo('careers')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '16px 32px',
                borderRadius: 14, cursor: 'pointer',
                fontSize: 16, fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.01em',
                color: 'rgba(255,255,255,0.88)',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                transition: 'background 0.25s ease, border-color 0.25s ease, transform 0.2s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              <Users size={17} /> Join Our Team
            </button>
          </motion.div>

          {/* Stats + slide dots */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.58, ease }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 28,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              flexWrap: 'wrap' as const,
              gap: 20,
            }}
          >
            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[
                { num: '10+', label: 'Years of service' },
                { num: '24/7', label: 'Support available' },
                { num: 'PA', label: 'Licensed statewide' },
              ].map(({ num, label }, i) => (
                <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
                  {i > 0 && <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)', margin: '0 28px' }} />}
                  <div>
                    <p style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: 26, fontWeight: 700,
                      color: '#B89FD8', lineHeight: 1, marginBottom: 5,
                    }}>{num}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Slide indicators */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => { setActive(i); setPaused(true); setTimeout(() => setPaused(false), 8000); }}
                  style={{
                    border: 'none', cursor: 'pointer', borderRadius: 999, padding: 0,
                    width: i === active ? 28 : 8, height: 8,
                    background: i === active ? '#B89FD8' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </motion.div>

        </div>
      </div>

      {/* Bottom fade */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, zIndex: 5,
          background: 'linear-gradient(to bottom, transparent, #1E1230)',
          pointerEvents: 'none',
        }}
      />

      {/* Scroll indicator */}
      <motion.button
        aria-label="Scroll down"
        onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          padding: 8,
        }}
      >
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: 'rgba(184,159,216,0.6)',
        }}>Scroll</span>
        <div style={{
          width: 26, height: 42, borderRadius: 13,
          border: '1.5px solid rgba(184,159,216,0.35)',
          display: 'flex', justifyContent: 'center', paddingTop: 6,
        }}>
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [0.7, 0.2, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 4, height: 8, borderRadius: 2,
              background: 'rgba(184,159,216,0.7)',
            }}
          />
        </div>
      </motion.button>
    </section>
  );
}
