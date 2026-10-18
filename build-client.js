const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

async function build() {
  const isProd = process.env.NODE_ENV === "production" || !process.env.SKIP_MINIFY;
  console.log(`[Client Build] Bundling Flim Baazy React frontend (Production: ${isProd})...`);

  const startTime = Date.now();

  try {
    await esbuild.build({
      entryPoints: [path.join(__dirname, "website", "src", "index.tsx")],
      bundle: true,
      outfile: path.join(__dirname, "website", "public", "app.js"),
      minify: isProd,
      sourcemap: !isProd,
      target: ["es2020", "chrome90", "firefox88", "safari14", "edge90"],
      define: {
        "process.env.NODE_ENV": JSON.stringify(isProd ? "production" : "development"),
      },
      loader: {
        ".tsx": "tsx",
        ".ts": "ts",
        ".jsx": "jsx",
        ".js": "js",
      },
    });

    const elapsed = Date.now() - startTime;
    console.log(`[Client Build] ✓ Successfully bundled website/public/app.js in ${elapsed}ms`);

    // Generate production index.html
    const htmlContent = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Flim Baazy — Stream & Download Movies, Shows & Anime Free</title>
  <meta name="description" content="Watch high quality movies, TV shows, and anime in HD with multiple audio tracks and subtitles. 100% free, ad-free streaming with 60+ providers.">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238b5cf6'><path d='M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v3h16V5H4zm0 5v4h16v-4H4zm0 6v3h16v-3H4z'/></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            brand: {
              50: '#f5f3ff',
              100: '#ede9fe',
              500: '#8b5cf6',
              600: '#7c3aed',
              700: '#6d28d9',
              900: '#4c1d95',
            }
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0', transform: 'scale(0.98)' },
              '100%': { opacity: '1', transform: 'scale(1)' },
            }
          },
          animation: {
            fadeIn: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }
        }
      }
    }
  </script>
  <style>
    /* Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #090a0f;
    }
    ::-webkit-scrollbar-thumb {
      background: #1e2230;
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #374151;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(139, 92, 246, 0.3);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(139, 92, 246, 0.6);
    }
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .safe-bottom {
      padding-bottom: max(env(safe-area-inset-bottom, 8px), 8px);
    }
    body {
      background-color: #07090e;
      color: #f1f5f9;
      overflow-x: hidden;
      -webkit-tap-highlight-color: transparent;
    }
  </style>
</head>
<body class="bg-[#07090e] text-slate-100 min-h-screen">
  <div id="root"></div>
  <script src="/app.js"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(__dirname, "website", "public", "index.html"), htmlContent);
    console.log("[Client Build] ✓ Successfully generated website/public/index.html");

    // Mirror to root public/ for safety & backwards compatibility
    const rootPublicDir = path.join(__dirname, "public");
    if (fs.existsSync(rootPublicDir)) {
      fs.copyFileSync(path.join(__dirname, "website", "public", "app.js"), path.join(rootPublicDir, "app.js"));
      fs.writeFileSync(path.join(rootPublicDir, "index.html"), htmlContent);
      console.log("[Client Build] ✓ Mirrored bundle to root public/");
    }
  } catch (err) {
    console.error("[Client Build] ✗ Build failed:", err);
    process.exit(1);
  }
}

build();
