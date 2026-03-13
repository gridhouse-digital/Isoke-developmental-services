import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

const serviceLinks = [
  'Community Participation', 'Companion Services', 'Shift Nursing',
  'In-Home Community Support', 'Respite Services', 'Transportation Services',
];

const quickLinks = [
  { label: 'About Us',     href: '/#about' },
  { label: 'Services',     href: '/#services' },
  { label: 'Careers',      href: '/#careers' },
  { label: 'Contact',      href: '/#contact' },
];

const socials = [
  { icon: Facebook,  label: 'Facebook',  href: 'https://facebook.com' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: Twitter,   label: 'X/Twitter', href: 'https://twitter.com' },
  { icon: Linkedin,  label: 'LinkedIn',  href: 'https://linkedin.com' },
];

const year = new Date().getFullYear();

export function Footer() {
  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      e.preventDefault();
      document.getElementById(href.replace('/#', ''))?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      className="dark-section"
      style={{
        position: 'relative',
        background:
          'radial-gradient(ellipse 80% 60% at 5% 70%, rgba(123,94,167,0.55) 0%, transparent 65%),' +
          'radial-gradient(ellipse 55% 50% at 92% 8%, rgba(184,159,216,0.28) 0%, transparent 60%),' +
          'linear-gradient(162deg, #0e0818 0%, #1E1230 40%, #120a1e 100%)',
      }}
      aria-label="Site footer"
    >
      {/* Top rule */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(184,159,216,0.3) 40%, rgba(232,149,109,0.3) 70%, transparent)' }} />

      <div className="footer-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 48px' }}>

        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0 48px', marginBottom: 56 }}>

          {/* Brand */}
          <div>
            <Link to="/" aria-label="Isoke Developmental Services">
              <img
                src="/isoke logo.png"
                alt="Isoke Developmental Services"
                style={{ height: 38, width: 'auto', objectFit: 'contain', marginBottom: 20, display: 'block' }}
              />
            </Link>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.72)', marginBottom: 24, maxWidth: 260 }}>
              Person-centered support for individuals with intellectual and developmental disabilities across Pennsylvania.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.72)',
                    textDecoration: 'none',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(184,159,216,0.2)';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#B89FD8';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.72)';
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#B89FD8', marginBottom: 20 }}>Our Services</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {serviceLinks.map((s) => (
                <li key={s}>
                  <a href="/#services" onClick={(e) => scrollTo(e, '/#services')}
                    style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.18s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#E8956D'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'}
                  >{s}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#B89FD8', marginBottom: 20 }}>Contact</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              <li style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)' }}>
                Isoke Developmental Services<br />
                2061-63 N 62nd St, Suite A<br />
                Philadelphia, PA 19151
              </li>
              <li><a href="tel:+18444765313" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.18s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#E8956D'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'}
              >1-(844) 476-5313</a></li>
              <li><a href="mailto:intake@isokedevelops.com" style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.18s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#E8956D'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'}
              >intake@isokedevelops.com</a></li>
              <li style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,0.55)' }}>Mon–Fri: 9am–5pm<br />Weekends by appt.</li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#B89FD8', marginBottom: 20 }}>Quick Links</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
              {quickLinks.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} onClick={(e) => scrollTo(e, href)}
                    style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.18s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#E8956D'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)'}
                  >{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom-bar" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.07)',
          flexWrap: 'wrap' as const, gap: 8,
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            © {year} Isoke Developmental Services LLC. All rights reserved.
          </p>
          <p style={{ fontSize: 12, fontFamily: "'Fraunces', serif", fontStyle: 'italic', color: 'rgba(255,255,255,0.45)' }}>
            Empowering Every Ability.
          </p>
        </div>
      </div>
    </footer>
  );
}
