/**
 * My tasks' menu entry: the count of tasks waiting for the viewer (`GET /api/taskGroups/summary`'s `waiting`), amber
 * like the inbox's waiting decisions, with the count in its accessible name and tooltip.
 */
import { useTranslation } from '@nocobase/i18n/client';

import { inboxBadgeText } from '@/components/inbox-badge';

import type { NavigationDecoration } from '../../layouts/components/navigation-menu.js';
import { useTaskGroupSummary } from './api.js';

export function useMyTasksNavigation(): NavigationDecoration {
  const { t } = useTranslation();
  const count = useTaskGroupSummary().data?.waiting ?? 0;
  const text = inboxBadgeText(count);
  const title = t('navigation.myIssues');
  const waiting = text
    ? t('taskGroups.navigation.waiting', { title, count })
    : title;
  return {
    badge: text ? { kind: 'decisions', count, text } : null,
    label: waiting,
    hint: waiting,
  };
}
