import { FadeIn } from '../components/FadeIn';

const ABOUT_IMAGE = '/images/black-girl-yellow-shirt.jpg';

export function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--cream)' }}
    >
      {/* Top rule */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(184,159,216,0.25) 40%, rgba(232,149,109,0.25) 70%, transparent)' }} />

      <div className="about-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 48px 112px' }}>

        {/* Section label */}
        <FadeIn>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase' as const,
            color: '#7B5EA7', marginBottom: 20,
          }}>— 02 / Our Story</p>
        </FadeIn>

        {/* Heading row */}
        <FadeIn delay={0.06}>
          <div className="about-heading-row" style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 40, flexWrap: 'wrap' as const,
            borderBottom: '1px solid rgba(123,94,167,0.1)',
          }}>
            <h2
              id="about-heading"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 'clamp(2.4rem, 5vw, 4.25rem)',
                fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.03em',
                color: 'var(--ink)', flex: '1 1 340px',
              }}
            >
              Committed to<br />
              <em className="not-italic" style={{ color: '#7B5EA7' }}>Empowering Lives.</em>
            </h2>

            {/* Outlined accent word */}
            <div className="about-stat-numeral-block" style={{ textAlign: 'right' as const, flexShrink: 0 }}>
              <p style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 88, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em',
                color: 'transparent',
                WebkitTextStroke: '1.5px rgba(123,94,167,0.15)',
                marginBottom: 4,
              }}>PA</p>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--muted)' }}>
                Statewide service
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Two-column body — image | text */}
        <div className="about-grid" style={{
          display: 'grid',
          gridTemplateColumns: '5fr 7fr',
          gap: '0 64px',
          alignItems: 'start',
        }}>

          {/* Image column */}
          <FadeIn direction="left">
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 28, overflow: 'hidden', aspectRatio: '4/5', position: 'relative' }}>
                <img
                  src={ABOUT_IMAGE}
                  alt="A care professional working warmly with a client"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
                />
                {/* Overlay gradient */}
                <div className="about-img-overlay" style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(27,16,53,0.45) 0%, transparent 50%)',
                  pointerEvents: 'none',
                }} />
              </div>

              {/* Floating badge — bottom right of image */}
              <div className="about-badge" style={{
                position: 'absolute', bottom: -24, right: -20,
                background: 'linear-gradient(135deg, #7B5EA7, #8B6EE8)',
                borderRadius: 20, padding: '20px 26px',
                boxShadow: '0 20px 56px rgba(123,94,167,0.5)',
              }}>
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 700, color: 'white', lineHeight: 1 }}>PA</p>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.72)', marginTop: 5 }}>Licensed</p>
              </div>
            </div>
          </FadeIn>

          {/* Text column */}
          <FadeIn direction="right" delay={0.14}>
            <div style={{ paddingTop: 16, paddingLeft: 8 }}>

              {/* Pull quote — name meaning */}
              <blockquote className="about-blockquote" style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 'clamp(1.2rem, 1.9vw, 1.5rem)',
                fontWeight: 400, fontStyle: 'italic', lineHeight: 1.6,
                color: 'var(--ink)', opacity: 0.85,
                marginBottom: 36,
                borderLeft: '3px solid rgba(123,94,167,0.3)',
                paddingLeft: 24,
              }}>
                "Isoke" is a name of African origin meaning "a gift from God" — and that's
                exactly how we see every individual we serve, and every team member who supports them.
              </blockquote>

              <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--muted)', marginBottom: 22 }}>
                <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Our Mission:</span>{' '}
                Grounded in compassion, dignity, and dedication, we partner with individuals and
                families to create customized, person-centered care plans that strengthen community
                connections and promote independence at every stage of life.
              </p>

              <p style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--muted)', marginBottom: 52 }}>
                <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Our Vision:</span>{' '}
                To be a catalyst for positive change, empowering individuals to
                thrive in safe, respectful, and loving environments — across Pennsylvania.
              </p>

              {/* Stat strip */}
              <div className="about-stat-strip" style={{
                display: 'flex',
                borderRadius: 18, overflow: 'hidden',
                border: '1px solid rgba(123,94,167,0.12)',
                background: 'rgba(255,255,255,0.5)',
              }}>
                {[
                  { num: '100%', label: 'Person-Centered' },
                  { num: '24/7', label: 'Support' },
                  { num: 'PA', label: 'Statewide' },
                ].map(({ num, label }, i) => (
                  <div
                    key={num}
                    className="about-stat-strip-cell"
                    style={{
                      flex: 1, textAlign: 'center' as const,
                      padding: '22px 12px',
                      borderLeft: i > 0 ? '1px solid rgba(123,94,167,0.1)' : 'none',
                      background: i === 1 ? 'rgba(123,94,167,0.05)' : 'transparent',
                    }}
                  >
                    <p style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: 30, fontWeight: 700,
                      color: '#7B5EA7', lineHeight: 1, marginBottom: 7,
                    }}>{num}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--muted)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
