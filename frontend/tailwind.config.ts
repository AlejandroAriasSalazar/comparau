import type { Config } from "tailwindcss";

// Sistema de diseño comparaU — SaaS limpio, azul académico.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff", 100: "#d9e6ff", 200: "#bcd3ff", 300: "#8eb5ff",
          400: "#598dff", 500: "#3366ff", 600: "#1f47e6", 700: "#1937b4",
          800: "#1a3192", 900: "#1b2e75", 950: "#141d45",
        },
        ink: { DEFAULT: "#0f172a", soft: "#475569", faint: "#94a3b8" },
        surface: { DEFAULT: "#ffffff", soft: "#f8fafc", border: "#e2e8f0" },
        accent: { teal: "#0ea5a4", amber: "#f59e0b", green: "#16a34a", red: "#e11d48" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "0.9rem", "2xl": "1.25rem" },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,.06), 0 8px 24px -12px rgba(15,23,42,.12)",
        lift: "0 10px 40px -12px rgba(31,71,230,.28)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(12px)" },
                     "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: { "fade-up": "fade-up .6s ease both" },
    },
  },
  plugins: [],
};
export default config;
