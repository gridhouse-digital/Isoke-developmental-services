import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  /** Pass true when the navbar is scrolled in light mode so we flip to dark ink colors */
  lightSurface?: boolean;
}

export function ThemeToggle({ isDark, onToggle, lightSurface = false }: ThemeToggleProps) {
  // On a light surface (cream navbar) use violet ink; everywhere else (dark hero / dark mode) use white
  const onLight = !isDark && lightSurface;

  return (
    <motion.button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'relative',
        width: 36, height: 36,
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: onLight ? '1px solid rgba(91,60,196,0.25)' : '1px solid rgba(255,255,255,0.2)',
        background: onLight ? 'rgba(91,60,196,0.07)' : 'rgba(255,255,255,0.08)',
        color: onLight ? '#5B3CC4' : 'rgba(255,255,255,0.8)',
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s, color 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = onLight ? 'rgba(91,60,196,0.13)' : 'rgba(255,255,255,0.16)';
        (e.currentTarget as HTMLButtonElement).style.color = onLight ? '#3D23A0' : '#fff';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = onLight ? 'rgba(91,60,196,0.07)' : 'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLButtonElement).style.color = onLight ? '#5B3CC4' : 'rgba(255,255,255,0.8)';
      }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
