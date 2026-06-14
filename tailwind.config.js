/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        praxis: {
          DEFAULT: "#2D2A82",
          dark:    "#1e1b61",
          light:   "#3d3a99",
          subtle:  "#eeeef8",
        },
      },
    },
  },
  plugins: [],
};
