/**
 * The news Studio delivers to a conversation (`server/agents/conversation/plan-hooks.ts`), in the viewer's language:
 * a decided operation plan (`planDecided`, with its outcome and title). Other news reads as its English title.
 */
import type {
  NewsNotice,
  Translate,
} from '@nocobase/app-plugin-agents/client/chat';

import { STUDIO_NAMESPACE } from '../../shared/access.js';

/** The outcomes a decided plan's news names. */
const PLAN_OUTCOMES: ReadonlySet<string> = new Set([
  'executed',
  'failed',
  'stale',
  'undone',
]);

export function studioNewsText(
  notice: NewsNotice,
  t: Translate,
): string | null {
  const outcome = notice.params?.outcome;
  if (notice.type !== 'planDecided' || !outcome || !PLAN_OUTCOMES.has(outcome))
    return null;
  return t(`studioAgents.news.planDecided.${outcome}`, {
    ns: STUDIO_NAMESPACE,
    title: notice.params?.title ?? '',
    defaultValue: notice.title,
  });
}
