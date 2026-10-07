/**
 * Workflow events other plugins contribute, as the workflow editor and the timeline show them, given by the
 * application (the assembling application joins its own here; this plugin imports none of them). The server registers the same keys
 * (`projectsWorkflowEventsToken`) with the same placement (`from`, `to`).
 *
 * Each event has a title (what happened, such as "Pull request merged") and an optional hint, as text or i18n keys in
 * its plugin's namespace. The editor offers it on every status of a category it may leave, to choose where the system
 * then moves the issue. A transition on an event nobody gives here is shown as unavailable and can only be removed.
 */
import { createContext, useContext, type Context } from 'react';

import type { StatusCategory } from '../../shared/issues.js';
import type { KindTitle } from '../../shared/kinds.js';
import type { WorkflowEventPlacement } from '../../shared/workflows.js';
import { useTitleText } from './status-rule-types.js';

export interface WorkflowEventUI extends WorkflowEventPlacement {
  readonly title: KindTitle;
  /** One sentence under the title in the editor. */
  readonly hint?: KindTitle;
}

export const WorkflowEventsContext: Context<readonly WorkflowEventUI[]> =
  createContext<readonly WorkflowEventUI[]>([]);

export function useWorkflowEvents(): readonly WorkflowEventUI[] {
  return useContext(WorkflowEventsContext);
}

/** Whether a transition on the event may leave (`from`) or enter (`to`) a status of `category`. */
export function eventAllows(
  event: WorkflowEventPlacement,
  end: 'from' | 'to',
  category: StatusCategory,
): boolean {
  const allowed = event[end];
  return !allowed || allowed.includes(category);
}

/** A contributed event's title as the reader sees it, or null when nobody gives the event. */
export function useEventTitle(): (key: string) => string | null {
  const events = useWorkflowEvents();
  const text = useTitleText();
  return (key) => {
    const event = events.find((item) => item.key === key);
    return event ? text(event.title) : null;
  };
}
