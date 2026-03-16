import { useEffect } from 'react';
import { ArrowUpRight, CheckCircle2, ClipboardList, Clock3, Download, FileText, HeartHandshake, Mail, Phone, ShieldCheck } from 'lucide-react';
import { FadeIn } from '../components/FadeIn';
import { useDocumentMeta } from '../lib/useDocumentMeta';

const ADMISSIONS_IFRAME_ID = 'JotFormIFrame-019cf870a8057fc2a0ad3cc7a2b1608883db';
const ADMISSIONS_FORM_URL =
  'https://agent.jotform.com/019cf870a8057fc2a0ad3cc7a2b1608883db?embedMode=iframe&autofocus=0&background=1&shadow=1';
const JOTFORM_EMBED_SCRIPT_SRC = 'https://cdn.jotfor.ms/s/umd/cc2ecae19c2/for-form-embed-handler.js';
const ADMISSIONS_PACKET_URL = '/documents/isoke-admissions-packet.pdf';
const PAGE_WRAP = { maxWidth: 1240, margin: '0 auto', padding: '0 clamp(20px, 4vw, 48px)' } as const;

declare global {
  interface Window {
    jotformEmbedHandler?: (selector: string, domain: string) => void;
  }
}

const steps = [
  {
    description:
      'Complete the secure online admissions form, or call us and we will complete it with you over the phone.',
    title: '1. Share your info',
  },
  {
    description:
      'We review the packet, coordinate with the Supports Coordinator when needed, and confirm eligibility and service fit.',
    title: '2. We review and follow up',
  },
  {
    description:
      'We align with the ISP, talk through schedules, and match services and staffing based on the participant’s needs.',
    title: '3. Plan services together',
  },
];

const checklistItems = [
  'Participant full name, date of birth, address, and contact information',
  'Waiver program details: Consolidated, P/FDS, Community Living, or other',
  'Supports Coordinator agency name and contact details',
  'Insurance provider information',
  'Primary caregiver or natural supports contact information',
  'Physician details and emergency contact information',
];

const policyItems = [
  'Participant Rights & Responsibilities',
  'Nondiscrimination',
  'Civil Rights Compliance',
  'Complaint & Grievance Policy',
  'HIPAA Notice of Privacy Practices',
  'Photo / Media Consent',
];

