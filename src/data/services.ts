export interface Service {
  id: string;
  icon: string;
  title: string;
  tagline: string;
  description: string;
  color: string;
  accentColor: string;
  highlights: string[];
  whoItHelps: string;
  details: string;
}

export const services: Service[] = [
  {
    id: 'community-participation',
    icon: 'Users',
    title: 'Community Participation Support',
    tagline: 'Connecting people to the world around them.',
    description:
      'Engage in inclusive, interest-based community activities that reflect personal strengths and goals. Promotes connection and skill-building.',
    color: 'from-violet-500 to-purple-600',
    accentColor: '#B89FD8',
    highlights: [
      'Interest-based activity matching',
      'Group & individual outings',
      'Social skill development',
      'Community integration planning',
      'Peer relationship building',
    ],
    whoItHelps:
      'Adults with intellectual or developmental disabilities who want to build meaningful connections and participate actively in their communities.',
    details:
      'Our Community Participation Support service is built around the belief that every person deserves a rich, connected life. We work alongside individuals to identify their interests — whether that\'s sports, the arts, volunteering, or simply exploring their neighborhood — and create structured opportunities to engage safely and confidently. Our trained staff provide one-on-one or small-group support, offering guidance and encouragement every step of the way. Over time, participants build independence, social confidence, and lasting friendships that extend well beyond our services.',
  },
  {
    id: 'companion-services',
    icon: 'Heart',
    title: 'Companion Services',
    tagline: 'Everyday support, delivered with dignity.',
    description:
      'Support for adults in private homes: daily living tasks, social engagement, medication reminders, and mobility assistance.',
    color: 'from-pink-500 to-rose-600',
    accentColor: '#D47BAA',
    highlights: [
      'Daily living task assistance',
      'Medication reminders',
      'Mobility & personal care support',
      'Social engagement & conversation',
      'Light housekeeping & errands',
    ],
    whoItHelps:
      'Adults with disabilities or age-related challenges who wish to remain in their own homes with consistent, compassionate day-to-day support.',
    details:
      'Companion Services provides trusted, in-home support that helps individuals maintain their independence and quality of life. Our companions are carefully matched to each person, building genuine relationships grounded in respect and warmth. From helping with morning routines to accompanying someone on a walk or providing a friendly presence during the day, our team ensures no one feels alone. We are not just support workers — we become a familiar, trusted part of everyday life.',
  },
  {
    id: 'shift-nursing',
    icon: 'Stethoscope',
    title: 'Shift Nursing',
    tagline: 'Clinical expertise, brought home.',
    description:
      'Licensed nurses deliver in-home medical care: medication management, vital sign monitoring, and wellness support.',
    color: 'from-blue-500 to-indigo-600',
    accentColor: '#7BA7D8',
    highlights: [
      'Medication administration & management',
      'Vital sign monitoring',
      'Wound care & treatment',
      'Care plan coordination',
      'Family education & training',
    ],
    whoItHelps:
      'Individuals with complex medical needs who require skilled nursing oversight in a home setting, avoiding unnecessary hospitalizations.',
    details:
      'Our Shift Nursing service places licensed, compassionate nurses directly in the home for scheduled shifts — ensuring that medically complex individuals receive the clinical attention they need without sacrificing the comfort and familiarity of their own environment. Our nurses work closely with physicians, therapists, and family caregivers to align care delivery with each person\'s overall health plan. Safety, dignity, and clinical excellence are the pillars of every shift we provide.',
  },
  {
    id: 'in-home-community-support',
    icon: 'Home',
    title: 'In-Home Community Support',
    tagline: 'Building the skills to thrive independently.',
    description:
      'Skills for independent living: self-care, communication, safety, finances, and social skills integration.',
    color: 'from-teal-500 to-cyan-600',
    accentColor: '#E8956D',
    highlights: [
      'Self-care & personal hygiene skills',
      'Budgeting & financial literacy',
      'Home safety & emergency planning',
      'Communication & social skills',
      'Cooking, cleaning & household management',
    ],
    whoItHelps:
      'Individuals transitioning toward greater independence who need structured, in-home coaching to develop practical life skills.',
    details:
      'In-Home Community Support is a hands-on, goal-oriented service designed to equip individuals with the practical tools they need to live more independently. Our support specialists work side-by-side with individuals in their own homes, teaching and reinforcing skills across every area of daily life. Progress is tracked against personalized goals developed collaboratively with the individual, their family, and any support coordinators. This service empowers people to make their own choices and take pride in managing their lives.',
  },
  {
    id: 'respite-services',
    icon: 'RefreshCw',
    title: 'Respite Services',
    tagline: 'Rest for caregivers. Continuity for individuals.',
    description:
      'Short-term care to give caregivers a break. Ensures continuity, safety, and peace of mind for families.',
    color: 'from-amber-500 to-orange-600',
    accentColor: '#D4A055',
    highlights: [
      'Planned & emergency respite available',
      'In-home and community-based options',
      'Trained, background-checked staff',
      'Seamless care continuity',
      'Flexible scheduling',
    ],
    whoItHelps:
      'Family caregivers and natural supports who need temporary relief, knowing their loved one is in safe, capable hands.',
    details:
      'Caring for a loved one is one of the most meaningful things a person can do — and one of the most demanding. Our Respite Services exist to ensure that caregivers can take necessary breaks without worry or guilt. We step in with the same quality of care and consistency that families provide, maintaining routines and creating a comfortable, familiar experience for the individual. Whether you need a few hours, a full day, or extended coverage, our team is ready to support your family.',
  },
  {
    id: 'transportation',
    icon: 'Car',
    title: 'Transportation Services',
    tagline: 'More than a ride — freedom and opportunity.',
    description:
      'Reliable, trauma-informed transport for medical, work, or community access. More than a ride — freedom and opportunity.',
    color: 'from-emerald-500 to-green-600',
    accentColor: '#6DC4A4',
    highlights: [
      'Medical appointment transport',
      'Workplace & day program access',
      'Community outing support',
      'Trauma-informed drivers',
      'Wheelchair-accessible vehicles',
    ],
    whoItHelps:
      'Individuals who need safe, reliable transportation to access healthcare, employment, education, and community life across Pennsylvania.',
    details:
      'Transportation should never be a barrier to living a full life. Our Transportation Services provide safe, dependable, and dignified travel for individuals who need support getting where they need to go. Our drivers are trained in trauma-informed care and understand the unique needs of the people they serve. We go beyond simply providing a vehicle — we offer a consistent, friendly face and a commitment to punctuality that individuals and families can count on every single time.',
  },
];
