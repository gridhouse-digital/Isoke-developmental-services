import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Clock, DollarSign } from 'lucide-react';
import { FadeIn } from '../components/FadeIn';
import { Button } from '../components/Button';
import { jobs, bambooHRConfig } from '../data/jobs';

const BAMBOO_SCRIPT_ID = 'bamboohr-embed-script';
const BAMBOO_SRC = 'https://isokedevelops.bamboohr.com/js/embed.js';
let bambooHRScriptPromise: Promise<void> | null = null;

function loadBambooHRScript(): Promise<void> {
  if (bambooHRScriptPromise) return bambooHRScriptPromise;

  bambooHRScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(BAMBOO_SCRIPT_ID) as HTMLScriptElement | null;

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load BambooHR script')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = BAMBOO_SCRIPT_ID;
    script.src = BAMBOO_SRC;
    script.async = true;
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => {
      bambooHRScriptPromise = null;
      reject(new Error('Failed to load BambooHR script'));
    }, { once: true });
    document.body.appendChild(script);
  });

  return bambooHRScriptPromise;
}

function rerunBambooHRScript() {
  const script = document.createElement('script');
  script.src = BAMBOO_SRC;
  script.async = true;
  script.dataset.rerun = 'true';
  script.addEventListener('load', () => script.remove(), { once: true });
  script.addEventListener('error', () => script.remove(), { once: true });
  document.body.appendChild(script);
}

function BambooHREmbed() {
  useEffect(() => {
    const container = document.getElementById('BambooHR');
    if (!container) return;
    let cancelled = false;
    let observer: MutationObserver | null = null;

    const openLinksInNewTab = () => {
      container.querySelectorAll('a[href]').forEach((el) => {
        const a = el as HTMLAnchorElement;
        if (!a.target) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
      });
    };

    const dedupeBoards = () => {
      const atsRoots = Array.from(container.querySelectorAll('#BambooHR-ATS'));
      atsRoots.slice(1).forEach((node) => node.remove());

      const boards = Array.from(container.querySelectorAll('.BambooHR-ATS-board'));
      boards.slice(1).forEach((node) => node.remove());

      openLinksInNewTab();
    };

    const hasBoard = () =>
      Boolean(container.querySelector('#BambooHR-ATS, .BambooHR-ATS-board'));

    loadBambooHRScript()
      .then(() => {
        if (cancelled) return;
        if (!hasBoard()) {
          rerunBambooHRScript();
        }
        dedupeBoards();
        observer = new MutationObserver(dedupeBoards);
        observer.observe(container, { childList: true, subtree: true });
      })
      .catch(() => {
        bambooHRScriptPromise = null;
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      id="BambooHR"
      data-domain="isokedevelops.bamboohr.com"
      data-version="1.0.0"
      data-departmentid=""
    />
  );
}

export function Careers() {
  return (
    <section
      id="careers"
      aria-labelledby="careers-heading"
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--cream)' }}
    >
      {/* Gradient rule at top */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(184,159,216,0.25) 40%, rgba(232,149,109,0.25) 70%, transparent)' }} />

      <div className="careers-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 48px 96px' }}>

        {/* Header */}
        <FadeIn>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase' as const, color: '#7B5EA7', marginBottom: 16,
          }}>— 04 / Careers</p>
          <div className="careers-header-row" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 20, marginBottom: 48 }}>
            <h2
              id="careers-heading"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 'clamp(2.2rem, 4.5vw, 3.75rem)',
                fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em',
                color: 'var(--ink)', maxWidth: 460,
              }}
            >
              Make your work<br />
              <em className="not-italic" style={{ color: '#7B5EA7' }}>meaningful.</em>
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--muted)', maxWidth: 300 }}>
              Join a team that shows up with heart every single day.
              We offer competitive pay, flexible schedules, and real growth.
            </p>
          </div>
        </FadeIn>

        {/* Two-column body */}
        <div className="careers-body-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 64px', alignItems: 'start' }}>

          {/* Left — Who We're Looking For */}
          <FadeIn>
            <div
              className="careers-who-card"
              style={{
                padding: '36px 40px',
                borderRadius: 20,
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: '0 2px 16px rgba(123,94,167,0.05)',
              }}
            >
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase' as const,
                color: '#7B5EA7', marginBottom: 14,
              }}>Who We're Looking For</p>
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 15, lineHeight: 1.8,
                color: 'var(--muted)',
                marginBottom: 24,
              }}>
                We welcome professionals who are patient, dependable, and deeply committed to advocating for those we serve.
                Ideal candidates work with integrity—both independently and as part of a team—and help us maintain a safe,
                respectful, and person-centered environment. Whether you're a DSP, LPN, RN, or support staff, your dedication
                is essential to fulfilling our mission.
              </p>
              <p style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 18, fontWeight: 600, lineHeight: 1.5,
                fontStyle: 'italic',
                color: 'var(--ink)',
                borderLeft: '3px solid #7B5EA7',
                paddingLeft: 18,
                marginBottom: 32,
              }}>
                If you're ready to turn your passion into purpose, apply today and be part of something meaningful.
              </p>
              <a
                href="/#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '14px 36px', borderRadius: 12,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
                  color: '#7B5EA7', border: '1px solid rgba(123,94,167,0.3)',
                  background: 'transparent', textDecoration: 'none',
                  transition: 'background 0.18s, border-color 0.18s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(123,94,167,0.12)';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(123,94,167,0.55)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(123,94,167,0.3)';
                }}
              >
                Don't see a fit? Contact us
              </a>
            </div>
          </FadeIn>

          {/* Right — Open Positions */}
          <FadeIn delay={0.1}>
            <div style={{ marginBottom: 2 }}>
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 18, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: 'var(--ink)', marginBottom: 10,
              }}>Open Positions</p>
              <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(123,94,167,0.35), rgba(232,149,109,0.2) 60%, transparent)' }} />
            </div>

            {bambooHRConfig.enabled ? (
              <BambooHREmbed />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {jobs.map((job) => (
                  <motion.a
                    key={job.id}
                    href="https://isokedevelops.bamboohr.com/careers"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ x: 6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="group job-card-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 24,
                      padding: '22px 28px',
                      borderRadius: 18,
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(123,94,167,0.1)',
                      boxShadow: '0 2px 12px rgba(123,94,167,0.04)',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 14, fontWeight: 400,
                        color: 'var(--ink)', marginBottom: 8,
                      }}>{job.title}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px 20px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
                          <MapPin size={11} /> {job.location}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
                          <Clock size={11} /> {job.type}
                        </span>
                        {job.pay && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
                            <DollarSign size={11} /> {job.pay}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="job-card-right" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        color: '#7B5EA7', background: 'rgba(123,94,167,0.08)',
                        padding: '4px 12px', borderRadius: 999,
                      }}>{job.department}</span>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(123,94,167,0.09)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ArrowRight size={15} style={{ color: '#7B5EA7' }} />
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            )}
          </FadeIn>

        </div>
      </div>
    </section>
  );
}
