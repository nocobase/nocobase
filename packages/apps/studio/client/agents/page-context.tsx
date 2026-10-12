/**
 * What the projects plugin's pages show, as the chat panel's context. The pages register entries with the projects
 * kit (`usePageContextSource`) under its `PageContextProvider`; this hands each one to the panel
 * (`useChatSources().registerItem` / `registerFilter`) while it is registered. Neither plugin knows the other: Studio
 * maps the kit's kinds onto the kinds the agents plugin resolves on the server.
 */
import { useChatSources } from '@nocobase/app-plugin-agents/client/chat';
import {
  pmKeys,
  usePageContextEntries,
  usePmApi,
  type PageContextEntry,
} from '@nocobase/app-plugin-projects/client/kit';
import type { Label } from '@nocobase/app-plugin-projects/shared/labels';
import type { Member } from '@nocobase/app-plugin-projects/shared/members';
import type { ProjectListItem } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useStatusLabel } from '../inbox/contributions/projects-wording.js';
import { chatItemOf, filterLabel } from './chat-items.js';

/** What the projects plugin's pages already loaded, read without fetching (the pages fetch it). */
function useCached<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
): T | undefined {
  return useQuery<T>({ queryKey, queryFn, enabled: false }).data;
}

/** Registers the page's entries with the chat panel; duplicates collapse there by `kind:id`. */
export function PageContextToChat(): null {
  const { t } = useTranslation();
  const entries = usePageContextEntries();
  const { registerItem, registerFilter } = useChatSources();
  const api = usePmApi();
  const projects = useCached<readonly ProjectListItem[]>(pmKeys.projects, () =>
    api.projects(),
  );
  const labels = useCached<readonly Label[]>(pmKeys.labels, () => api.labels());
  const members = useCached<readonly Member[]>(pmKeys.members, () =>
    api.members(),
  );
  const statusLabel = useStatusLabel();
  // Compared by value: the store hands out a new array whenever any page registers.
  const registered = entries.map((entry) =>
    entry.filters && Object.keys(entry.filters).length > 0
      ? {
          entry,
          label: filterLabel(
            entry.filters,
            {
              project: (id) =>
                projects?.find((project) => project.id === id)?.name ?? null,
              label: (id) =>
                labels?.find((label) => label.id === id)?.name ?? null,
              person: (id) =>
                members?.find((member) => member.userId === id)?.name ?? null,
              status: (key) => statusLabel(key),
            },
            t,
          ),
        }
      : { entry, label: null },
  );
  const serialized = JSON.stringify(registered);
  useEffect(() => {
    const releases: (() => void)[] = [];
    const parsed = JSON.parse(serialized) as {
      readonly entry: PageContextEntry;
      readonly label: string | null;
    }[];
    for (const { entry, label } of parsed) {
      const item = chatItemOf(entry);
      if (item) releases.push(registerItem(item));
      if (entry.filters && label !== null)
        releases.push(
          registerFilter({ page: entry.kind, params: entry.filters, label }),
        );
    }
    return () => {
      for (const release of releases) release();
    };
  }, [serialized, registerItem, registerFilter]);
  return null;
}
