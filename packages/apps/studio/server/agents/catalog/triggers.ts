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
  // A person started the issue: it entered In progress (`work.ts`), or they handed it to the project manager to go on.
  'started',
  'mention',
  'reply',
  'comment',
  'stepEnded',
  'managerIdle',
  'statusChange',
  'ownerChanged',
  'ownerAccepted',
  // Moved to another project: the work starts again in its working directories (`work.ts`).
  'projectChanged',
  'unblocked',
  'subtasksFinished',
  'planDecided',
  // A linked pull request's checks failed, passed, or it conflicts (`studio/server/git`).
  'prChecksFailed',
  'prChecksPassed',
  'prConflict',
  // Recorded by earlier versions: a workflow stage's rule, and a finished issue's retrospective.
  'stageEntered',
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
