/** Whether a key press belongs to a text field, a menu or a dialog rather than to the list. */
export function typingIn(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true;
  return Boolean(
    target.closest(
      '[role=dialog],[role=alertdialog],[role=menu],[role=listbox]:not([data-task-list]),[contenteditable=true]',
    ),
  );
}
