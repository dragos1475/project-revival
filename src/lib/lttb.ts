// Largest-Triangle-Three-Buckets downsampling. Keeps the visual shape of long series
// (up to 50 000 raw points per variable) while handing SVG charts a few hundred points.
export type Point = [number, number | null];

export function lttb(data: Point[], threshold: number): Point[] {
  const valid = data.filter((p): p is [number, number] => p[1] !== null && Number.isFinite(p[1]));
  if (threshold >= valid.length || threshold < 3) return data;
  const sampled: Point[] = [valid[0]];
  const every = (valid.length - 2) / (threshold - 2);
  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    const rangeStart = Math.floor((i + 1) * every) + 1;
    const rangeEnd = Math.min(Math.floor((i + 2) * every) + 1, valid.length);
    let avgX = 0;
    let avgY = 0;
    for (let j = rangeStart; j < rangeEnd; j++) {
      avgX += valid[j][0];
      avgY += valid[j][1];
    }
    const len = rangeEnd - rangeStart || 1;
    avgX /= len;
    avgY /= len;
    const from = Math.floor(i * every) + 1;
    const to = Math.floor((i + 1) * every) + 1;
    let maxArea = -1;
    let next = from;
    for (let j = from; j < to; j++) {
      const area = Math.abs((valid[a][0] - avgX) * (valid[j][1] - valid[a][1]) - (valid[a][0] - valid[j][0]) * (avgY - valid[a][1]));
      if (area > maxArea) {
        maxArea = area;
        next = j;
      }
    }
    sampled.push(valid[next]);
    a = next;
  }
  sampled.push(valid[valid.length - 1]);
  return sampled;
}
