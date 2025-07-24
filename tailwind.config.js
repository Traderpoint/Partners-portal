module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Systrix brand colors - přesné barvy z loga
        systrix: {
          50: '#e6f3ff',   // Velmi světlá Systrix modrá
          100: '#cce7ff',  // Světlá Systrix modrá
          200: '#99cfff',  // Světlejší Systrix modrá
          300: '#66b7ff',  // Střední světlá Systrix modrá
          400: '#339fff',  // Střední Systrix modrá
          500: '#0077ff',  // Základní Systrix modrá (z loga)
          600: '#0066cc',  // Tmavší Systrix modrá (primární)
          700: '#0055aa',  // Tmavá Systrix modrá (hover)
          800: '#004488',  // Velmi tmavá Systrix modrá
          900: '#003366',  // Nejtmavší Systrix modrá
        },
        // Alias pro snadnější použití
        primary: {
          50: '#e6f3ff',
          100: '#cce7ff',
          200: '#99cfff',
          300: '#66b7ff',
          400: '#339fff',
          500: '#0077ff',  // Hlavní Systrix brand barva
          600: '#0066cc',  // Primární barva pro tlačítka
          700: '#0055aa',  // Hover stavy
          800: '#004488',
          900: '#003366',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
