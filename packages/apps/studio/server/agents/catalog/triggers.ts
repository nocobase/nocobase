/**
 * What Studio's issues are to the agents plugin, in one place so the server and the pages agree: the subject kind,
 * the triggers a run on an issue starts for (`input.payload.trigger`), and the names people read for them
 * (`studioAgents.triggers`).
 */
import type { I18nText } from '@nocobase/app-plugin-agents/shared/i18n';

import { STUDIO_NAMESPACE } from '../../../shared/access.js';

/** The subject kind of an issue's runs. */
export const ISSUE_SUBJECT = 'issue';

/** What starts a run on an issue. */
export const ISSUE_TRIGGERS = [
  'assigned',
  'mention',
  'reply',
  'comment',
  'statusChange',
  'ownerChanged',
  // Moved to another project: the work starts again in its working directories (`work.ts`).
  'projectChanged',
  'unblocked',
  'subtasksFinished',
  'stageEntered',
  'planDecided',
  // A linked pull request's checks failed, or it conflicts (`studio/server/git`).
  'prChecksFailed',
  'prConflict',
  // A finished issue's retrospective (`studio/server/knowledge/retrospective.ts`).
  'retrospective',
] as const;

export type IssueTrigger = (typeof ISSUE_TRIGGERS)[number];

const text = (key: string): I18nText => ({ key, ns: STUDIO_NAMESPACE });

/** An issue, as the agents plugin's pages name it. */
export const ISSUE_TITLE: I18nText = text('studioAgents.subjects.issue');

/** The group an issue belongs to, a project, as the agents plugin's usage page names it. */
export const PROJECT_TITLE: I18nText = text('studioAgents.subjects.project');

/** Each trigger's name in the run panel. */
export const ISSUE_TRIGGER_TITLES: Readonly<Record<IssueTrigger, I18nText>> =
  Object.fromEntries(
    ISSUE_TRIGGERS.map((trigger) => [
      trigger,
      text(`studioAgents.triggers.${trigger}`),
    ]),
  ) as Record<IssueTrigger, I18nText>;
