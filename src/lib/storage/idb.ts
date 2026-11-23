"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { LessonDocumentV1 } from "@/lib/curriculum/schema";
import type { NumeralPreference } from "@/lib/khmer/numerals";
import type { MasteryTier } from "@/lib/math/mastery";

export const DB_NAME = "konleuh-kanit-db";
export const DB_VERSION = 1;

export interface LocalStudentProfile {
  id: string;
  displayName: string;
  avatarId: string;
  ageYears: number;
  gradeLevel: number;
  numeralPreference: NumeralPreference;
  audioEnabled: boolean;
  weeklyGoalDays: number;
  activeDates: string[]; // ISO YYYY-MM-DD strings for calm weekly rhythm
  totalXp: number;
  createdAt: string;
  updatedAt: string;
}

export interface LocalLessonProgress {
  id: string; // `${studentId}:${lessonId}`
  studentId: string;
  lessonId: string;
  masteryTier: MasteryTier;
  leitnerBox: number;
  nextReviewAt: string | null;
  accuracyPct: number;
  hintsUsed: number;
  attemptsCount: number;
  completedStepIds: string[];
  completedAt: string | null;
  updatedAt: string;
}

export type SyncOutboxItem =
  | {
      id: string;
      kind: "profile_upsert";
      payload: LocalStudentProfile;
      createdAt: string;
    }
  | {
      id: string;
      kind: "progress_upsert";
      payload: LocalLessonProgress;
      createdAt: string;
    };

interface KonleuhKanitDB extends DBSchema {
  profiles: {
    key: string;
    value: LocalStudentProfile;
  };
  lessonCache: {
    key: string;
    value: LessonDocumentV1;
  };
  progress: {
    key: string;
    value: LocalLessonProgress;
    indexes: { "by-student": string };
  };
  syncOutbox: {
    key: string;
    value: SyncOutboxItem;
  };
}

let dbPromise: Promise<IDBPDatabase<KonleuhKanitDB>> | null = null;

function isIndexedDbAvailable(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

export function getLocalDb(): Promise<IDBPDatabase<KonleuhKanitDB>> | null {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = openDB<KonleuhKanitDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("profiles")) {
          db.createObjectStore("profiles", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("lessonCache")) {
          db.createObjectStore("lessonCache", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("progress")) {
          const progressStore = db.createObjectStore("progress", {
            keyPath: "id",
          });
          progressStore.createIndex("by-student", "studentId");
        }
        if (!db.objectStoreNames.contains("syncOutbox")) {
          db.createObjectStore("syncOutbox", { keyPath: "id" });
        }
      },
    });
  }

  return dbPromise;
}

const ACTIVE_PROFILE_KEY = "konleuh-kanit:active-profile-id";
const NUMERAL_PREF_KEY = "konleuh-kanit:numeral-preference";

export function getSavedNumeralPref(): NumeralPreference {
  if (typeof window === "undefined") return "km";
  try {
    const val = window.localStorage.getItem(NUMERAL_PREF_KEY);
    return val === "latn" ? "latn" : "km";
  } catch {
    return "km";
  }
}

export function saveNumeralPrefLocal(pref: NumeralPreference): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NUMERAL_PREF_KEY, pref);
  } catch {
    // Ignore storage errors in private browsing
  }
}

export function getActiveProfileId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch {
    return null;
  }
}

export function setActiveProfileId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } catch {
    // Ignore storage errors
  }
}

export async function listProfiles(): Promise<LocalStudentProfile[]> {
  const db = await getLocalDb();
  if (!db) return [];
  return db.getAll("profiles");
}

export async function getProfile(
  id: string
): Promise<LocalStudentProfile | undefined> {
  const db = await getLocalDb();
  if (!db) return undefined;
  return db.get("profiles", id);
}

export async function saveProfile(
  profile: LocalStudentProfile,
  queueSync = true
): Promise<void> {
  const db = await getLocalDb();
  if (!db) return;
  const tx = db.transaction(["profiles", "syncOutbox"], "readwrite");
  await tx.objectStore("profiles").put(profile);
  if (queueSync) {
    await tx.objectStore("syncOutbox").put({
      id: `profile:${profile.id}:${Date.now()}`,
      kind: "profile_upsert",
      payload: profile,
      createdAt: new Date().toISOString(),
    });
  }
  await tx.done;
  setActiveProfileId(profile.id);
  saveNumeralPrefLocal(profile.numeralPreference);
}

export async function cacheLessons(lessons: LessonDocumentV1[]): Promise<void> {
  const db = await getLocalDb();
  if (!db || lessons.length === 0) return;
  const tx = db.transaction("lessonCache", "readwrite");
  for (const lesson of lessons) {
    await tx.store.put(lesson);
  }
  await tx.done;
}

export async function getCachedLesson(
  lessonId: string
): Promise<LessonDocumentV1 | undefined> {
  const db = await getLocalDb();
  if (!db) return undefined;
  return db.get("lessonCache", lessonId);
}

export async function listCachedLessons(): Promise<LessonDocumentV1[]> {
  const db = await getLocalDb();
  if (!db) return [];
  return db.getAll("lessonCache");
}

export async function getProgressForStudent(
  studentId: string
): Promise<LocalLessonProgress[]> {
  const db = await getLocalDb();
  if (!db) return [];
  return db.getAllFromIndex("progress", "by-student", studentId);
}

export async function getLessonProgress(
  studentId: string,
  lessonId: string
): Promise<LocalLessonProgress | undefined> {
  const db = await getLocalDb();
  if (!db) return undefined;
  return db.get("progress", `${studentId}:${lessonId}`);
}

export async function saveLessonProgress(
  progress: LocalLessonProgress,
  queueSync = true
): Promise<void> {
  const db = await getLocalDb();
  if (!db) return;
  const tx = db.transaction(["progress", "syncOutbox"], "readwrite");
  await tx.objectStore("progress").put(progress);
  if (queueSync) {
    await tx.objectStore("syncOutbox").put({
      id: `progress:${progress.id}:${Date.now()}`,
      kind: "progress_upsert",
      payload: progress,
      createdAt: new Date().toISOString(),
    });
  }
  await tx.done;
}

export async function listOutboxItems(): Promise<SyncOutboxItem[]> {
  const db = await getLocalDb();
  if (!db) return [];
  return db.getAll("syncOutbox");
}

export async function clearOutboxItems(ids: string[]): Promise<void> {
  const db = await getLocalDb();
  if (!db || ids.length === 0) return;
  const tx = db.transaction("syncOutbox", "readwrite");
  for (const id of ids) {
    await tx.store.delete(id);
  }
  await tx.done;
}
