export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    quote:
      'Isoke Developmental Services has been a game-changer for our family. Their compassionate and tailored support has helped my son thrive in ways we never thought possible. The team truly listens and makes him feel valued every day.',
    name: 'Sarah Mitchell',
    role: 'Parent',
    avatarUrl: '/testimonials/Sarah Mitchell.jpg',
  },
  {
    id: '2',
    quote:
      'The staff at Isoke go above and beyond to create a supportive environment. Their dedication to person-centered care has made a huge difference in my sister\'s life, helping her gain confidence and independence.',
    name: 'Cathrine Wood',
    role: 'Family Member',
    avatarUrl: '/testimonials/Cathrine Wood.jpg',
  },
  {
    id: '3',
    quote:
      'Working with Isoke has been an incredible experience. Their commitment to dignity and inclusion shines through in every interaction, making our community stronger and more connected.',
    name: 'Kenny Nguyen',
    role: 'Community Advocate',
    avatarUrl: '/testimonials/Kenny Nguyen.jpg',
  },
];
