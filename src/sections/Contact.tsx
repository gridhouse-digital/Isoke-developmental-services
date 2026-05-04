import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { FadeIn } from '../components/FadeIn';

const CONTACT_API_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api/contact'
    : '/api/contact';

const contactDetails = [
  {
    icon: MapPin,
    label: 'Address',
    value: 'Isoke Developmental Services\n2061-63 N 62nd St, Suite A\nPhiladelphia, PA 19151',
  },
  {
    icon: Phone,
    label: 'Phone',
    lines: [
      { text: '1-(844) ISOKE-13', href: 'tel:+18444765313' },
      { text: '1-(844) 476-5313', href: 'tel:+18444765313' },
      { text: 'After Hours: (267) 983-8856', href: 'tel:+12679838856' },
    ],
  },
  { icon: Mail,   label: 'Email',          value: 'intake@isokedevelops.com', href: 'mailto:intake@isokedevelops.com' },
  { icon: Clock,  label: 'Business Hours', value: 'Mon\u2013Fri: 9am\u20135pm\nWeekends: By appointment' },
];

interface FormState { name: string; email: string; phone: string; subject: string; message: string; }
type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(f: FormState): FormErrors {
  const e: FormErrors = {};
  if (!f.name.trim())  e.name    = 'Name is required';
  if (!f.email.trim()) e.email   = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email';
  if (!f.message.trim()) e.message = 'Message is required';
  return e;
}

const MAP_EMBED_URL =
  'https://www.google.com/maps?q=2061-63+N+62nd+St+Suite+A+Philadelphia+PA+19151&output=embed';

const inputBase: React.CSSProperties = {
  width: '100%', borderRadius: 10,
  padding: '11px 14px', fontSize: 14,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  color: 'var(--ink)',
  background: 'var(--input-bg)',
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
};

