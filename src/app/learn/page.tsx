import React from "react";
import { getEarlyFoundationsPath } from "@/lib/curriculum/loader";
import { LearningPathClient } from "@/components/learn/LearningPathClient";

export default function LearnDashboardPage() {
  const path = getEarlyFoundationsPath();
  return <LearningPathClient path={path} />;
}
