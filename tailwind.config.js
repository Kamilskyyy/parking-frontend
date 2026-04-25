/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parkingBlue: '#0056b3', // Ciemniejszy, przygaszony niebieski z przycisków
        parkingDark: '#0a0a0a', // Niemal czarny header
        parkingGray: '#737373', // Główne tło strony
        parkingPanel: '#404040' // Tło paska wyszukiwania i rezerwacji
      }
    },
  },
  plugins: [],
}