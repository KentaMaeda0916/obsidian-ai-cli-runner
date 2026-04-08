import esbuild from "esbuild";
import { copyFileSync, mkdirSync, readFileSync, readdirSync } from "fs";
import path from "path";

const isWatch = process.argv.includes("--watch");

// ── Embed node-pty JS files into main.js for BRAT compatibility ──────────────
// BRAT only downloads main.js / manifest.json / styles.css.
// We embed the node-pty JS files as a string constant so the plugin can
// write them out to the plugin directory on first launch without needing
// a separate node_modules/ in the zip.
function readDirRecursive(dir, relBase) {
  const files = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      Object.assign(files, readDirRecursive(fullPath, relPath));
    } else {
      files[relPath] = readFileSync(fullPath, "utf8");
    }
  }
  return files;
}

const ptyJsSrc = "node_modules/@homebridge/node-pty-prebuilt-multiarch";
const ptyEmbeddedFiles = {
  ...readDirRecursive(`${ptyJsSrc}/lib`, "lib"),
  ...readDirRecursive(`${ptyJsSrc}/typings`, "typings"),
  "package.json": readFileSync(`${ptyJsSrc}/package.json`, "utf8"),
};

const buildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "es2020",
  external: ["obsidian", "electron"],
  outfile: "dist/main.js",
  format: "cjs",
  sourcemap: isWatch ? "inline" : false,
  logLevel: "info",
  define: {
    // Injected at build time; extracted to disk by ptyManager on first launch
    __PTY_JS_FILES__: JSON.stringify(JSON.stringify(ptyEmbeddedFiles)),
  },
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(buildOptions);

  mkdirSync("dist", { recursive: true });
  copyFileSync("manifest.json", "dist/manifest.json");
  copyFileSync("styles.css", "dist/styles.css");

  console.log("Build complete. node-pty JS embedded in main.js.");
}
