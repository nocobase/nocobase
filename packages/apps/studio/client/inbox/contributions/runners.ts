/**
 * The inbox entry of the agents plugin's runner notices (source `runners`, sent by `server/inbox/runners.ts`):
 *
 * - `runner_upgrade_required`: a runtime's owner hears that its runner speaks a protocol Studio does not serve,
 *   with the runner's version and protocol, the protocols Studio needs, and the runner Studio serves when it serves one.
 *   It opens the Runtimes page, where the runtime shows the same and the command that updates it.
 *
 * The card carries everything it shows, so nothing is loaded.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { formatRunWait } from '@nocobase/app-plugin-agents/client/runs';
import { MonitorUpIcon } from 'lucide-react';

import type { InboxEntry } from '@/extensions/nocobase-inbox/model';
import { defineInboxRenderer } from '@/extensions/nocobase-inbox/registry';
import { RUNNERS_NAMESPACE, runnersResources } from './runners.locales.js';

/** A string or number of the item's data, as text; null otherwise. */
function value(entry: InboxEntry, key: string): string | null {
  const found = entry.notice?.data?.[key];
  if (typeof found === 'number') return String(found);
  return typeof found === 'string' && found !== '' ? found : null;
}

export const runnersRenderer = defineInboxRenderer<null>({
  source: 'runners',
  types: ['runner_upgrade_required', 'run_secrets_not_allowed'],
  namespace: RUNNERS_NAMESPACE,
  resources: runnersResources,
  icon: () => MonitorUpIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: (entry, where) =>
        t(
          `${where === 'detail' ? 'headings' : 'types'}.${entry.notice?.type ?? 'runner_upgrade_required'}`,
        ),
      text: (entry) => {
        if (entry.notice?.type === 'run_secrets_not_allowed')
          return {
            title: t('headings.run_secrets_not_allowed'),
            sentence: formatRunWait(t, {
              reason: 'secretsNotAllowed',
              params: { variables: value(entry, 'variables') ?? '' },
            }),
          };
        const min = Number(value(entry, 'minProtocolVersion'));
        const max = Number(value(entry, 'maxProtocolVersion'));
        const protocol = Number(value(entry, 'protocolVersion'));
        const latest = value(entry, 'latestVersion');
        const values = {
          name:
            value(entry, 'runnerName') ??
            entry.notice?.subject?.label ??
            t('unknown'),
          version: value(entry, 'runnerVersion') ?? t('unknown'),
          protocol: Number.isFinite(protocol) ? protocol : t('unknown'),
          required: min === max ? String(max) : `${min}–${max}`,
          latest,
        };
        return {
          title: t('title', values),
          sentence: [
            t(protocol > max ? 'newerSentence' : 'sentence', values),
            latest ? t('latest', values) : null,
          ]
            .filter(Boolean)
            .join(' '),
        };
      },
      open: t('open'),
    };
  },
  context: (entry) => {
    if (entry.notice?.subject?.type !== 'runner') return {};
    const runnerId = value(entry, 'subjectId');
    return runnerId ? { ids: [runnerId] } : {};
  },
});
