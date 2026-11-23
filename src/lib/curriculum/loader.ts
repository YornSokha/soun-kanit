import fs from "node:fs";
import path from "node:path";
import { LessonDocumentV1Schema, type LessonDocumentV1 } from "./schema";

const CONTENT_ROOT = path.join(process.cwd(), "content", "paths");

export interface LearningPathMeta {
  id: string;
  titleKm: string;
  subtitleKm: string;
  lessons: LessonDocumentV1[];
}

export function loadLessonsForPath(pathId: string): LessonDocumentV1[] {
  const dir = path.join(CONTENT_ROOT, pathId);
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  const lessons: LessonDocumentV1[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const parsedJson: unknown = JSON.parse(raw);
    const result = LessonDocumentV1Schema.safeParse(parsedJson);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw new Error(`Invalid lesson JSON in ${file}: ${issues}`);
    }
    lessons.push(result.data);
  }

  return lessons.sort((a, b) => a.order - b.order);
}

export function loadAllLessons(): LessonDocumentV1[] {
  if (!fs.existsSync(CONTENT_ROOT)) {
    return [];
  }

  const pathDirs = fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const all: LessonDocumentV1[] = [];
  for (const pathId of pathDirs) {
    all.push(...loadLessonsForPath(pathId));
  }
  return all.sort((a, b) => a.order - b.order);
}

export function loadLessonById(lessonId: string): LessonDocumentV1 | null {
  const all = loadAllLessons();
  return all.find((lesson) => lesson.id === lessonId) ?? null;
}

export function getEarlyFoundationsPath(): LearningPathMeta {
  return {
    id: "early-foundations",
    titleKm: "គ្រឹះគណិតវិទ្យាថ្នាក់ដំបូង",
    subtitleKm: "រៀនរាប់ បន្ទាត់ចំនួន វិធីបូក វិធីដក និងការបង្គ្រប់ ១០ តាមរយៈរូបភាពរស់រវើក",
    lessons: loadLessonsForPath("early-foundations"),
  };
}
