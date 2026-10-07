/**
 * One save per tab of the agent page: each section keeps its own draft and reports it here (`useSectionDraft`); the
 * page shows a bar while any section of the tab holds unsaved changes (`unsaved-bar.tsx`), and saves them all in one
 * `PATCH`. Leaving the page by a link, or closing the browser tab, asks first while there is something unsaved.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Context,
} from 'react';
import { useHref, useLocation, useNavigate } from 'react-router';

import type { AgentInput } from '../../../../shared/agents.js';
export type AgentPatch = Partial<AgentInput>;

export interface SectionDraft {
  readonly dirty: boolean;
  /** The section's fields to save, or null when it shows a validation error instead. */
  readonly collect: () => AgentPatch | null;
}

export interface DraftRegistry {
  readonly set: (id: string, draft: SectionDraft | null) => void;
  /** A save is in flight: the sections disable their fields. */
  readonly pending: boolean;
}

const DraftContext: Context<DraftRegistry | null> =
  createContext<DraftRegistry | null>(null);

/** Reports a section's draft to the page while it is mounted. */
export function useSectionDraft(
  id: string,
  dirty: boolean,
  collect: () => AgentPatch | null,
): void {
  const registry = useContext(DraftContext);
  const collectRef = useRef(collect);
  useLayoutEffect(() => {
    collectRef.current = collect;
  });
  useLayoutEffect(() => {
    registry?.set(id, { dirty, collect: () => collectRef.current() });
  }, [registry, id, dirty]);
  useLayoutEffect(() => () => registry?.set(id, null), [registry, id]);
}

/** Whether the page is saving. */
export function useDraftPending(): boolean {
  return useContext(DraftContext)?.pending ?? false;
}

export interface TabDrafts {
  readonly Provider: Context<DraftRegistry | null>['Provider'];
  readonly registry: DraftRegistry;
  readonly dirty: boolean;
  /** Every dirty section's fields merged, or null when one of them refused. */
  readonly collect: () => AgentPatch | null;
}

export function useTabDrafts(pending: boolean): TabDrafts {
  const draftsRef = useRef(new Map<string, SectionDraft>());
  const [dirty, setDirty] = useState(false);
  const set = useCallback((id: string, draft: SectionDraft | null) => {
    if (draft) draftsRef.current.set(id, draft);
    else draftsRef.current.delete(id);
    setDirty([...draftsRef.current.values()].some((item) => item.dirty));
  }, []);
  const registry = useMemo(() => ({ set, pending }), [set, pending]);
  const collect = useCallback((): AgentPatch | null => {
    let patch: AgentPatch = {};
    let refused = false;
    for (const draft of draftsRef.current.values()) {
      if (!draft.dirty) continue;
      // Every section is asked, so each shows its own errors at once.
      const part = draft.collect();
      if (part) patch = { ...patch, ...part };
      else refused = true;
    }
    return refused ? null : patch;
  }, []);
  return { Provider: DraftContext.Provider, registry, dirty, collect };
}

export interface DiscardGuard {
  readonly confirm: (proceed: () => void) => void;
  /** Whether the question is open. */
  readonly asking: boolean;
  /** Closes the question; with `discard`, goes ahead with what asked it. */
  readonly answer: (discard: boolean) => void;
}

/**
 * Asks before discarding unsaved changes: `confirm(proceed)` runs `proceed` at once when nothing is unsaved, else after
 * the person chooses to discard (`DiscardDialog`). While `dirty`, following a link to another page and closing the browser tab ask too.
 */
export function useDiscardGuard(dirty: boolean): DiscardGuard {
  const navigate = useNavigate();
  const location = useLocation();
  const root = useHref('/').replace(/\/$/u, '');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const confirm = useCallback(
    (proceed: () => void) => {
      if (dirty) setPendingAction(() => proceed);
      else proceed();
    },
    [dirty],
  );

  useEffect(() => {
    if (!dirty) return;
    const onClick = (event: MouseEvent): void => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target = event.target;
      const anchor =
        target instanceof Element ? target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (
        (anchor.target && anchor.target !== '_self') ||
        anchor.hasAttribute('download')
      )
        return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const path =
        root && url.pathname.startsWith(root)
          ? url.pathname.slice(root.length) || '/'
          : url.pathname;
      if (path === location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingAction(
        () => () => void navigate(`${path}${url.search}${url.hash}`),
      );
    };
    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [dirty, root, location.pathname, navigate]);

  const answer = useCallback(
    (discard: boolean) => {
      setPendingAction(null);
      if (discard) pendingAction?.();
    },
    [pendingAction],
  );
  return { confirm, asking: pendingAction !== null, answer };
}
