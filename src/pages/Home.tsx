import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Services } from '../sections/Services';
import { Careers } from '../sections/Careers';
import { Testimonials } from '../sections/Testimonials';
import { Contact } from '../sections/Contact';
import { useDocumentMeta } from '../lib/useDocumentMeta';

export function Home() {
  useDocumentMeta({
    title: 'Isoke Developmental Services | IDD Support Across Pennsylvania',
    description: 'Isoke Developmental Services provides compassionate, person-centered support for individuals with intellectual and developmental disabilities across Pennsylvania. Services include community participation, companion care, shift nursing, in-home support, respite, and transportation.',
    canonical: 'https://isokedevelops.com/',
  });

  return (
    <main>
      <Hero />
      <About />
      <Services />
      <Careers />
      <Testimonials />
      <Contact />
    </main>
  );
}
