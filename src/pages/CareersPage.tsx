import { Careers } from '../sections/Careers';
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

export function CareersPage() {
  useDocumentMeta({
    title: 'Careers | Join Our Team — Isoke Developmental Services',
    description: 'Join the Isoke Developmental Services team in Altoona, PA. We are hiring DSPs, LPNs, RNs, and support staff who are passionate about caring for individuals with intellectual and developmental disabilities. Competitive pay, flexible schedules.',
    canonical: 'https://isokedevelops.com/careers',
  });

  return (
    <main>
      <PageHero
        title="Join the Team."
        subtitle="Build a meaningful career supporting individuals with disabilities."
      />
      <Careers />
    </main>
  );
}
