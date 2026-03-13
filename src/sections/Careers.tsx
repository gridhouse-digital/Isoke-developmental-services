import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { FadeIn } from '../components/FadeIn';
import { bambooHRConfig, jobs, type Job } from '../data/jobs';

type JobsState =
  | { mode: 'loading'; jobs: Job[]; notice: string }
  | { mode: 'live'; jobs: Job[]; notice: string }
  | { mode: 'fallback'; jobs: Job[]; notice: string };

let cachedBambooJobs: Job[] | null = null;

function normalizeApplyUrl(href: string | null): string {
  if (!href) {
    return bambooHRConfig.boardUrl;
  }

  if (href.startsWith('//')) {
    return `https:${href}`;
  }

  if (href.startsWith('/')) {
    return `https://${bambooHRConfig.companyDomain}${href}`;
  }

  return href;
}

function parseBambooJobs(html: string): Job[] {
  const documentParser = new DOMParser();
  const parsedDocument = documentParser.parseFromString(html, 'text/html');
  const departmentItems = Array.from(
    parsedDocument.querySelectorAll<HTMLElement>('.BambooHR-ATS-Department-Item')
  );

  const fallbackById = new Map(jobs.map((job) => [job.id, job]));
  const parsedJobs: Job[] = [];

  for (const departmentItem of departmentItems) {
    const department =
      departmentItem.querySelector<HTMLElement>('.BambooHR-ATS-Department-Header')?.textContent?.trim() ||
      'Open Positions';

    const positionItems = Array.from(
      departmentItem.querySelectorAll<HTMLElement>('.BambooHR-ATS-Jobs-Item')
    );

    for (const positionItem of positionItems) {
      const link = positionItem.querySelector<HTMLAnchorElement>('a[href]');
      if (!link) {
        continue;
      }

      const idMatch = positionItem.id.match(/(\d+)$/) || link.getAttribute('href')?.match(/\/careers\/(\d+)/);
      const id = idMatch?.[1];
      if (!id) {
        continue;
      }

      const fallbackJob = fallbackById.get(id);
      const location =
        positionItem.querySelector<HTMLElement>('.BambooHR-ATS-Location')?.textContent?.trim() ||
        fallbackJob?.location ||
        'Pennsylvania';

      parsedJobs.push({
        id,
        title: link.textContent?.trim() || fallbackJob?.title || 'Open Position',
        location,
        type: fallbackJob?.type || 'Contract',
        department: department || fallbackJob?.department || 'Open Positions',
        applyUrl: normalizeApplyUrl(link.getAttribute('href')),
      });
    }
  }

  return parsedJobs;
}

async function fetchBambooJobs(signal: AbortSignal): Promise<Job[]> {
  if (cachedBambooJobs) {
    return cachedBambooJobs;
  }

  const response = await fetch(bambooHRConfig.embedUrl, {
    cache: 'no-store',
    mode: 'cors',
    signal,
  });

  if (!response.ok) {
    throw new Error(`BambooHR request failed with ${response.status}`);
  }

  const html = await response.text();
  const parsedJobs = parseBambooJobs(html);

  if (!parsedJobs.length) {
    throw new Error('BambooHR returned an empty job board');
  }

  cachedBambooJobs = parsedJobs;
  return parsedJobs;
}

function JobCard({ job }: { job: Job }) {
  return (
    <motion.a
      href={job.applyUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ x: 6 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="group job-card-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '22px 24px',
        borderRadius: 18,
        background: 'rgba(255,255,255,0.74)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(123,94,167,0.12)',
        boxShadow: '0 6px 24px rgba(123,94,167,0.06)',
        textDecoration: 'none',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.45,
            color: 'var(--ink)',
            marginBottom: 10,
          }}
        >
          {job.title}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            <MapPin size={12} />
            {job.location}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            <Clock size={12} />
            {job.type}
          </span>
        </div>
      </div>

      <div
        className="job-card-right"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#7B5EA7',
            background: 'rgba(123,94,167,0.08)',
            padding: '5px 12px',
            borderRadius: 999,
          }}
        >
          {job.department}
        </span>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'rgba(123,94,167,0.09)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowRight size={16} style={{ color: '#7B5EA7' }} />
        </div>
      </div>
    </motion.a>
  );
}

