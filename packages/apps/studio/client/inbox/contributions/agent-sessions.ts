/**
 * The inbox entry of the agent sessions' notices (source `agentSessions`, sent by `server/inbox/agent-sessions.ts`):
 * the agent of one of the viewer's 「我的 Agent」 sessions waits for their permission (`permissionRequested`), or a
 * turn ended, answered (`turnEnded`) or failed (`turnFailed`), while they were not looking. A session's notices merge
 * into one item; it opens the session, and settles once the viewer has seen it there.
 *
 * The card carries everything it shows, so nothing is loaded.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { MessagesSquareIcon } from 'lucide-react';

import type { InboxEntry } from '@/extensions/nocobase-inbox/model';
import { defineInboxRenderer } from '@/extensions/nocobase-inbox/registry';
import {
  AGENT_SESSIONS_NAMESPACE,
  agentSessionsResources,
} from './agent-sessions.locales.js';

const TYPES = ['permissionRequested', 'turnEnded', 'turnFailed'] as const;

/** A string of the item's data; null otherwise. */
function value(entry: InboxEntry, key: string): string | null {
  const found = entry.notice?.data?.[key];
  return typeof found === 'string' && found !== '' ? found : null;
}

function typeOf(entry: InboxEntry): (typeof TYPES)[number] {
  const type = entry.notice?.type;
  return TYPES.find((each) => each === type) ?? 'turnEnded';
}

export const agentSessionsRenderer = defineInboxRenderer<null>({
  source: 'agentSessions',
  types: TYPES,
  namespace: AGENT_SESSIONS_NAMESPACE,
  resources: agentSessionsResources,
  icon: () => MessagesSquareIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: (entry, where) =>
        t(`${where === 'detail' ? 'headings' : 'types'}.${typeOf(entry)}`),
      text: (entry) => {
        const session =
          value(entry, 'session') ?? entry.notice?.subject?.label ?? '';
        const detail = value(entry, 'detail');
        return {
          title: t(`titles.${typeOf(entry)}`, {
            agent: value(entry, 'agent') ?? t('agent'),
          }),
          sentence: detail
            ? t('sentenceDetail', { session, detail })
            : t('sentence', { session }),
        };
      },
      outcome: (outcome) => t(`outcomes.${outcome}`, { defaultValue: outcome }),
      open: t('open'),
    };
  },
});
