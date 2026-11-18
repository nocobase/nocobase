import { useEffect, useState } from 'react';

export interface PendingFeedback {
  readonly visible: boolean;
  readonly longWaiting: boolean;
}

interface FeedbackState extends PendingFeedback {
  readonly busy: boolean;
  readonly identity: unknown;
}

/** Presentation only: never delays the operation, its lock, errors, or completion. */
export function usePendingFeedback(
  busy: boolean,
  identity?: unknown,
): PendingFeedback {
  const [state, setState] = useState<FeedbackState>({
    busy,
    identity,
    visible: false,
    longWaiting: false,
  });
  // Reset before children commit so a new operation cannot inherit old feedback.
  const changed = state.busy !== busy || !Object.is(state.identity, identity);
  if (changed) {
    setState({ busy, identity, visible: false, longWaiting: false });
  }

  useEffect(() => {
    if (!busy) return;
    let active = true;
    const update = (longWaiting: boolean): void => {
      if (!active) return;
      setState((previous) =>
        previous.busy === busy && Object.is(previous.identity, identity)
          ? { busy, identity, visible: true, longWaiting }
          : previous,
      );
    };
    const show = setTimeout(() => update(false), 300);
    const explain = setTimeout(() => update(true), 10_000);
    return () => {
      active = false;
      clearTimeout(show);
      clearTimeout(explain);
    };
  }, [busy, identity]);

  return {
    visible: busy && !changed && state.visible,
    longWaiting: busy && !changed && state.longWaiting,
  };
}
