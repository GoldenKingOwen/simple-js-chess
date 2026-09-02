import type { Metadata } from "next";
import { LessonClient } from "./lesson-client";

export const metadata: Metadata = {
  title: "Lesson",
  description: "A lesson in the guided learning path.",
  robots: { index: false },
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ tier: string; lessonId: string }>;
}) {
  const { tier, lessonId } = await params;
  return <LessonClient key={lessonId} tier={tier} slug={lessonId} />;
}
