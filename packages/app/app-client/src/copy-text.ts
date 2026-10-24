export interface CopyTextOptions {
  /** Put the temporary field inside this focus scope, such as the current dialog. */
  readonly container?: HTMLElement;
}

/**
 * Call directly from a user action. Uses the Clipboard API when available, with an HTTP-compatible fallback.
 * Returns false when copying is refused or unsupported; the caller owns localized manual-copy UI.
 */
export async function copyText(
  text: string,
  options: CopyTextOptions = {},
): Promise<boolean> {
  const doc =
    options.container?.ownerDocument ??
    (typeof document === 'undefined' ? undefined : document);
  if (!doc) return false;
  try {
    // eslint-disable-next-line no-restricted-properties -- This shared helper owns capability detection and the HTTP fallback.
    const clipboard = doc.defaultView?.navigator.clipboard;
    if (typeof clipboard?.writeText === 'function') {
      await clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permissions and browser policy may reject even when the API exists.
  }
  try {
    // On HTTP this runs before any await, preserving the click's user activation.
    return copyWithSelection(doc, text, options.container);
  } catch {
    return false;
  }
}

function copyWithSelection(
  doc: Document,
  text: string,
  container?: HTMLElement,
): boolean {
  const view = doc.defaultView;
  if (!view || typeof doc.execCommand !== 'function') return false;
  const active = doc.activeElement;
  const input =
    active instanceof view.HTMLInputElement ||
    active instanceof view.HTMLTextAreaElement
      ? active
      : null;
  const inputSelection =
    input && input.selectionStart !== null
      ? {
          start: input.selectionStart,
          end: input.selectionEnd,
          direction: input.selectionDirection,
        }
      : null;
  const selection = doc.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) =>
        selection.getRangeAt(index).cloneRange(),
      )
    : [];
  const parent =
    container ??
    active?.closest('dialog[open], [role="dialog"], [role="alertdialog"]') ??
    doc.body;
  if (!parent) return false;
  const field = doc.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.tabIndex = -1;
  field.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;';
  try {
    parent.append(field);
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, text.length);
    // Deprecated, but still needed where the Async Clipboard API is unavailable on HTTP.
    return doc.execCommand('copy');
  } finally {
    field.remove();
    if (active instanceof view.HTMLElement && active.isConnected)
      active.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      for (const range of ranges) selection.addRange(range);
    }
    if (input?.isConnected && inputSelection) {
      input.setSelectionRange(
        inputSelection.start,
        inputSelection.end,
        inputSelection.direction ?? undefined,
      );
    }
  }
}
