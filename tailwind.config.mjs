/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "var(--color-brand-dark)",
          DEFAULT: "var(--color-brand)",
          light: "var(--color-brand-light)",
          lighter: "var(--color-brand-lighter)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
          border: "var(--color-surface-border)",
        },
        text: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-muted)",
          inverted: "var(--color-text-inverted)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
