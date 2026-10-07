/** Key predicates for the plugin's shortcuts, kept apart so they can be tested without rendering. */

/** Typing into a field, an editor or a select must never trigger a single-letter shortcut. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.closest('[contenteditable="true"], [role="combobox"]') !== null;
}

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

/** The modifier to show next to a shortcut that accepts ⌘ or Ctrl: ⌘ on Apple devices, Ctrl elsewhere. */
export function modifierKeyLabel(
  platform: string = typeof navigator === 'undefined'
    ? ''
    : navigator.platform || navigator.userAgent,
): '⌘' | 'Ctrl' {
  return /mac|iphone|ipad|ipod/iu.test(platform) ? '⌘' : 'Ctrl';
}

type EnterEvent = Pick<
  KeyboardEvent,
  | 'key'
  | 'shiftKey'
  | 'metaKey'
  | 'ctrlKey'
  | 'altKey'
  | 'isComposing'
  | 'keyCode'
>;

/** An Enter that only confirms an IME candidate; Safari reports it with keyCode 229 and `isComposing` false. */
function isImeEnter(event: EnterEvent): boolean {
  return event.isComposing || event.keyCode === 229;
}

/** ⌘/Ctrl + Enter: the submit key of long-form editors (descriptions, knowledge documents), where Enter is a new paragraph. */
export function isModifierEnter(event: EnterEvent): boolean {
  return (
    event.key === 'Enter' &&
    (event.metaKey || event.ctrlKey) &&
    !isImeEnter(event)
  );
}

/** Enter submits a message box (comments, decision comments, AI instructions); ⌘/Ctrl + Enter still does. */
export function isSubmitEnter(event: EnterEvent): boolean {
  return (
    event.key === 'Enter' &&
    !event.shiftKey &&
    !event.altKey &&
    !isImeEnter(event)
  );
}

/** Shift + Enter starts a new line in a message box that submits on Enter. */
export function isNewLineEnter(event: EnterEvent): boolean {
  return event.key === 'Enter' && event.shiftKey && !isImeEnter(event);
}
