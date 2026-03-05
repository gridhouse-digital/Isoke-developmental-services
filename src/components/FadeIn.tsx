import { motion } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  amount?: number;
}

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  className,
  amount = 0.12,
}: FadeInProps) {
  const dirs: Record<string, { x: number; y: number }> = {
    up:    { y: 32, x: 0 },
    down:  { y: -32, x: 0 },
    left:  { x: 32, y: 0 },
    right: { x: -32, y: 0 },
    none:  { x: 0, y: 0 },
  };
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...dirs[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
