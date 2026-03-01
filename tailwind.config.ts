import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:   ["var(--font-geist)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        arabic: ["Noto Sans Arabic", "sans-serif"],
        mono:   ["ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      screens: { xs: "375px", sm: "640px", md: "768px", lg: "1024px", xl: "1280px" },
      colors: { surface: "#0d0d0d" },
      spacing: {
        "safe-b": "max(8px, env(safe-area-inset-bottom))",
      },
      keyframes: {
        "fade-in":    { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "fade-up":    { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in":   { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        "pulse-ring": { "0%": { transform: "scale(0.9)", opacity: "1" }, "100%": { transform: "scale(1.4)", opacity: "0" } },
        "shimmer":    { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "float":      { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        "spin-slow":  { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "fade-in":    "fade-in 0.35s cubic-bezier(0.22,1,0.36,1) forwards",
        "fade-up":    "fade-up 0.35s cubic-bezier(0.22,1,0.36,1) forwards",
        "scale-in":   "scale-in 0.25s cubic-bezier(0.22,1,0.36,1) forwards",
        "pulse-ring": "pulse-ring 1.5s ease-out infinite",
        "shimmer":    "shimmer 2s linear infinite",
        "float":      "float 3s ease-in-out infinite",
        "spin-slow":  "spin-slow 3s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
