export interface Job {
  id: string;
  title: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  department: string;
}

export const jobs: Job[] = [
  {
    id: 'lpn-licensed',
    title: 'LPN Licensed Practical Nurse',
    location: 'Altoona, PA',
    type: 'Full-time',
    department: 'Clinical',
  },
  {
    id: 'lpn-float',
    title: 'LPN Licensed Practical Nurse (Float)',
    location: 'Altoona, PA',
    type: 'Full-time',
    department: 'Clinical',
  },
  {
    id: 'rn-home-care',
    title: 'Registered Nurse — Home Care',
    location: 'Altoona, PA',
    type: 'Full-time',
    department: 'Clinical',
  },
  {
    id: 'dsp',
    title: 'Direct Service Professional',
    location: 'Altoona, PA',
    type: 'Full-time',
    department: 'Support Services',
  },
];

// BambooHR embed config
export const bambooHRConfig = {
  embedUrl: '', // unused — embed.js populates #BambooHR div directly
  enabled: true,
};