function BambooHRJobs() {
  const [state, setState] = useState<JobsState>(() => {
    if (!bambooHRConfig.enabled) {
      return {
        mode: 'fallback',
        jobs,
        notice: 'BambooHR is disabled right now. Browse the direct posting links below.',
      };
    }

    if (cachedBambooJobs) {
      return {
        mode: 'live',
        jobs: cachedBambooJobs,
        notice: 'Current openings are listed below.',
      };
    }

    return {
      mode: 'loading',
      jobs,
      notice: 'Loading live openings from BambooHR. Direct links are available below in the meantime.',
    };
  });

  useEffect(() => {
    if (!bambooHRConfig.enabled || cachedBambooJobs) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 9000);

    fetchBambooJobs(controller.signal)
      .then((liveJobs) => {
        setState({
          mode: 'live',
          jobs: liveJobs,
          notice: 'Current openings are listed below.',
        });
      })
      .catch(() => {
        setState({
          mode: 'fallback',
          jobs,
          notice: 'We could not refresh BambooHR just now. These backup links still open each posting directly.',
        });
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      style={{
        borderRadius: 24,
        padding: 24,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.46) 100%)',
        border: '1px solid rgba(123,94,167,0.12)',
        boxShadow: '0 14px 40px rgba(123,94,167,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.2,
              color: 'var(--ink)',
              marginBottom: 6,
            }}
          >
            Open Positions
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
            Every listing below links to the specific BambooHR posting, not the general board.
          </p>
        </div>
      </div>

      <div
        aria-live="polite"
        className="careers-sync-note"
        style={{
          marginBottom: 18,
          padding: '14px 16px',
          borderRadius: 16,
          background: 'rgba(245,240,236,0.82)',
          border: '1px solid rgba(123,94,167,0.08)',
          fontSize: 13,
          lineHeight: 1.7,
          color: 'var(--muted)',
        }}
      >
        {state.notice}
      </div>

      <div className="jobs-scroll-panel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {state.jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Careers() {
  return (
    <section
      id="careers"
      aria-labelledby="careers-heading"
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--cream)' }}
    >
      <div
        style={{
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(184,159,216,0.25) 40%, rgba(232,149,109,0.25) 70%, transparent)',
        }}
      />

      <div className="careers-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 48px 96px' }}>
        <FadeIn>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#7B5EA7',
              marginBottom: 16,
            }}
          >
            04 / Careers
          </p>

          <div
            className="careers-header-row"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
              marginBottom: 48,
            }}
          >
            <h2
              id="careers-heading"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 'clamp(2.2rem, 4.5vw, 3.75rem)',
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                color: 'var(--ink)',
                maxWidth: 460,
              }}
            >
              Make your work
              <br />
              <em className="not-italic" style={{ color: '#7B5EA7' }}>
                meaningful.
              </em>
            </h2>

            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--muted)', maxWidth: 320 }}>
              Join a team that shows up with heart every single day. We offer flexible schedules, direct pathways
              into BambooHR, and room to grow with the people we serve.
            </p>
          </div>
        </FadeIn>

        <div
          className="careers-body-cols"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.06fr)',
            gap: '0 64px',
            alignItems: 'start',
          }}
        >
          <FadeIn>
            <div
              className="careers-who-card"
              style={{
                padding: '36px 40px',
                borderRadius: 24,
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                boxShadow: '0 10px 32px rgba(123,94,167,0.06)',
              }}
            >
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#7B5EA7',
                  marginBottom: 14,
                }}
              >
                Who We&apos;re Looking For
              </p>

              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: 'var(--muted)',
                  marginBottom: 24,
                }}
              >
                We welcome professionals who are patient, dependable, and deeply committed to advocating for the
                people we serve. The strongest candidates move with integrity, work calmly under pressure, and help us
                maintain a safe, respectful, person-centered environment every day.
              </p>

              <p
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  fontStyle: 'italic',
                  color: 'var(--ink)',
                  borderLeft: '3px solid #7B5EA7',
                  paddingLeft: 18,
                  marginBottom: 28,
                }}
              >
                If you are ready to turn your care into lasting impact, there is room for you here.
              </p>

              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  marginBottom: 30,
                }}
              >
                {[
                  'Compassionate team players who communicate clearly.',
                  'Clinicians and support staff who value consistency and dignity.',
                  'People who want a direct, low-friction path from interest to application.',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 16,
                      background: 'rgba(123,94,167,0.05)',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: '#7B5EA7',
                        marginTop: 8,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink)' }}>{item}</span>
                  </div>
                ))}
              </div>

              <a
                href="/#contact"
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px 24px',
                  borderRadius: 12,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  color: '#7B5EA7',
                  border: '1px solid rgba(123,94,167,0.3)',
                  background: 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.18s, border-color 0.18s',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = 'rgba(123,94,167,0.12)';
                  event.currentTarget.style.borderColor = 'rgba(123,94,167,0.55)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = 'transparent';
                  event.currentTarget.style.borderColor = 'rgba(123,94,167,0.3)';
                }}
              >
                Do not see a fit? Contact us
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <BambooHRJobs />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
