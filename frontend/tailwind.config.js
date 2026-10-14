/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#FFF9F2",             // Main page background
          cream: "#FFF3E5",          // Warm cream
          peach: "#FFE5D0",          // Pale peach
          apricot: "#FFD8B5",        // Light apricot
          yellow: "#FFF0B8",         // Soft butter yellow
          card: "#FFFFFF",           // White card surface
          panel: "#FFF5EC",          // Soft panel fill

          orange: "#FFB477",         // Pastel orange
          tangerine: "#FFA45B",      // Soft tangerine
          apricotOrange: "#FFCA9A",  // Apricot orange
          coral: "#F28B73",          // Muted coral
          terracotta: "#D97550",     // Warm terracotta

          sky: "#DCEEFF",            // Soft sky blue
          powder: "#BFDFFF",         // Powder blue
          lavender: "#E9E1FF",       // Pastel lavender
          mint: "#DDF4E4",           // Pale mint

          text: "#3D302B",           // Primary text
          secondary: "#76665E",      // Secondary text
          muted: "#A09288",          // Muted text
          heading: "#30241F",        // Strong heading text

          border: "#F0DCCB",         // Soft warm border
          borderStrong: "#E9C7AA",   // Stronger card outline
          shadow: "#F1D8C3",         // Warm shadow
          shadowDark: "#E8C7AC",     // Darker warm shadow
        },
        status: {
          mint: "#DDF4E4",
          mintText: "#1C6B38",
          mintBorder: "#B8E6C4",

          amber: "#FFF0B8",
          amberText: "#8A5600",
          amberBorder: "#F6DE8A",

          coral: "#FFE1DA",
          coralText: "#A82E1E",
          coralBorder: "#F7B8AC",

          sky: "#DCEEFF",
          skyText: "#1E5385",
          skyBorder: "#BADBFC",

          cream: "#FFF3E5",
          creamText: "#76665E",
          creamBorder: "#F0DCCB",
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        'cartoon-sm': '2px 2px 0px #F1D8C3',
        'cartoon': '3px 4px 0px #F1D8C3',
        'cartoon-md': '4px 5px 0px #E8C7AC',
        'cartoon-lg': '5px 7px 0px #E2BBA0',
        'cartoon-hover': '4px 6px 0px #E2BBA0',
        'cartoon-pressed': '1px 2px 0px #E8C7AC',
      }
    },
  },
  plugins: [],
}

