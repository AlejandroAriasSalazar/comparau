import type { Config } from "tailwindcss";

// Sistema de diseño comparaU — moderno, confiable, vibrante.
// Azul-índigo académico + acentos violeta/teal. Pensado para jóvenes y familias.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc",
          400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca",
          800: "#3730a3", 900: "#312e81", 950: "#1e1b4b",
        },
        ink: { DEFAULT: "#0f172a", soft: "#475569", faint: "#94a3b8" },
        surface: { DEFAULT: "#ffffff", soft: "#f6f7fb", border: "#e7e9f4" },
        accent: { teal: "#0d9488", amber: "#f59e0b", green: "#16a34a", rose: "#e11d48", sky: "#0ea5e9" },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      borderRadius: { xl: "0.9rem", "2xl": "1.25rem", "3xl": "1.75rem" },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,.05), 0 12px 28px -14px rgba(49,46,129,.18)",
        lift: "0 14px 40px -12px rgba(79,70,229,.45)",
        glow: "0 0 0 1px rgba(99,102,241,.12), 0 20px 50px -20px rgba(124,58,237,.4)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: { "fade-up": "fade-up .6s ease both", float: "float 6s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
