import { Contact } from '../sections/Contact';
import { useDocumentMeta } from '../lib/useDocumentMeta';

function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="gradient-mesh pt-32 pb-16 text-center">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-5xl text-white mb-4">{title}</h1>
        {subtitle && <p className="text-white/60 text-lg">{subtitle}</p>}
      </div>
    </section>
  );
}

export function ContactPage() {
  useDocumentMeta({
    title: 'Contact Us | Isoke Developmental Services — Cheltenham, PA',
    description: 'Contact Isoke Developmental Services in Cheltenham, PA. Reach our team for service inquiries, referrals, or to learn how we can support your loved one. Call (844) 476-5313 or email intake@isokedevelops.com.',
    canonical: 'https://isokedevelops.com/contact',
  });

  return (
    <main>
      <PageHero
        title="Contact Us."
        subtitle="Reach out — we respond promptly and with care."
      />
      <Contact />
    </main>
  );
}
