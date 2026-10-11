/**
 * The inbox registry in effect outside the inbox page: the one a provider gives, or Studio's own contributors. Kept apart
 * from `contributions/` so the contributors may import the registry's types without importing themselves.
 */
import {
  rendererFor,
  useFeedItems,
  useProvidedInboxRegistry,
  type FeedItems,
  type InboxEntryRenderer,
  type InboxRegistry,
} from '@/extensions/nocobase-inbox/registry';
import type { InboxEntry } from '@/extensions/nocobase-inbox/model';

import { studioInboxRegistry } from './contributions/index.js';

export function useInboxRegistry(): InboxRegistry {
  return useProvidedInboxRegistry() ?? studioInboxRegistry;
}

/** The renderer of an item in the registry in effect. */
export function useRendererOf(): (
  entry: InboxEntry,
) => InboxEntryRenderer<never> {
  const registry = useInboxRegistry();
  return (entry) => rendererFor(registry, entry);
}

/** The feeds in effect with the items each has waiting on the viewer. */
export function usePendingFeeds(): readonly FeedItems[] {
  return useFeedItems(useInboxRegistry());
}
