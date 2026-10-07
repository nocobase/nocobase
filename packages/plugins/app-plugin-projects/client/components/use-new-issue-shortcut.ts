import { type RefCallback, useCallback, useEffect, useRef } from 'react';

import { isEditableTarget } from './pm-shortcut-keys.js';

/**
 * `C` opens "New issue" (`onCreate`) on a page that shows the New issue button. It is ignored while typing, while a
 * dialog is open, without `issues/create` (`canCreate`), since it would only open a form the server refuses, and
 * while the page is covered by a child page laid over it (the element the returned ref marks sits in an `inert`
 * subtree), so the page on top, which may host its own, decides.
 */
export function useNewIssueShortcut({
  onCreate,
  canCreate,
}: {
  readonly onCreate: () => void;
  readonly canCreate: boolean;
}): RefCallback<HTMLElement> {
  const anchorRef = useRef<HTMLElement | null>(null);
  const onCreateRef = useRef(onCreate);
  useEffect(() => {
    onCreateRef.current = onCreate;
  });
  useEffect(() => {
    if (!canCreate) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }
      if (event.key !== 'c' && event.key !== 'C') return;
      if (isEditableTarget(event.target)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        return;
      }
      if (anchorRef.current?.closest('[inert]')) return;
      event.preventDefault();
      onCreateRef.current();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canCreate]);
  return useCallback((element: HTMLElement | null) => {
    anchorRef.current = element;
  }, []);
}
