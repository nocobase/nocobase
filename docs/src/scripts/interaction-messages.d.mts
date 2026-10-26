export function translator(
  lang: string,
): (text: string, values?: Record<string, string | number>) => string;
