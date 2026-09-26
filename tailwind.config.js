// Konfigurasi tema Tailwind (dipakai lewat CDN).
// WAJIB dimuat SETELAH <script src="https://cdn.tailwindcss.com"></script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              navy: "#22577a",
              navyLight: "#2d6fa0",
              blueZ: "#1a3f52",
              blueSoft: "#4a8fc7",
              gold: "#00c9ff",
              goldLight: "#48d4ff",
            },
            fontFamily: {
              script: ['"Alex Brush"', "cursive"],
              serif: ['"Playfair Display"', "serif"],
              body: ['"Plus Jakarta Sans"', "sans-serif"],
              arabic: ['"Amiri"', "serif"],
            },
            animation: {
              "spin-slow": "spin 8s linear infinite",
            },
          },
        },
      };
