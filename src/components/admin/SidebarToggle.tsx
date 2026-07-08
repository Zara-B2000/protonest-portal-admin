"use client";

import { Menu } from "lucide-react";

export default function SidebarToggle() {
  const toggle = () => {
    const root = document.querySelector(".admin-layout-root");
    if (root) {
      root.classList.toggle("sidebar-open");
    }
  };

  return (
    <button
      onClick={toggle}
      className="lg:hidden p-1.5 mr-2 text-slate-400 hover:text-white transition-colors focus:outline-none rounded-md hover:bg-slate-800/40"
      aria-label="Toggle sidebar"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
