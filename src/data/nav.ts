export interface NavLink {
  label: string;
  href: string;
  isAnchor?: boolean;
}

export const navLinks: NavLink[] = [
  { label: 'Home', href: '/', isAnchor: false },
  { label: 'About', href: '/#about', isAnchor: true },
  { label: 'Services', href: '/#services', isAnchor: true },
  { label: 'Careers', href: '/#careers', isAnchor: true },
  { label: 'Contact', href: '/#contact', isAnchor: true },
];
