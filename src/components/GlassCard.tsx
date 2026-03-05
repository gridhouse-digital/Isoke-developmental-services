import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  surface?: boolean;
  as?: 'div' | 'article' | 'section' | 'li';
}

export function GlassCard({
  children,
  className,
  hover = false,
  surface = false,
  as: Tag = 'div',
}: GlassCardProps) {
  const base = surface ? 'glass-surface' : 'glass';
  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={cn(base, 'relative overflow-hidden', className)}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <Tag className={cn(base, 'relative overflow-hidden', className)}>
      {children}
    </Tag>
  );
}
