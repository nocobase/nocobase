import { useEffect, useRef } from 'react';

/**
 * Names what a view reads or a write changed as a slash-separated path, such
 * as `projects`, `projects/42` or `customers/7/contacts`. Scopes overlap when
 * one is a segment prefix of the other: a list reading `projects` is affected
 * by a write to `projects/42`, and a detail reading `projects/42` by a write
 * to `projects`, but `projects/43` is not.
 */
export type DataScope = string;

/** One write the server confirmed, or whose outcome must be verified. */
export interface DataChange {
  /** Every entity or relation the write touched. */
  readonly scopes: readonly DataScope[];
  /**
   * The server's response for an exact scope, in the shape a read of that
   * scope returns, or `null` when the record no longer exists. Omit it when
   * the outcome is unknown: affected views then read the server again.
   */
  readonly results?: Readonly<Record<DataScope, unknown>>;
}

type Listener = (change: DataChange) => void;
const listeners = new Set<Listener>();

export function scopesOverlap(a: DataScope, b: DataScope): boolean {
  const left = a.split('/').filter(Boolean);
  const right = b.split('/').filter(Boolean);
  const length = Math.min(left.length, right.length);
  return (
    length > 0 &&
    left.slice(0, length).join('/') === right.slice(0, length).join('/')
  );
}

/**
 * Tells mounted views that a write changed these scopes. Call it once per
 * write, after the server confirmed it or when its outcome is unknown, never
 * before the request settles. Unmounted views read fresh data when they mount.
 */
export function announceDataChange(change: DataChange): void {
  for (const listener of [...listeners]) listener(change);
}

/** Runs `onChange` for each announced change overlapping one of `scopes`. */
export function useDataChange(
  scopes: readonly DataScope[] | undefined,
  onChange: (change: DataChange) => void,
): void {
  const latestRef = useRef({ scopes, onChange });
  useEffect(() => {
    latestRef.current = { scopes, onChange };
  });
  useEffect(() => {
    const listener: Listener = (change) => {
      const { scopes: own, onChange: notify } = latestRef.current;
      if (
        own?.some((scope) =>
          change.scopes.some((changed) => scopesOverlap(scope, changed)),
        )
      )
        notify(change);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
}
