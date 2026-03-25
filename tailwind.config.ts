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
      colors: {
        wa: {
          bg: "#0b141a",
          panel: "#111b21",
          border: "#2a3942",
          bubbleIn: "#202c33",
          bubbleOut: "#005c4b",
          accent: "#00a884",
          muted: "#8696a0",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 35px -12px rgba(2, 132, 199, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
