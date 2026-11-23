import fs from "node:fs";
import path from "node:path";
import { stripZwsp } from "../src/lib/khmer/numerals";
import type { LessonDocumentV1 } from "../src/lib/curriculum/schema";
import type { DailyPuzzlePackV1 } from "../src/lib/curriculum/daily";

const PATHS_DIR = path.join(process.cwd(), "content", "paths");
const DAILY_FILE = path.join(process.cwd(), "content", "daily", "puzzles.json");
const OUT_DIR = path.join(process.cwd(), "public", "audio", "steps");

function splitTextChunks(text: string, maxLen = 170): string[] {
  const clean = stripZwsp(text).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const chunks: string[] = [];
  let remaining = clean;
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf(" ", maxLen);
    if (cut < 40) cut = remaining.lastIndexOf("។", maxLen);
    if (cut < 40) cut = maxLen;
    chunks.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function synthesizeKhmerMp3(text: string): Promise<Buffer> {
  const chunks = splitTextChunks(text);
  const parts: Buffer[] = [];
  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=km&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) {
      throw new Error(`TTS HTTP ${res.status} for chunk: ${chunk}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    parts.push(buf);
  }
  return Buffer.concat(parts);
}

function collectLessonFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectLessonFiles(full));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      results.push(full);
    }
  }
  return results.sort();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const lessonFiles = collectLessonFiles(PATHS_DIR);
  let generatedCount = 0;

  for (const filePath of lessonFiles) {
    const lesson = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    ) as LessonDocumentV1;
    let changed = false;

    for (const step of lesson.steps) {
      const mp3File = path.join(OUT_DIR, `${step.id}.mp3`);
      const audioUrl = `/audio/steps/${step.id}.mp3`;

      if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size < 500) {
        const mp3 = await synthesizeKhmerMp3(step.promptKm);
        fs.writeFileSync(mp3File, mp3);
        generatedCount++;
        process.stdout.write(`Generated ${audioUrl} (${mp3.byteLength} bytes)\n`);
      }

      if (step.audioUrl !== audioUrl) {
        step.audioUrl = audioUrl;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, `${JSON.stringify(lesson, null, 2)}\n`, "utf-8");
    }
  }

  // Also generate audio for daily puzzles
  if (fs.existsSync(DAILY_FILE)) {
    const pack = JSON.parse(
      fs.readFileSync(DAILY_FILE, "utf-8")
    ) as DailyPuzzlePackV1;
    let changed = false;

    for (const puzzle of pack.puzzles) {
      const step = puzzle.step;
      const mp3File = path.join(OUT_DIR, `${step.id}.mp3`);
      const audioUrl = `/audio/steps/${step.id}.mp3`;

      if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size < 500) {
        const mp3 = await synthesizeKhmerMp3(step.promptKm);
        fs.writeFileSync(mp3File, mp3);
        generatedCount++;
        process.stdout.write(`Generated ${audioUrl} (${mp3.byteLength} bytes)\n`);
      }

      if (step.audioUrl !== audioUrl) {
        step.audioUrl = audioUrl;
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(DAILY_FILE, `${JSON.stringify(pack, null, 2)}\n`, "utf-8");
    }
  }

  console.log(`\nDone! Generated ${generatedCount} Khmer MP3 audio files in public/audio/steps/.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
