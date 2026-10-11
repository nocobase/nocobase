/**
 * How the projects kit's page entries (`PageContextEntry`) become chat context items: only the kinds the agents plugin
 * resolves on the server get a chip.
 */
import type { ChatContextItem } from '@nocobase/app-plugin-agents/client/chat';
import type { PageContextEntry } from '@nocobase/app-plugin-projects/client/kit';

/**
 * The kit's kinds the server resolves (`issue`, `project`; an inbox item is `inboxItem` there). A kind missing here
 * (`plan`) would be dropped by the server, so it gets no chip.
 */
const CHAT_KINDS: Readonly<Record<string, string>> = {
  issue: 'issue',
  project: 'project',
  inbox: 'inboxItem',
};

/** The chat item a page entry names, or null when the panel cannot send it. */
export function chatItemOf(
  entry: PageContextEntry | undefined,
): ChatContextItem | null {
  const kind = entry ? CHAT_KINDS[entry.kind] : undefined;
  if (!entry?.id || !kind) return null;
  return { kind, id: entry.id, label: entry.label ?? entry.id };
}

/** Names a filter's values stand for, as far as the page has loaded them. */
export interface FilterNames {
  readonly project: (id: string) => string | null;
  readonly label: (id: string) => string | null;
  readonly person: (id: string) => string | null;
  readonly status: (key: string) => string;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * What a list's filter chip says: each value by the name it stands for (a project's name, a label, a person), the
 * search text quoted, in the page's order. The agent still gets the ids.
 */
export function filterLabel(
  filters: Readonly<Record<string, string>>,
  names: FilterNames,
  t: Translate,
): string {
  const someone = () => t('pmChat.filters.someone');
  return Object.entries(filters)
    .map(([key, value]) => {
      switch (key) {
        case 'q':
          return t('pmChat.filters.search', { value });
        case 'statusKey':
          return names.status(value);
        case 'projectId':
          return names.project(value) ?? t('pmChat.filters.project');
        case 'labelId':
          return `#${names.label(value) ?? t('pmChat.filters.label')}`;
        case 'ownerUserId':
          return t('pmChat.filters.owner', {
            name: names.person(value) ?? someone(),
          });
        case 'executorId':
          return t('pmChat.filters.executor', {
            name: names.person(value) ?? someone(),
          });
        default:
          return `${key}=${value}`;
      }
    })
    .join(' · ');
}
