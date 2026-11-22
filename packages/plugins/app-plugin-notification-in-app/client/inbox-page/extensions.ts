/**
 * The inbox's two client extension points, as service tokens a plugin or the application registers into from a
 * client service provider's `boot()`:
 *
 * ```ts
 * class ApprovalsInboxProvider extends ServiceProvider<ClientApplication> {
 *   public override boot(): Promise<void> {
 *     const { container } = this.app;
 *     if (container.has(inboxRenderersToken))
 *       container.resolve(inboxRenderersToken).register(approvalRenderer);
 *     if (container.has(inboxSourcesToken))
 *       container.resolve(inboxSourcesToken).register(approvalSource);
 *     return Promise.resolve();
 *   }
 * }
 * ```
 *
 * - `inboxRenderersToken` — **entry renderers** (`InboxEntryRenderer`): the icon, wording, detail and actions (such as
 *   approve and reject) of the items of some notification kinds (`kinds`) or of some source (`source`). An item no
 *   renderer takes shows its title, body and an Open button.
 * - `inboxSourcesToken` — **pending sources** (`InboxSource`): what the application knows about items (`notices`), what
 *   still waits on the viewer (`waiting`), and how much (`pending`), which the To do view, its count and the header
 *   button's amber badge show.
 */
import { useClientApplication } from '@nocobase/app-client';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import { useMemo, useSyncExternalStore } from 'react';

import type { InboxNotice } from './model.js';
import type { InboxEntryRenderer } from './registry.js';
import type { InboxSource } from './source.js';

/** A list others add to while the application runs; the inbox re-renders when it changes. */
export interface InboxExtensionList<T> {
  /** Adds `value`; returns what removes it. */
  readonly register: (value: T) => () => void;
  readonly list: () => readonly T[];
  readonly subscribe: (listener: () => void) => () => void;
}

export function createInboxExtensionList<T>(
  initial: readonly T[] = [],
): InboxExtensionList<T> {
  let values: readonly T[] = [...initial];
  const listeners = new Set<() => void>();
  const changed = (): void => {
    for (const listener of listeners) listener();
  };
  return {
    register(value) {
      values = [...values, value];
      changed();
      return () => {
        values = values.filter((candidate) => candidate !== value);
        changed();
      };
    },
    list: () => values,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type InboxRenderers = InboxExtensionList<InboxEntryRenderer<never>>;
export type InboxSources = InboxExtensionList<InboxSource>;

export const inboxRenderersToken: ServiceToken<InboxRenderers> =
  createServiceToken<InboxRenderers>(
    '@nocobase/app-plugin-notification-in-app/inbox-renderers',
  );

export const inboxSourcesToken: ServiceToken<InboxSources> =
  createServiceToken<InboxSources>(
    '@nocobase/app-plugin-notification-in-app/inbox-sources',
  );

const EMPTY: InboxExtensionList<never> = createInboxExtensionList<never>();

function useList<T>(token: ServiceToken<InboxExtensionList<T>>): readonly T[] {
  const { services } = useClientApplication();
  const list = services.has(token)
    ? services.resolve(token)
    : (EMPTY as unknown as InboxExtensionList<T>);
  return useSyncExternalStore(list.subscribe, list.list, list.list);
}

/** The entry renderers registered with `inboxRenderersToken`. */
export function useInboxRenderers(): readonly InboxEntryRenderer<never>[] {
  return useList(inboxRenderersToken);
}

/** The registered pending sources as one: what each knows, waits and counts, together. */
export function useInboxSource(): InboxSource {
  const sources = useList(inboxSourcesToken);
  return useMemo(() => combineInboxSources(sources), [sources]);
}

/**
 * Several sources as one: notices and waiting items are concatenated (the first source to describe an item wins),
 * pending counts added per category, and refresh topics joined. A source that fails leaves the others' answers.
 */
export function combineInboxSources(
  sources: readonly InboxSource[],
): InboxSource {
  if (sources.length === 1) return sources[0];
  const settled = async <T>(
    calls: readonly (Promise<T> | undefined)[],
  ): Promise<T[]> =>
    (await Promise.allSettled(calls.filter(Boolean) as Promise<T>[]))
      .filter(
        (result): result is PromiseFulfilledResult<Awaited<T>> =>
          result.status === 'fulfilled',
      )
      .map((result) => result.value);
  return {
    id: sources.length
      ? sources.map((source) => source.id).join('+')
      : 'notifications',
    async notices(ids, request) {
      const seen = new Set<string>();
      const all: InboxNotice[] = [];
      for (const list of await settled(
        sources.map((source) => source.notices?.(ids, request)),
      ))
        for (const notice of list)
          if (!seen.has(notice.notificationId)) {
            seen.add(notice.notificationId);
            all.push(notice);
          }
      return all;
    },
    async waiting(subject, request) {
      const lists = await settled(
        sources.map((source) => source.waiting?.(subject, request)),
      );
      return lists
        .flat()
        .sort((a, b) => b.item.createdAt.localeCompare(a.item.createdAt));
    },
    async pending(request) {
      const totals: Record<string, number> = {};
      for (const counts of await settled(
        sources.map((source) => source.pending?.(request)),
      ))
        for (const [category, count] of Object.entries(counts))
          totals[category] = (totals[category] ?? 0) + count;
      return totals;
    },
    refreshTopics: [
      ...new Set(sources.flatMap((source) => source.refreshTopics ?? [])),
    ],
  };
}
