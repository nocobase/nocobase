/** UUID v4 for client/server correlation, including on insecure HTTP origins. */
export function createBrowserId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/** Copy during a user gesture, falling back when the Clipboard API is unavailable or denied. */
export async function copyText(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // A denied modern clipboard can still allow the user-initiated legacy copy.
  }
  const active = document.activeElement;
  const selection = window.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) =>
        selection.getRangeAt(index),
      )
    : [];
  const input = document.createElement('textarea');
  input.value = text;
  input.readOnly = true;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  // Keep the control inside an active modal's focus boundary.
  (active?.closest('[role="dialog"], dialog') ?? document.body).append(input);
  try {
    input.select();
    if (!document.execCommand('copy'))
      throw new Error('Could not copy to the clipboard.');
  } finally {
    input.remove();
    if (active instanceof HTMLElement) active.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      for (const range of ranges) selection.addRange(range);
    }
  }
}
