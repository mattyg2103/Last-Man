import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#eafaf0",
          100: "#c8f0d8",
          200: "#96e0b3",
          300: "#5fcb8a",
          400: "#33b268",
          500: "#189650",
          600: "#0e7a40",
          700: "#0b5f33",
          800: "#0a4a29",
          900: "#083d23",
          950: "#042013",
        },
        accent: {
          50: "#fff7ed",
          100: "#ffedd5",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
