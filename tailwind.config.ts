import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080C14",
        foreground: "#EDEDED",
        btc: {
          DEFAULT: "#F7931A",
          hover: "#FF9F2E",
          glow: "rgba(247, 147, 26, 0.4)",
        },
        cyan: {
          neon: "#00F2FE",
          glow: "rgba(0, 242, 254, 0.4)",
        },
        emerald: {
          neon: "#10B981",
          glow: "rgba(16, 185, 129, 0.4)",
        },
        card: {
          DEFAULT: "rgba(13, 17, 28, 0.75)",
          border: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.15)",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(247, 147, 26, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(247, 147, 26, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
