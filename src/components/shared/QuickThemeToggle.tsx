"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { applyTheme, savePref, loadPref, PREF_KEYS } from "@/utils/userPrefs";

interface QuickThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
  /** Show a text label alongside the icon */
  showLabel?: boolean;
  iconSize?: number;
}

export default function QuickThemeToggle({
  className,
  style,
  showLabel = false,
  iconSize = 15,
}: QuickThemeToggleProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Read the actual applied class, not just localStorage, so "sys" resolves correctly
    setIsDark(!document.documentElement.classList.contains("light"));
  }, []);

  function toggle() {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    savePref(PREF_KEYS.theme, next);
    applyTheme(next);
  }

  const label = isDark ? "Light mode" : "Dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      style={style}
      title={label}
      aria-label={label}
    >
      {isDark
        ? <Sun width={iconSize} height={iconSize} />
        : <Moon width={iconSize} height={iconSize} />}
      {showLabel && <span>{label}</span>}
    </button>
  );
}
