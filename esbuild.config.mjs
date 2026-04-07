import esbuild from "esbuild";
import { copyFileSync, cpSync, mkdirSync, existsSync } from "fs";

const isWatch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "es2020",
  external: ["obsidian", "electron", "node-pty"],
  outfile: "dist/main.js",
  format: "cjs",
  sourcemap: isWatch ? "inline" : false,
  logLevel: "info",
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(buildOptions);

  // Copy manifest.json and styles.css to dist
  mkdirSync("dist", { recursive: true });
  copyFileSync("manifest.json", "dist/manifest.json");
  copyFileSync("styles.css", "dist/styles.css");

  // Copy arch-specific node-pty builds to dist
  for (const arch of ["arm64", "x64"]) {
    const ptySource = `node_modules/node-pty-${arch}`;
    const ptyDest = `dist/node_modules/node-pty-${arch}`;
    if (existsSync(ptySource)) {
      cpSync(ptySource, ptyDest, { recursive: true });
      console.log(`Copied node-pty-${arch} to dist/node_modules/`);
    }
  }
}
