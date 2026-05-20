export function clampAccuracy(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function formatAccuracy(value: number): string {
  return `${Math.round(clampAccuracy(value))}%`;
}

export function computeStreak(scores: number[], threshold = 70): number {
  let streak = 0;
  for (let i = scores.length - 1; i >= 0; i--) {
    if (scores[i] >= threshold) streak++;
    else break;
  }
  return streak;
}
