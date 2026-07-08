import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ThemeInitializer from '@/components/ThemeInitializer'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Protonest Admin Portal',
  description: 'Staff portal for managing PCB assembly orders, quotes, and production',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var root = document.documentElement;

                  // ── Theme ──────────────────────────────────────────────
                  var theme = JSON.parse(localStorage.getItem('pn_theme') || '"dark"');
                  root.classList.remove('light', 'dark');
                  if (theme === 'sys') {
                    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    root.classList.add(systemDark ? 'dark' : 'light');
                  } else {
                    root.classList.add(theme);
                  }

                  // ── Accent palette (Always default purple) ─────────────
                  root.style.setProperty('--pn-p3', '#9D82F8');
                  root.style.setProperty('--pn-p4', '#7B5CF6');
                  root.style.setProperty('--pn-p5', '#5B42E8');
                  root.style.setProperty('--pn-p6', '#4530C8');
                  root.style.setProperty('--pn-p5-alpha', 'rgba(91,66,232,0.14)');

                  // ── Font size ──────────────────────────────────────────
                  var fontSize = JSON.parse(localStorage.getItem('pn_fontSize') || '"medium"');
                  root.setAttribute('data-font-size', fontSize);
                  if (fontSize === 'small') root.style.fontSize = '14px';
                  else if (fontSize === 'medium') root.style.fontSize = '16px';
                  else if (fontSize === 'large') root.style.fontSize = '18px';

                  // ── Sidebar style ──────────────────────────────────────
                  var sidebar = JSON.parse(localStorage.getItem('pn_sidebar_style') || '"Full (icons + labels)"');
                  root.dataset.sidebar = sidebar;

                  // ── Dashboard density ──────────────────────────────────
                  var density = JSON.parse(localStorage.getItem('pn_density') || '"Default"');
                  root.dataset.density = density;

                  // ── Line status strip ───────────────────────────────────
                  var statusStrip = JSON.parse(localStorage.getItem('pn_status_strip') || 'true');
                  root.dataset.statusStrip = statusStrip ? 'on' : 'off';

                  // ── Animate transitions ──────────────────────────────────
                  var animations = JSON.parse(localStorage.getItem('pn_animations') || 'true');
                  root.dataset.animations = animations ? 'on' : 'off';

                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeInitializer />
        {children}
      </body>
    </html>
  )
}