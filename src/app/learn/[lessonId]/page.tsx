import React from "react";
import { notFound } from "next/navigation";
import { loadAllLessons, loadLessonById } from "@/lib/curriculum/loader";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";

export function generateStaticParams() {
  return loadAllLessons().map((lesson) => ({
    lessonId: lesson.id,
  }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = loadLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  return <LessonPlayer lesson={lesson} />;
}
