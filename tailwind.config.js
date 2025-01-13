/** @type {import('tailwindcss').Config} */
module.exports = {
  daisyui: {
    themes: ["sunset"]
  },
  content: ["src/App.jsx"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
}

