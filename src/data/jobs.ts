export interface Job {
  id: string;
  title: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  department: string;
  applyUrl: string;
}

export const jobs: Job[] = [
  {
    id: '34',
    title: 'LPN-Licensed Pratical Nurse',
    location: 'Philadelphia, PA',
    type: 'Full-time',
    department: 'Clinical Nursing',
    applyUrl: 'https://isokedevelops.bamboohr.com/careers/34',
  },
  {
    id: '38',
    title: 'LPN-Licensed Pratical Nurse',
    location: 'Villanova, PA',
    type: 'Part-time',
    department: 'Clinical Nursing',
    applyUrl: 'https://isokedevelops.bamboohr.com/careers/38',
  },
  {
    id: '27',
    title: 'Registered Nurse - Home Care',
    location: 'Altoona, PA',
    type: 'Part-time',
    department: 'Clinical Nursing',
    applyUrl: 'https://isokedevelops.bamboohr.com/careers/27',
  },
  {
    id: '37',
    title: 'Direct Service Professional',
    location: 'Philadelphia, PA',
    type: 'Part-time',
    department: 'Human Resources',
    applyUrl: 'https://isokedevelops.bamboohr.com/careers/37',
  },
];

export const bambooHRConfig = {
  enabled: true,
  companyDomain: 'isokedevelops.bamboohr.com',
  boardUrl: 'https://isokedevelops.bamboohr.com/careers',
  embedUrl: 'https://isokedevelops.bamboohr.com/jobs/embed2.php?version=1.0.0',
};
