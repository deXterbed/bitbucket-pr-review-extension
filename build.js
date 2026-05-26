const esbuild = require("esbuild");
const CleanCSS = require("clean-css");
const fs = require("fs");
const path = require("path");

const DIST = "dist";
const zipOnly = process.argv.includes("--zip");

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    entry.isDirectory()
      ? copyDir(srcPath, destPath)
      : copyFile(srcPath, destPath);
  }
}

// ── JS Bundle ────────────────────────────────────────────────────────────────

async function buildJS() {
  console.log("Building JS…");

  const entries = {
    "background.js": "src/background/index.js",
    "content.js": "src/content/index.js",
    "popup.js": "src/popup/index.js",
  };

  for (const [outName, entry] of Object.entries(entries)) {
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      minify: true,
      outfile: path.join(DIST, outName),
      target: "chrome120",
      format: "iife",
    });
  }

  console.log("  ✓ JS bundled & minified");
}

// ── CSS Minify ───────────────────────────────────────────────────────────────

function buildCSS() {
  console.log("Building CSS…");

  const raw = fs.readFileSync("src/popup/styles.css", "utf8");
  const result = new CleanCSS({ level: 2 }).minify(raw);

  if (result.errors.length) {
    console.error("CSS errors:", result.errors);
    process.exit(1);
  }

  fs.writeFileSync(path.join(DIST, "styles.css"), result.styles);
  console.log("  ✓ CSS minified");
}

// ── Static Assets ────────────────────────────────────────────────────────────

function copyStatic() {
  console.log("Copying static assets…");

  copyFile("manifest.json", path.join(DIST, "manifest.json"));
  copyFile("src/popup/index.html", path.join(DIST, "popup.html"));

  // Copy icons
  if (fs.existsSync("icons")) {
    copyDir("icons", DIST);
  }

  const iconCount = fs
    .readdirSync(DIST)
    .filter((f) => /\.(png|svg|ico)$/i.test(f)).length;
  console.log(`  ✓ Copied manifest.json, popup.html, ${iconCount} icon(s)`);
}

// ── ZIP ──────────────────────────────────────────────────────────────────────

async function createZip() {
  console.log("Creating ZIP…");

  const archiver = require("archiver");
  const pkg = require("./package.json");
  const zipName = `bitbucket-pr-review-extension-v${pkg.version}.zip`;
  const output = fs.createWriteStream(zipName);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(DIST, false);
  await archive.finalize();

  console.log(`  ✓ ${zipName} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  const start = Date.now();

  if (!zipOnly) {
    ensureDir(DIST);
    await buildJS();
    buildCSS();
    copyStatic();
  }

  const doZip = zipOnly || process.argv.includes("--zip");
  if (doZip) {
    // If zipOnly, ensure dist already exists
    if (zipOnly && !fs.existsSync(DIST)) {
      console.error("dist/ not found. Run `npm run build` first.");
      process.exit(1);
    }
    await createZip();
  }

  console.log(`\nDone in ${Date.now() - start}ms`);
})();
