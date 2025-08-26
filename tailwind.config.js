/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["fantasy"], // Use only fantasy theme for consistency
    darkTheme: false, // Disable dark mode switching
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false, // Disable logs
    themeRoot: ":root",
  },
};