function PageHero() {
  const scrollToForm = () => {
    document.getElementById('admissions-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      className="gradient-mesh"
      style={{
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 'calc(72px + clamp(28px, 5vw, 48px))',
        paddingBottom: 'clamp(56px, 8vw, 88px)',
      }}
    >
      <div style={PAGE_WRAP}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 'clamp(18px, 3vw, 28px)',
            alignItems: 'stretch',
          }}
        >
          <FadeIn>
            <div
              style={{
                padding: 'clamp(22px, 4vw, 36px)',
                borderRadius: 30,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 22px 48px rgba(8, 6, 18, 0.22)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}
            >
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.72)',
                  marginBottom: 16,
                }}
              >
                Admissions
              </p>
              <h1
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 'clamp(2.7rem, 5vw, 4.6rem)',
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  color: 'white',
                  marginBottom: 18,
                  maxWidth: '13ch',
                  textWrap: 'balance',
                }}
              >
                Start admissions with clarity, not paperwork chaos.
              </h1>
              <p
                style={{
                  maxWidth: 690,
                  marginBottom: 26,
                  color: 'rgba(255,255,255,0.76)',
                  fontSize: 16.5,
                  lineHeight: 1.75,
                }}
              >
                Begin the admissions process for yourself, a loved one, or while speaking with an Isoke staff member.
                Submit the online packet, call us to complete it together, or download the PDF packet if a manual path
                works better.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                <button
                  type="button"
                  onClick={scrollToForm}
                  style={{
                    padding: '14px 24px',
                    borderRadius: 14,
                    border: 'none',
                    background: 'linear-gradient(135deg, #E8956D 0%, #D66F46 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 12px 26px rgba(232,149,109,0.28)',
                    display: 'inline-flex',
                    flex: '1 1 220px',
                    justifyContent: 'center',
                  }}
                >
                  Start admissions online
                </button>
                <a
                  href={ADMISSIONS_PACKET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '14px 22px',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.16)',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 14,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    flex: '1 1 220px',
                    justifyContent: 'center',
                  }}
                >
                  <Download size={15} />
                  Download packet
                </a>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 18,
                  flexWrap: 'wrap',
                  color: 'rgba(255,255,255,0.72)',
                  fontSize: 13.5,
                }}
              >
                <a
                  href="tel:+18444765313"
                  style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <Phone size={14} />
                  Call 1-(844)-ISOKE-13
                </a>
                <a
                  href="mailto:intake@isokedevelops.com"
                  style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <Mail size={14} />
                  intake@isokedevelops.com
                </a>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div
              style={{
                height: '100%',
                padding: 'clamp(20px, 3vw, 28px)',
                borderRadius: 30,
                background: 'rgba(14,10,24,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 22px 48px rgba(8, 6, 18, 0.22)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                display: 'grid',
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 12px',
                    borderRadius: 999,
                    background: 'rgba(184,159,216,0.12)',
                    color: '#E8DFFF',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 14,
                  }}
                >
                  <ShieldCheck size={14} />
                  Quick guidance
                </div>
                <h2 style={{ fontSize: 26, lineHeight: 1.15, color: '#F5F0EC', marginBottom: 8 }}>
                  The fastest ways to begin.
                </h2>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(245,240,236,0.72)' }}>
                  Use the online packet if you are ready, or contact Isoke directly if you want guided help with the
                  process.
                </p>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B89FD8', marginBottom: 8 }}>
                  Business hours
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F5F0EC', marginBottom: 4 }}>Mon–Fri, 8:30–5</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(245,240,236,0.72)' }}>
                  Call the office line and a team member can complete admissions with the family.
                </div>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#B89FD8', marginBottom: 8 }}>
                  After-hours support
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.55, color: '#F5F0EC' }}>
                  1-(844)-ISOKE-13 | (844)-476-5313
                </div>
                <div style={{ marginTop: 8, fontSize: 13.5, lineHeight: 1.6, color: 'rgba(245,240,236,0.72)' }}>
                  Emergency After Hours (urgent health/safety only): 267-983-8856
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  description?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <FadeIn>
      <div style={{ maxWidth: 780, marginBottom: 28 }}>
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#7B5EA7',
            marginBottom: 12,
          }}
        >
          {eyebrow}
        </p>
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(2rem, 3.8vw, 3.3rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            marginBottom: description ? 14 : 0,
          }}
        >
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: 15.5, lineHeight: 1.75, color: 'var(--muted)', maxWidth: 700 }}>{description}</p>
        )}
      </div>
    </FadeIn>
  );
}

