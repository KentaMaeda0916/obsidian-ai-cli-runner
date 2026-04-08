import esbuild from "esbuild";
import { copyFileSync, cpSync, mkdirSync, existsSync } from "fs";

const isWatch = process.argv.includes("--watch");

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

  // Copy only the JS runtime files from homebridge node-pty (binary downloaded at first run)
  const ptyJsSrc = "node_modules/@homebridge/node-pty-prebuilt-multiarch";
  const ptyJsDest = "dist/node_modules/node-pty-prebuilt-multiarch";
  mkdirSync(ptyJsDest, { recursive: true });
  // Only copy what's needed at runtime: lib/, typings/, package.json
  cpSync(`${ptyJsSrc}/lib`, `${ptyJsDest}/lib`, { recursive: true });
  cpSync(`${ptyJsSrc}/typings`, `${ptyJsDest}/typings`, { recursive: true });
  copyFileSync(`${ptyJsSrc}/package.json`, `${ptyJsDest}/package.json`);
  console.log("Copied node-pty-prebuilt-multiarch JS to dist/node_modules/");
}
