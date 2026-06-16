import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#111118",
        "surface-2": "#1a1a24",
        "surface-3": "#22223a",
        primary: "#7c5cbf",
        "primary-light": "#9b7dd4",
        "primary-dark": "#5a3d9a",
        accent: "#4fc3f7",
        "accent-purple": "#b39ddb",
        "gradient-start": "#4a90d9",
        "gradient-end": "#7c5cbf",
        "text-primary": "#f0eeff",
        "text-secondary": "#a09bb8",
        "text-muted": "#6b6580",
        border: "#2a2a3e",
        "border-light": "#3a3a54",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #4a90d9 0%, #7c5cbf 100%)",
        "gradient-card": "linear-gradient(145deg, #1a1a24 0%, #22223a 100%)",
        "gradient-hero": "linear-gradient(135deg, #0d0d1a 0%, #1a1040 50%, #0d0d1a 100%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          from: { boxShadow: "0 0 10px #7c5cbf40" },
          to: { boxShadow: "0 0 25px #7c5cbf80" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