export function AdmissionsPage() {
  useEffect(() => {
    const initializeEmbed = () => {
      window.jotformEmbedHandler?.(`iframe[id='${ADMISSIONS_IFRAME_ID}']`, 'https://www.jotform.com');
    };

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${JOTFORM_EMBED_SCRIPT_SRC}"]`);
    if (existingScript) {
      if (window.jotformEmbedHandler) {
        initializeEmbed();
      } else {
        existingScript.addEventListener('load', initializeEmbed, { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = JOTFORM_EMBED_SCRIPT_SRC;
    script.async = true;
    script.addEventListener('load', initializeEmbed, { once: true });
    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', initializeEmbed);
    };
  }, []);

  useDocumentMeta({
    title: 'Admissions | Isoke Developmental Services',
    description:
      'Start admissions with Isoke Developmental Services. Complete the online packet, call our team, or download the admissions packet PDF.',
    canonical: 'https://isokedevelops.com/admissions',
  });

  return (
    <main>
      <PageHero />

      <section style={{ background: 'var(--cream)', padding: 'clamp(56px, 8vw, 84px) 0' }}>
        <div style={PAGE_WRAP}>
          <SectionHeading
            eyebrow="How It Works"
            title="A clear admissions path for families and staff."
            description="This process is designed for family self-submission and for Isoke staff completing the packet with a family over the phone or in person."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {steps.map((step, index) => (
              <FadeIn key={step.title} delay={index * 0.08}>
                <div
                  style={{
                    height: '100%',
                    padding: 26,
                    borderRadius: 22,
                    background: 'rgba(255,255,255,0.86)',
                    border: '1px solid rgba(123,94,167,0.12)',
                    boxShadow: '0 16px 36px rgba(30,18,48,0.05)',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      background: 'rgba(123,94,167,0.1)',
                      color: '#7B5EA7',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      marginBottom: 16,
                    }}
                  >
                    {index + 1}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--muted)' }}>{step.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.18}>
            <div
              style={{
                marginTop: 18,
                padding: '14px 18px',
                borderRadius: 18,
                border: '1px solid rgba(123,94,167,0.1)',
                background: 'rgba(123,94,167,0.05)',
                color: 'var(--ink)',
                fontSize: 14,
              }}
            >
              This process is intended to align with ODP and Chapter 6100 admissions expectations while still keeping
              the experience approachable and supportive.
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="admissions-form" style={{ background: 'white', padding: 'clamp(56px, 8vw, 88px) 0' }}>
        <div style={PAGE_WRAP}>
          <SectionHeading
            eyebrow="Online Packet"
            title="Complete the Admissions Packet Online"
            description="Use the secure form below to begin admissions. If the form does not load, open it in a new tab or call us and a team member will complete it with you."
          />

          <FadeIn>
            <div
              style={{
                padding: 20,
                borderRadius: 28,
                background:
                  'linear-gradient(180deg, rgba(250,246,255,0.96) 0%, rgba(255,255,255,0.98) 100%)',
                border: '1px solid rgba(123,94,167,0.12)',
                boxShadow: '0 18px 48px rgba(30,18,48,0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 18,
                  flexWrap: 'wrap',
                  marginBottom: 16,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                    Jotform admissions embed
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                    The admissions assistant is embedded below. If it does not load correctly, open it in a new tab.
                  </div>
                </div>
                <a
                  href={ADMISSIONS_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 16px',
                    borderRadius: 999,
                    border: '1px solid rgba(123,94,167,0.16)',
                    background: 'rgba(255,255,255,0.78)',
                    color: '#7B5EA7',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 13.5,
                  }}
                >
                  Open in a new tab
                  <ArrowUpRight size={14} />
                </a>
              </div>

              <div
                style={{
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: '1px solid rgba(123,94,167,0.1)',
                  background: 'white',
                }}
              >
                <iframe
                  id={ADMISSIONS_IFRAME_ID}
                  src={ADMISSIONS_FORM_URL}
                  title="Avery: Intake Assistant"
                  allow="geolocation; microphone; camera; fullscreen"
                  width="100%"
                  height="688"
                  frameBorder="0"
                  scrolling="no"
                  style={{ maxWidth: '100%', height: 688, border: 'none', width: '100%', display: 'block', background: 'white' }}
                />
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    padding: '13px 15px',
                    borderRadius: 16,
                    background: 'rgba(123,94,167,0.06)',
                    color: 'var(--ink)',
                    fontSize: 13.5,
                    lineHeight: 1.65,
                  }}
                >
                  You can pause and return later using Jotform’s save feature if it is enabled on the final form.
                </div>
                <div
                  style={{
                    padding: '13px 15px',
                    borderRadius: 16,
                    background: 'rgba(232,149,109,0.08)',
                    color: 'var(--ink)',
                    fontSize: 13.5,
                    lineHeight: 1.65,
                  }}
                >
                  Prefer not to fill it out alone? Call us and a team member can complete it with you over the phone.
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section style={{ background: 'var(--cream)', padding: 'clamp(56px, 8vw, 88px) 0' }}>
        <div style={PAGE_WRAP}>
          <SectionHeading
            eyebrow="Other Ways To Start"
            title="Prefer not to complete the form online?"
            description="Use whichever intake path works best for the family. The admissions page should reduce friction, not force one method."
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 24 }}>
            <FadeIn>
              <div
                style={{
                  padding: 28,
                  borderRadius: 24,
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(123,94,167,0.12)',
                  boxShadow: '0 16px 36px rgba(30,18,48,0.05)',
                }}
              >
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Phone size={18} style={{ color: '#7B5EA7', marginTop: 2 }} />
                    <div style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink)' }}>
                      <strong>Office:</strong> 1-(844)-ISOKE-13
                      <div style={{ color: 'var(--muted)' }}>Mon–Fri, 8:30–5</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Clock3 size={18} style={{ color: '#7B5EA7', marginTop: 2 }} />
                    <div style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink)' }}>
                      <strong>After Hours:</strong> 1-(844)-ISOKE-13 | (844)-476-5313
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <ShieldCheck size={18} style={{ color: '#E8956D', marginTop: 2 }} />
                    <div style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink)' }}>
                      <strong>Emergency After Hours (urgent health/safety only):</strong> 267-983-8856
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Mail size={18} style={{ color: '#7B5EA7', marginTop: 2 }} />
                    <div style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink)' }}>
                      <strong>Email:</strong> intake@isokedevelops.com
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.08}>
              <div
                style={{
                  padding: 28,
                  borderRadius: 24,
                  background: 'rgba(30,18,48,0.96)',
                  color: '#F5F0EC',
                  boxShadow: '0 22px 42px rgba(30,18,48,0.18)',
                }}
              >
                <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.72, marginBottom: 10 }}>
                  Packet Download
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Download the full admissions packet</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'rgba(245,240,236,0.78)', marginBottom: 18 }}>
                  For families who prefer to print, review, or sign the packet manually before sending it back.
                </p>
                <a
                  href={ADMISSIONS_PACKET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#F5F0EC',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: 13.5,
                  }}
                >
                  <Download size={15} />
                  Download PDF packet
                </a>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section style={{ background: 'white', padding: 'clamp(56px, 8vw, 88px) 0' }}>
        <div style={PAGE_WRAP}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 26 }}>
            <FadeIn>
              <div
                style={{
                  padding: 30,
                  borderRadius: 24,
                  background: 'rgba(250,246,255,0.92)',
                  border: '1px solid rgba(123,94,167,0.12)',
                }}
              >
                <SectionHeading
                  eyebrow="Checklist"
                  title="What you’ll want ready"
                  description="If you do not have everything yet, start anyway. The Isoke team can help you fill in any missing pieces."
                />
                <div style={{ display: 'grid', gap: 12 }}>
                  {checklistItems.map((item) => (
                    <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CheckCircle2 size={17} style={{ color: '#7B5EA7', marginTop: 3, flexShrink: 0 }} />
                      <div style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--ink)' }}>{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.08}>
              <div
                style={{
                  padding: 30,
                  borderRadius: 24,
                  background: 'rgba(255,250,247,0.96)',
                  border: '1px solid rgba(232,149,109,0.16)',
                }}
              >
                <SectionHeading
                  eyebrow="Policies & Rights"
                  title="Rights, consents, and policies"
                  description="Short-term, these links point to the admissions packet PDF so families can review the full language until dedicated policy pages are ready."
                />
                <div style={{ display: 'grid', gap: 12 }}>
                  {policyItems.map((item) => (
                    <a
                      key={item}
                      href={ADMISSIONS_PACKET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '14px 15px',
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.84)',
                        border: '1px solid rgba(123,94,167,0.1)',
                        color: 'var(--ink)',
                        textDecoration: 'none',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <FileText size={16} style={{ color: '#7B5EA7', flexShrink: 0 }} />
                        <span style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.5 }}>{item}</span>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7B5EA7', fontSize: 13, fontWeight: 700 }}>
                        View PDF
                        <ArrowUpRight size={14} />
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(184,159,216,0.18), transparent 30%), linear-gradient(180deg, #1E1230 0%, #120a1e 100%)',
          padding: 'clamp(52px, 8vw, 76px) 0 clamp(56px, 8vw, 88px)',
        }}
      >
        <div style={PAGE_WRAP}>
          <FadeIn>
            <div
              style={{
                padding: 'clamp(22px, 4vw, 30px)',
                borderRadius: 28,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                gap: 26,
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#B89FD8', marginBottom: 12 }}>
                  <HeartHandshake size={18} />
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    Need help before you start?
                  </span>
                </div>
                <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', lineHeight: 1.08, color: '#F5F0EC', marginBottom: 12 }}>
                  We can walk through admissions with you.
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: 'rgba(245,240,236,0.72)', maxWidth: 620 }}>
                  If the packet feels overwhelming or you are unsure what information to gather first, call Isoke and a
                  staff member can help complete the process with the family in real time.
                </p>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <a
                  href="tel:+18444765313"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#F5F0EC',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <Phone size={16} />
                    Call 1-(844)-ISOKE-13
                  </span>
                  <ArrowUpRight size={15} />
                </a>
                <a
                  href="mailto:intake@isokedevelops.com"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#F5F0EC',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <ClipboardList size={16} />
                    Email intake
                  </span>
                  <ArrowUpRight size={15} />
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
