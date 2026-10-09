export function parseJson<T>(value: T | string, label: string): T {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(`Stored mail ${label} is invalid.`, { cause: error });
  }
}

export function jsonOrNull(value: unknown): string | null {
  return value === undefined ? null : JSON.stringify(value);
}

export function chunks<T>(values: readonly T[], size: number): readonly T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

export function toIsoString(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}
