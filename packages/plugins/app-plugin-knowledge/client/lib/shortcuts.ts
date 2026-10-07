/** The search shortcut of the knowledge view. */
/** ⌘K on macOS, Ctrl+K elsewhere. */
export function isSearchShortcut(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey'>,
): boolean {
  return (
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    event.key.toLowerCase() === 'k'
  );
}

/** How the shortcut reads on this device. */
export function searchShortcutLabel(
  platform: string = typeof navigator === 'undefined'
    ? ''
    : navigator.platform || navigator.userAgent,
): string {
  return /mac|iphone|ipad|ipod/iu.test(platform) ? '⌘K' : 'Ctrl K';
}
