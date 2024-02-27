export const SCHEDULE_MODE = {
  STATIC: 0,
  DATE_FIELD: 1,
} as const;

export function parseDateWithoutMs(date: string) {
  return Math.floor(Date.parse(date) / 1000) * 1000;
}
