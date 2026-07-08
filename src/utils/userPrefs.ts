/**
 * Protonest — User Preferences (localStorage)
 * Handles theme, accent, notifications, session timeout persistence.
 */

export const PREF_KEYS = {
  theme: "pn_theme",
  accent: "pn_accent",
  fontSize: "pn_fontSize",
  notifs: "pn_notifs",
  sessionTimeout: "pn_session_timeout",
  sidebarStyle: "pn_sidebar_style",
  density: "pn_density",
  statusStrip: "pn_status_strip",
  animations: "pn_animations",
} as const;

export type PrefKey = (typeof PREF_KEYS)[keyof typeof PREF_KEYS];

export function savePref(key: PrefKey, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (private browsing, quota exceeded, etc.)
  }
}

export function loadPref<T>(key: PrefKey, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function clearPref(key: PrefKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function clearAllPrefs(): void {
  Object.values(PREF_KEYS).forEach((k) => clearPref(k as PrefKey));
}

/** Apply theme class to <html> element */
export function applyTheme(t: "light" | "dark" | "sys"): void {
  const root = document.documentElement;
  const adminRoot = document.querySelector('.admin-layout-root');
  const customerRoot = document.querySelector('.customer-layout-root');
  const layoutRoots = [adminRoot, customerRoot].filter(Boolean) as Element[];

  // Clear existing theme classes from html and layout roots
  root.classList.remove('light', 'dark');
  layoutRoots.forEach(r => r.classList.remove('light', 'dark'));

  // Determine theme class
  const themeClass = t === 'sys'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : t;

  // Apply theme class to html and layout roots
  root.classList.add(themeClass);
  layoutRoots.forEach(r => r.classList.add(themeClass));
}


/** Apply font size globally */
export function applyFontSize(size: "small" | "medium" | "large"): void {
  const root = document.documentElement;
  root.setAttribute("data-font-size", size);
  if (size === "small") root.style.fontSize = "14px";
  else if (size === "medium") root.style.fontSize = "16px";
  else if (size === "large") root.style.fontSize = "18px";
}

/** Apply sidebar style to <html> data attribute */
export function applySidebarStyle(style: string): void {
  document.documentElement.dataset.sidebar = style;
}

/** Apply density to <html> data attribute */
export function applyDensity(density: string): void {
  document.documentElement.dataset.density = density;
}

/** Show/hide the pinned line status strip on the admin dashboard */
export function applyStatusStrip(show: boolean): void {
  document.documentElement.dataset.statusStrip = show ? "on" : "off";
}

/** Enable/disable page and panel transition/animation effects */
export function applyAnimations(animate: boolean): void {
  document.documentElement.dataset.animations = animate ? "on" : "off";
}
