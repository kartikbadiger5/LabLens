// tailwind.config.mjs
/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}",
      "./app/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "#3b82f6",
          risk: {
            red: "#ef4444",
            yellow: "#eab308",
            green: "#22c55e"
          }
        }
      },
    },
    plugins: [],
  }