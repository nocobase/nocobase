export function formatDate(
  value: string | null | undefined,
  locale?: string,
): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(locale);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

export function formatLabels(labels: Readonly<Record<string, string>>): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

/** The `X-Release-Labels` value of `labels`; null without any. */
export function labelsHeader(
  labels: Readonly<Record<string, string>>,
): string | null {
  if (Object.keys(labels).length === 0) return null;
  return JSON.stringify(labels).replace(
    /[\u007f-￿]/gu,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

/** The labels of the upload form: `sha` from the commit field wins over one typed among the labels. */
export function uploadLabels(
  commit: string,
  labels: Readonly<Record<string, string>>,
): Record<string, string> {
  const sha = commit.trim();
  return sha ? { ...labels, sha } : { ...labels };
}
