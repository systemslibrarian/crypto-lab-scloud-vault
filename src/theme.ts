/**
 * Theme toggle: dark/light mode with localStorage persistence.
 */

const STORAGE_KEY = 'scloud-vault-theme';

export type Theme = 'dark' | 'light';

export function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* ignore */ }
  return 'dark';
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch { /* ignore */ }
  updateToggleButton(theme);
}

export function toggleTheme(): void {
  const current = document.documentElement.getAttribute('data-theme') as Theme || 'dark';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

function updateToggleButton(theme: Theme): void {
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

export function initTheme(): void {
  const theme = getStoredTheme();
  setTheme(theme);

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }
}
