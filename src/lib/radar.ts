export function radarPoints(values: number[], maxR: number): string {
  return values
    .map((v, k) => {
      const angle = (k * 2 * Math.PI) / values.length - Math.PI / 2;
      const r = v * maxR;
      return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
    })
    .join(' ');
}

export function gridPoints(level: number, sides: number, maxR: number): string {
  return Array.from({ length: sides }, (_, k) => {
    const angle = (k * 2 * Math.PI) / sides - Math.PI / 2;
    const r = (level * maxR) / 4;
    return `${Math.cos(angle) * r},${Math.sin(angle) * r}`;
  }).join(' ');
}

export const radarDirections = [
  'Стратегия',
  'Маркетинг',
  'Персонал',
  'Финансы',
  'Медицина',
  'Комплаенс',
  'Операционка',
] as const;

export const defaultRadarValues = [0.8, 0.6, 0.9, 0.7, 0.75, 0.65, 0.85];
