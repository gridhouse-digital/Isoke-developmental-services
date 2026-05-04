export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function initTheme() {
  const stored = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const isDark = stored ? stored === 'dark' : systemPrefersDark;
  document.documentElement.classList.toggle('dark', isDark);
  return isDark;
}

export function toggleTheme(isDark: boolean) {
  const next = !isDark;
  document.documentElement.classList.toggle('dark', next);
  localStorage.setItem('theme', next ? 'dark' : 'light');
  return next;
}
