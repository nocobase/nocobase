import { useCallback, useEffect, useState } from 'react';
import {
  NavigationType,
  useLocation,
  useNavigationType,
  type Location,
} from 'react-router';

export interface HistoryGuardOptions {
  /** Leaving would discard edits; back and forward ask first. */
  readonly dirty: boolean;
  /** A write whose result is unknown; back and forward are undone without asking. */
  readonly pending?: boolean;
  /** Lets history entries that keep the edited record, such as another Tab of it, pass unasked. */
  readonly allows?: (location: Location) => boolean;
}

export interface HistoryGuard {
  /** The location to render: the current one, or the one being left while the user decides. */
  readonly location: Location;
  /** True while a traversal is held, so the page keeps rendering `location` instead of the current URL. */
  readonly holding: boolean;
  /** True while the discard confirmation for a held traversal is open. */
  readonly confirming: boolean;
  /** Discards the edits and accepts the traversal. */
  readonly confirm: () => void;
  /** Keeps editing and undoes the traversal. */
  readonly cancel: () => void;
}

interface AcceptedEntry {
  readonly location: Location;
  readonly index: number | undefined;
}

interface HeldTraversal {
  readonly from: AcceptedEntry;
  readonly to: Location;
  readonly delta: number;
  readonly silent: boolean;
  readonly undoing: boolean;
}

function historyIndex(): number | undefined {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === 'number' ? idx : undefined;
}

/**
 * Guards unsaved edits against browser back and forward without a data router. The host renders a `BrowserRouter`,
 * where `useBlocker` is unavailable and the router has already moved by the time any other `popstate` listener runs,
 * so this hook has to live in a component that stays mounted across the traversal. It keeps reporting the location
 * being left, which keeps the edited record and its editor mounted, until the user either discards the edits or keeps
 * editing, which undoes the traversal. React Router records each entry's position in `history.state.idx`; without it,
 * or under a memory router, traversals are not held.
 */
export function useHistoryGuard({
  dirty,
  pending = false,
  allows,
}: HistoryGuardOptions): HistoryGuard {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [accepted, setAccepted] = useState<AcceptedEntry>(() => ({
    location,
    index: historyIndex(),
  }));
  const [held, setHeld] = useState<HeldTraversal | null>(null);
  let current = held;

  // Decided while rendering, and reported by this same pass, so neither the page nor its effects ever observe a
  // location that is about to be undone.
  if (location !== accepted.location && location !== current?.to) {
    const index = historyIndex();
    const delta =
      index !== undefined && accepted.index !== undefined
        ? index - accepted.index
        : 0;
    if (
      navigationType === NavigationType.Pop &&
      delta !== 0 &&
      (dirty || pending) &&
      !allows?.(location)
    ) {
      current = {
        from: accepted,
        to: location,
        delta,
        silent: pending,
        undoing: false,
      };
      setHeld(current);
    } else {
      // Also reached when an undone traversal lands back on the accepted entry.
      setAccepted({ location, index });
      if (current) setHeld(null);
      current = null;
    }
  }

  const silentlyHeld = held?.silent ? held : null;
  useEffect(() => {
    if (silentlyHeld) window.history.go(-silentlyHeld.delta);
  }, [silentlyHeld]);

  const confirm = useCallback((): void => {
    if (!held || held.undoing) return;
    setAccepted({
      location: held.to,
      index:
        held.from.index === undefined
          ? undefined
          : held.from.index + held.delta,
    });
    setHeld(null);
  }, [held]);

  const cancel = useCallback((): void => {
    if (!held || held.undoing) return;
    setHeld({ ...held, undoing: true });
    window.history.go(-held.delta);
  }, [held]);

  return {
    location: current ? current.from.location : location,
    holding: current !== null,
    confirming: current !== null && !current.silent && !current.undoing,
    confirm,
    cancel,
  };
}
