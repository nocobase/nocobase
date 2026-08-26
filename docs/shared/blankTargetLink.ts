export const TARGET_BLANK_PREFIX = '__target_blank__:';

export function encodeTargetBlankHref(href: string): string {
  return `${TARGET_BLANK_PREFIX}${href}`;
}

export function decodeTargetBlankHref(href: string) {
  if (!href.startsWith(TARGET_BLANK_PREFIX)) {
    return {
      href,
      targetBlank: false,
    };
  }

  return {
    href: href.slice(TARGET_BLANK_PREFIX.length) || '/',
    targetBlank: true,
  };
}
