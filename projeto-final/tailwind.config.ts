import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9ddfe',
          300: '#7cc0fd',
          400: '#369ef9',
          500: '#0c82eb',
          600: '#0267c7',
          700: '#0352a1',
          800: '#074684',
          900: '#0c3b6e',
          950: '#082549',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
