import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import * as path from "path";

const PTY_PKG = "node-pty-prebuilt-multiarch";
const BINARY_RELEASE_TAG = "binaries-v1";
const REPO = "KentaMaeda0916/obsidian-ai-cli-runner";

// Injected by esbuild at build time (see esbuild.config.mjs)
declare const __PTY_JS_FILES__: string;

export type StatusFn = (msg: string) => void;

function getPtyDir(pluginDir: string): string {
  return path.join(pluginDir, "node_modules", PTY_PKG);
}

function getBuildDir(pluginDir: string): string {
  return path.join(getPtyDir(pluginDir), "build", "Release");
}

// ── JS files (embedded in main.js at build time) ─────────────────────────────

function ensurePtyJs(pluginDir: string): void {
  const ptyDir = getPtyDir(pluginDir);
  if (fs.existsSync(path.join(ptyDir, "package.json"))) return;

  const files: Record<string, string> = JSON.parse(__PTY_JS_FILES__);
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(ptyDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf8");
  }
}

// ── Native binary (downloaded from GitHub Releases on first launch) ───────────

function isBinaryReady(pluginDir: string): boolean {
  const buildDir = getBuildDir(pluginDir);
  if (!fs.existsSync(path.join(buildDir, "pty.node"))) return false;
  if (process.platform !== "win32") {
    if (!fs.existsSync(path.join(buildDir, "spawn-helper"))) return false;
  }
  return true;
}

function downloadToFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doGet = (u: string, hops = 0) => {
      if (hops > 10) return reject(new Error("Too many redirects"));
      const mod = u.startsWith("https") ? https : http;
      (mod as typeof https).get(
        u,
        { headers: { "User-Agent": "obsidian-ai-cli-runner" } },
        (res) => {
          if ([301, 302, 307, 308].includes(res.statusCode!)) {
            return doGet(res.headers.location!, hops + 1);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode} for ${u}`));
          }
          const out = fs.createWriteStream(destPath);
          res.pipe(out);
          out.on("finish", () => { out.close(); resolve(); });
          out.on("error", reject);
          res.on("error", reject);
        }
      ).on("error", reject);
    };
    doGet(url);
  });
}

function assetUrl(filename: string): string {
  return `https://github.com/${REPO}/releases/download/${BINARY_RELEASE_TAG}/${filename}`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function ensurePty(pluginDir: string, onStatus: StatusFn): Promise<void> {
  // 1. Write JS files from embedded bundle (instant, no network)
  ensurePtyJs(pluginDir);

  // 2. Download native binary if not already present
  if (isBinaryReady(pluginDir)) return;

  const { platform, arch } = process;
  const buildDir = getBuildDir(pluginDir);
  fs.mkdirSync(buildDir, { recursive: true });

  const tag = `${platform}-${arch}`;
  onStatus(`\r\nDownloading pty binary for ${tag}...`);

  const ptyNodeFile = `pty-${tag}.node`;
  try {
    await downloadToFile(assetUrl(ptyNodeFile), path.join(buildDir, "pty.node"));
  } catch (e) {
    throw new Error(
      `Failed to download pty.node for ${tag}.\n${e}\n\n` +
      `Open an issue: https://github.com/${REPO}`
    );
  }

  if (platform !== "win32") {
    const spawnFile = `spawn-helper-${tag}`;
    try {
      await downloadToFile(assetUrl(spawnFile), path.join(buildDir, "spawn-helper"));
      fs.chmodSync(path.join(buildDir, "spawn-helper"), 0o755);
    } catch (e) {
      throw new Error(`Failed to download spawn-helper for ${tag}.\n${e}`);
    }
  }

  onStatus("Ready.\r\n");
}

export function loadPty(pluginDir: string): any {
  const ptyDir = getPtyDir(pluginDir);
  return require(ptyDir);
}
