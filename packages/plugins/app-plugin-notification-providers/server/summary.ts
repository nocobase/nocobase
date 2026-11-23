/** How a channel summary shows a secret: whether it is set, never any part of it. */
export function maskedSecret(value: unknown): string {
  return typeof value === 'string' && value ? '••••••' : 'not set';
}

/** A webhook address without its path and query, which carry its token. */
export function webhookOrigin(value: unknown): string {
  if (typeof value !== 'string') return 'not set';
  try {
    return `${new URL(value).origin}/…`;
  } catch {
    return 'invalid';
  }
}

export const PROVIDERS_CONTRIBUTOR =
  '@nocobase/app-plugin-notification-providers';
