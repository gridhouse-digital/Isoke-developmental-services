import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  as?: 'button' | 'a';
  href?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  as: Tag = 'button',
  href,
  ...props
}: ButtonProps) {
  const sizes: Record<string, string> = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-7 py-3.5 text-sm',
    lg: 'px-9 py-4 text-base',
  };
  const variants: Record<string, string> = {
    primary:
      'bg-[#5B3CC4] hover:bg-[#4a2fa8] text-white font-semibold tracking-wide shadow-lg shadow-violet-500/30 hover:shadow-violet-500/45 transition-all duration-250',
    secondary:
      'bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 backdrop-blur-sm tracking-wide transition-all duration-250',
    ghost:
      'bg-transparent hover:bg-violet/8 text-[#5B3CC4] dark:text-[#A98BFF] font-semibold border border-[#5B3CC4]/25 hover:border-[#5B3CC4]/50 tracking-wide transition-all duration-250',
  };
  const base = cn(
    'inline-flex items-center justify-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A98BFF] focus-visible:ring-offset-2',
    sizes[size],
    variants[variant],
    className
  );
  if (Tag === 'a') {
    return (
      <motion.a href={href} className={base} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button
      className={base}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </motion.button>
  );
}
