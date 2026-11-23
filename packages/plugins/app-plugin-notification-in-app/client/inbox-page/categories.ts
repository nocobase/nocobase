/**
 * The notification categories the inbox filters by: each kind's category the viewer may receive, from the notification
 * plugin's `GET /notifications/preferences`, with the unread count of each. Items sent without a kind have no category
 * and show under All only.
 */
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { inboxKeys } from '../inbox/keys.js';
import {
  useInboxReadiness,
  useInboxUnreadByCategory,
} from '../inbox/use-inbox.js';

/** A registrant's text: plain, or a translation key with its namespace and default. */
type KindText =
  | string
  | {
      readonly ns: string;
      readonly key: string;
      readonly defaultValue: string;
    };

interface PreferenceKinds {
  readonly data: {
    readonly kinds: readonly {
      readonly category: KindText;
      readonly categoryKey: string;
    }[];
  };
}

export interface InboxCategoryOption {
  /** The category key, the value of `?category=`. */
  readonly key: string;
  readonly label: string;
  readonly unread: number;
}

/** The categories in the order kinds were registered, each once, with its unread count. */
export function useInboxCategories(): readonly InboxCategoryOption[] {
  const client = useApiClient();
  const ready = useInboxReadiness();
  const { t } = useTranslation();
  const kinds = useQuery({
    enabled: ready,
    queryKey: [...inboxKeys.all, 'categories'],
    queryFn: ({ signal }) =>
      client.request<PreferenceKinds>({
        path: 'notifications/preferences',
        signal,
      }),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const unread = useInboxUnreadByCategory();
  return useMemo(() => {
    const translate = t as unknown as (
      key: string,
      options?: Readonly<Record<string, unknown>>,
    ) => string;
    const text = (value: KindText): string =>
      typeof value === 'string'
        ? value
        : translate(value.key, {
            ns: value.ns,
            defaultValue: value.defaultValue,
          });
    const counts = new Map(
      (unread.data ?? []).map((entry) => [entry.category ?? '', entry.count]),
    );
    const seen = new Map<string, InboxCategoryOption>();
    for (const kind of kinds.data?.data.kinds ?? [])
      if (!seen.has(kind.categoryKey))
        seen.set(kind.categoryKey, {
          key: kind.categoryKey,
          label: text(kind.category),
          unread: counts.get(kind.categoryKey) ?? 0,
        });
    // A category with unread items but no kind left (its plugin was removed) still shows, by its key.
    for (const [key, count] of counts)
      if (key && !seen.has(key))
        seen.set(key, { key, label: key, unread: count });
    return [...seen.values()];
  }, [kinds.data, unread.data, t]);
}

/** The label of a category key, for an item's chip; undefined while unknown. */
export function useInboxCategoryLabel(): (
  key: string | undefined,
) => string | undefined {
  const categories = useInboxCategories();
  return useMemo(() => {
    const labels = new Map(
      categories.map((category) => [category.key, category.label]),
    );
    return (key) => (key ? labels.get(key) : undefined);
  }, [categories]);
}