export function Contact() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name as keyof FormState]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitError('');
    setSubmitting(true);

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          message: form.message.trim(),
          name: form.name.trim(),
          phone: form.phone.trim(),
          subject: form.subject.trim(),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Contact form request failed');
      }

      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'We could not send your message right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--cream)' }}
    >
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(184,159,216,0.25) 40%, rgba(232,149,109,0.25) 70%, transparent)' }} />

      <div className="contact-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 48px 96px' }}>

        {/* Header */}
        <FadeIn>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase' as const, color: '#7B5EA7', marginBottom: 16,
          }}>— 06 / Get in Touch</p>
          <h2
            id="contact-heading"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(2.2rem, 4.5vw, 3.75rem)',
              fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em',
              color: 'var(--ink)', marginBottom: 52,
            }}
          >
            We're here<br />
            <em className="not-italic" style={{ color: '#7B5EA7' }}>to help.</em>
          </h2>
        </FadeIn>

        {/* Two columns */}
        <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 56, alignItems: 'start' }}>

          {/* Left — contact details + map */}
          <FadeIn direction="left">
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 32, marginBottom: 32 }}>
              {contactDetails.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <p style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
                      textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 5,
                    }}>{item.label}</p>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Icon size={13} style={{ color: '#7B5EA7', marginTop: 3, flexShrink: 0 }} />
                      {'lines' in item ? (
                        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                          {item.lines.map(({ text, href }, idx) => (
                            <a key={`${href}-${idx}`} href={href} style={{ fontSize: 14.5, color: '#7B5EA7', textDecoration: 'none', fontWeight: 500 }}>{text}</a>
                          ))}
                        </div>
                      ) : item.href ? (
                        <a href={item.href} style={{ fontSize: 14.5, color: '#7B5EA7', textDecoration: 'none', fontWeight: 500 }}>{item.value}</a>
                      ) : (
                        <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink)', whiteSpace: 'pre-line', opacity: 0.8 }}>{item.value}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="contact-map-wrap" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(123,94,167,0.1)' }}>
              <iframe
                src={MAP_EMBED_URL}
                title="Isoke Developmental Services location"
                width="100%" height="200"
                style={{ border: 0, display: 'block' }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </FadeIn>

          {/* Right — form */}
          <FadeIn direction="right" delay={0.1}>
            <div className="contact-form-card" style={{
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(123,94,167,0.1)',
              borderRadius: 22,
              padding: '36px',
              boxShadow: '0 4px 40px rgba(123,94,167,0.07)',
            }}>
              {submitted ? (
                <div style={{ textAlign: 'center' as const, padding: '48px 0' }}>
                  <CheckCircle size={48} style={{ color: '#E8956D', display: 'block', margin: '0 auto 16px' }} />
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Message sent!</h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)' }}>Thank you — we'll be in touch shortly.</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label htmlFor="name" style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 7 }}>Full Name <span style={{ color: '#e85d5d' }}>*</span></label>
                      <input id="name" name="name" type="text" autoComplete="name"
                        value={form.name} onChange={onChange} placeholder="Jane Smith"
                        className="form-input"
                        style={{ ...inputBase, border: '1px solid ' + (errors.name ? 'var(--error-text)' : 'var(--input-border)') }} />
                      {errors.name && <p style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 3 }}>{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="email" style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 7 }}>Email <span style={{ color: '#e85d5d' }}>*</span></label>
                      <input id="email" name="email" type="email" autoComplete="email"
                        value={form.email} onChange={onChange} placeholder="jane@example.com"
                        className="form-input"
                        style={{ ...inputBase, border: '1px solid ' + (errors.email ? 'var(--error-text)' : 'var(--input-border)') }} />
                      {errors.email && <p style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 3 }}>{errors.email}</p>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label htmlFor="phone" style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 7 }}>Phone (optional)</label>
                      <input id="phone" name="phone" type="tel" autoComplete="tel"
                        value={form.phone} onChange={onChange} placeholder="(814) 000-0000"
                        className="form-input"
                        style={{ ...inputBase, border: '1px solid var(--input-border)' }} />
                    </div>
                    <div>
                      <label htmlFor="subject" style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 7 }}>Subject</label>
                      <select id="subject" name="subject" value={form.subject} onChange={onChange}
                        className="form-input"
                        style={{ ...inputBase, border: '1px solid var(--input-border)' }}>
                        <option value="">Select Service</option>
                        <option value="Community Participation Support">Community Participation Support</option>
                        <option value="Companion Services">Companion Services</option>
                        <option value="Shift Nursing">Shift Nursing</option>
                        <option value="In-Home Community Support">In-Home Community Support</option>
                        <option value="Respite Services">Respite Services</option>
                        <option value="Transportation Services">Transportation Services</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label htmlFor="message" style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', marginBottom: 7 }}>Message <span style={{ color: '#e85d5d' }}>*</span></label>
                    <textarea id="message" name="message" rows={5}
                      value={form.message} onChange={onChange} placeholder="Tell us how we can help…"
                      className="form-input"
                      style={{ ...inputBase, resize: 'none', border: '1px solid ' + (errors.message ? 'var(--error-text)' : 'var(--input-border)') }} />
                    {errors.message && <p style={{ fontSize: 11, color: 'var(--error-text)', marginTop: 3 }}>{errors.message}</p>}
                  </div>

                  {submitError && (
                    <div
                      style={{
                        marginBottom: 16,
                        padding: '11px 13px',
                        borderRadius: 12,
                        border: '1px solid var(--error-border)',
                        background: 'var(--error-bg)',
                        color: 'var(--error-text)',
                        fontSize: 12.5,
                        lineHeight: 1.55,
                      }}
                    >
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      padding: '15px 28px',
                      borderRadius: 14, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: 15, fontWeight: 600,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      letterSpacing: '0.01em',
                      color: 'white',
                      background: 'linear-gradient(135deg, #7B5EA7 0%, #7355D4 60%, #8B6EE8 100%)',
                      boxShadow: '0 8px 32px rgba(123,94,167,0.45)',
                      transition: 'box-shadow 0.25s ease, transform 0.2s ease',
                      opacity: submitting ? 0.72 : 1,
                    }}
                    onMouseEnter={e => {
                      if (submitting) return;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 40px rgba(123,94,167,0.65)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(123,94,167,0.45)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <Send size={15} />
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
