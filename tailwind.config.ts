import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0a0d12",
          panel: "#0f1419",
          card: "#141a22",
          elev: "#1a212b",
          hover: "#1e2632",
        },
        border: {
          DEFAULT: "#1f2731",
          strong: "#2a3340",
        },
        fg: {
          primary: "#e6edf3",
          secondary: "#9ba8b8",
          muted: "#6b7785",
          dim: "#4a5564",
        },
        accent: {
          DEFAULT: "#d4a437",
          hover: "#e1b449",
          dim: "#3a2f15",
        },
        positive: {
          DEFAULT: "#34d399",
          dim: "#0f3a2c",
        },
        negative: {
          DEFAULT: "#f87171",
          dim: "#3a1515",
        },
        warning: {
          DEFAULT: "#fbbf24",
          dim: "#3a2c0f",
        },
        info: {
          DEFAULT: "#60a5fa",
          dim: "#152a3a",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
