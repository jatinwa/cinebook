/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red:     "#E50914",
          redHover:"#B81D24",
          dark:    "#141414",
          card:    "#1C1C1C",
          border:  "#2A2A2A",
          muted:   "#6B7280",
          text:    "#E5E5E5",
          gold:    "#F5C842",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(to bottom, transparent 0%, #141414 100%)",
      },
    },
  },
  plugins: [],
};