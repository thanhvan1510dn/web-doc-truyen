export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export function getTotalChapters(story: { volumes: { chapters: any[] }[] }): number {
  return story.volumes.reduce((acc, vol) => acc + vol.chapters.length, 0);
}
