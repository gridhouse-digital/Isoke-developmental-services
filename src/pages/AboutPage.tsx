import { About } from '../sections/About';
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

export function AboutPage() {
  useDocumentMeta({
    title: 'About Us | Isoke Developmental Services — Cheltenham, PA',
    description: 'Learn about Isoke Developmental Services — rooted in compassion, dignity, and dedication. We provide person-centered care for individuals with IDD across Pennsylvania. Our dedicated team builds independence and community connections.',
    canonical: 'https://isokedevelops.com/about',
  });

  return (
    <main>
      <PageHero
        title="About Isoke."
        subtitle="Our story, our mission, and the people who make it possible."
      />
      <About />
    </main>
  );
}
