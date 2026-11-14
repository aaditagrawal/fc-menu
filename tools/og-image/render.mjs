// Renders tools/og-image/og-image.html to public/og-image.png at 2x (2400x1260).
//
//   bun tools/og-image/render.mjs
//
// Needs a Chrome/Chromium binary; set CHROME_BIN to override discovery.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
// sharp ships with Next.js, so it is present after `bun install`.
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "og-image.html");
const output = resolve(here, "../../public/og-image.png");
const scratch = mkdtempSync(join(tmpdir(), "og-image-"));
const capture = join(scratch, "capture.png");

const WIDTH = 1200;
const HEIGHT = 630;
const SCALE = 2;
// Headless Chrome subtracts its (invisible) window chrome from the viewport, so
// capture a taller window and trim the result back to the card's height.
const SLACK = 200;

const chrome = [
  process.env.CHROME_BIN,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((candidate) => candidate && existsSync(candidate));

if (!chrome) {
  console.error("No Chrome binary found. Set CHROME_BIN to a Chrome or Chromium executable.");
  process.exit(1);
}

const result = spawnSync(
  chrome,
  [
    "--headless=new",
    "--hide-scrollbars",
    `--force-device-scale-factor=${SCALE}`,
    `--window-size=${WIDTH},${HEIGHT + SLACK}`,
    "--virtual-time-budget=4000",
    "--default-background-color=00000000",
    `--screenshot=${capture}`,
    pathToFileURL(source).href,
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) process.exit(result.status ?? 1);

// The card is a few flat colours plus hard-edged dither, so a palette PNG stays
// pixel-exact where JPEG would smear the pattern, and is far smaller.
await sharp(capture)
  .extract({ left: 0, top: 0, width: WIDTH * SCALE, height: HEIGHT * SCALE })
  .png({ palette: true, colours: 128, dither: 0, compressionLevel: 9, effort: 10 })
  .toFile(output);
rmSync(scratch, { recursive: true });
console.log(`Wrote ${output}`);
