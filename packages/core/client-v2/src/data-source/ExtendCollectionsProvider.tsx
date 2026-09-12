/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionOptions } from '@nocobase/flow-engine';
import React, { FC, ReactNode, useEffect, useRef } from 'react';
import { useApp } from '../hooks';

export interface ExtendCollectionsProviderProps {
  /** Data source key to extend. Defaults to `'main'`. */
  dataSource?: string;
  /** Collections to surface for the lifetime of this provider's subtree. */
  collections: CollectionOptions[];
  /**
   * When `true`, re-sync the data source whenever the `collections` prop
   * reference changes after mount: add entries newly present in the prop and
   * remove entries no longer present (only those this provider registered).
   * The diff runs in the same render as the prop change so children see the
   * new state on their first render — at the cost of one observable mutation
   * per change.
   *
   * Defaults to `false`. Most pages pass a stable (often module-level)
   * `collections` list and don't need this; leaving it off avoids accidental
   * re-registration when callers forget to memoize. Enable only when your
   * collection list legitimately varies during the provider's lifetime.
   */
  syncOnChange?: boolean;
  children?: ReactNode;
}

/**
 * Mount-scoped collection injector. Adds the given `collections` to the target
 * data source on first render — synchronously, so children can read
 * `getCollection(name)` on their own first render — and removes them on
 * unmount. Survives mid-session data-source reloads via the
 * `dataSource:loaded` event by re-registering only the names this provider
 * owns.
 *
 * Use this for client-only collections — e.g. a `schema-only` server
 * collection that isn't auto-published to the v2 data source, or a pure
 * UI-side mirror — so downstream components (like `<CollectionFilter>`) can
 * resolve the collection by name.
 *
 * Default behavior is "static-at-mount": subsequent changes to the
 * `collections` prop are ignored. Pass `syncOnChange` to opt into diffing on
 * prop change.
 */
export const ExtendCollectionsProvider: FC<ExtendCollectionsProviderProps> = ({
  dataSource = 'main',
  collections,
  syncOnChange = false,
  children,
}) => {
  const app = useApp();
  // Lazy-ref init guard. `ownedRef.current === null` only on the first render;
  // once populated, StrictMode dev's second render and any subsequent
  // re-render see a non-null ref and skip re-registering. React docs bless
  // this idiom for "init exactly once on mount" — see "Avoiding recreating
  // the ref contents".
  const ownedRef = useRef<CollectionOptions[] | null>(null);
  // Identity of the `collections` reference we last reacted to; gates the
  // opt-in diff so StrictMode's double-render doesn't diff twice.
  const lastCollectionsRef = useRef<CollectionOptions[] | null>(null);

  if (ownedRef.current === null) {
    const ds = app.dataSourceManager?.getDataSource?.(dataSource);
    const owned: CollectionOptions[] = [];
    if (ds) {
      for (const c of collections) {
        if (ds.getCollection?.(c.name)) continue;
        ds.addCollection?.(c);
        owned.push(c);
      }
    }
    ownedRef.current = owned;
    lastCollectionsRef.current = collections;
  } else if (syncOnChange && lastCollectionsRef.current !== collections) {
    const ds = app.dataSourceManager?.getDataSource?.(dataSource);
    if (ds) {
      const nextNames = new Set(collections.map((c) => c.name));
      const prevOwned = new Map(ownedRef.current.map((c) => [c.name, c]));
      for (const name of prevOwned.keys()) {
        if (!nextNames.has(name)) ds.removeCollection?.(name);
      }
      const nextOwned: CollectionOptions[] = [];
      for (const c of collections) {
        const previous = prevOwned.get(c.name);
        if (previous) {
          // First-registered wins: keep the existing options object, mirroring
          // the original behavior where re-adding a present name was a no-op.
          // Callers who need to update a collection should remount the
          // provider (e.g. `key={signature}`).
          nextOwned.push(previous);
          continue;
        }
        if (ds.getCollection?.(c.name)) continue;
        ds.addCollection?.(c);
        nextOwned.push(c);
      }
      ownedRef.current = nextOwned;
    }
    lastCollectionsRef.current = collections;
  }

  useEffect(() => {
    const onLoaded = (event: Event) => {
      const key = (event as CustomEvent<{ dataSourceKey: string }>).detail?.dataSourceKey;
      if (key !== dataSource && key !== '*') return;
      const ds = app.dataSourceManager?.getDataSource?.(dataSource);
      if (!ds || !ownedRef.current) return;
      // dataSource was just reloaded from the server — our owned client-only
      // entries got wiped. Re-add only the ones we own, using the snapshot in
      // the ref so we don't accidentally seize names this provider never
      // registered.
      for (const c of ownedRef.current) {
        if (ds.getCollection?.(c.name)) continue;
        ds.addCollection?.(c);
      }
    };
    app.eventBus?.addEventListener('dataSource:loaded', onLoaded);
    return () => {
      app.eventBus?.removeEventListener('dataSource:loaded', onLoaded);
      const ds = app.dataSourceManager?.getDataSource?.(dataSource);
      const owned = ownedRef.current ?? [];
      ownedRef.current = null;
      lastCollectionsRef.current = null;
      if (!ds) return;
      for (const c of owned) ds.removeCollection?.(c.name);
    };
    // `collections` / `syncOnChange` intentionally excluded — they drive the
    // render-phase init/diff above, not this effect. The listener reads
    // `ownedRef` each time it fires (async, never during render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, dataSource]);

  return <>{children}</>;
};

export default ExtendCollectionsProvider;
