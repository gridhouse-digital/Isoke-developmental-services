import { Services } from '../sections/Services';
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

export function ServicesPage() {
  useDocumentMeta({
    title: 'Our Services | IDD Support — Isoke Developmental Services',
    description: 'Explore our full range of IDD support services in Altoona, PA: community participation, companion services, shift nursing, in-home community support, respite care, and transportation — all person-centered and tailored to you.',
    canonical: 'https://isokedevelops.com/services',
  });

  return (
    <main>
      <PageHero
        title="Our Services."
        subtitle="Comprehensive, person-centered support for every stage of life."
      />
      <Services />
      <Contact />
    </main>
  );
}
