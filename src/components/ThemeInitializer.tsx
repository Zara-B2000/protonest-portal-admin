"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  applyTheme,
  applyFontSize,
  applySidebarStyle,
  applyDensity,
  loadPref,
  PREF_KEYS,
} from "@/utils/userPrefs";

export default function ThemeInitializer() {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Theme
    const savedTheme = loadPref<"light" | "dark" | "sys">(PREF_KEYS.theme, "light");
    applyTheme(savedTheme);

    // 2. Font Size
    const savedFontSize = loadPref<"small" | "medium" | "large">(PREF_KEYS.fontSize, "medium");
    applyFontSize(savedFontSize);

    // 3. Sidebar Style
    const savedSidebar = loadPref<string>(PREF_KEYS.sidebarStyle, "Full (icons + labels)");
    applySidebarStyle(savedSidebar);

    // 4. Density
    const savedDensity = loadPref<string>(PREF_KEYS.density, "Default");
    applyDensity(savedDensity);
  }, [pathname]);

  return null;
}
