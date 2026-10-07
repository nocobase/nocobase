/**
 * Workflow events other plugins contribute (`projectsWorkflowEventsToken`), next to the built-in `subtasks.done`. A
 * contributed event is a key and where a workflow may use it; this plugin never knows what it means. Its plugin fires
 * it for the issues it concerns (`Projects.workflowEvents.fire`), and each issue moves along its workflow's transition
 * on the event, if there is one.
 *
 * - A type is looked up on each use, so a plugin may add it after this plugin's services are created.
 * - A definition may keep a transition on an event whose type is gone (its plugin was removed): saving leaves it as it
 *   was, nobody fires it, and the editor shows it as unavailable. A new transition on it is refused.
 * - `from` and `to` limit the categories of status a transition on the event may leave and enter, when saving.
 */
import {
  WORKFLOW_EVENT_PATTERN,
  isBuiltInEvent,
  type WorkflowEventPlacement,
} from '../../../shared/workflows.js';

export type WorkflowEventType = WorkflowEventPlacement;

export interface WorkflowEventTypes {
  /** Adds an event; returns what removes it. Throws when the key is taken, built in or malformed. */
  add(type: WorkflowEventType): () => void;
  get(key: string): WorkflowEventType | undefined;
  list(): readonly WorkflowEventType[];
}

export function createWorkflowEventTypes(): WorkflowEventTypes {
  const types = new Map<string, WorkflowEventType>();
  return {
    add(type) {
      if (!WORKFLOW_EVENT_PATTERN.test(type.key))
        throw new TypeError(
          `Workflow event ${type.key} must match ${String(WORKFLOW_EVENT_PATTERN)}.`,
        );
      if (isBuiltInEvent(type.key) || types.has(type.key))
        throw new TypeError(
          `Workflow event ${type.key} is registered already.`,
        );
      types.set(type.key, type);
      return () => {
        if (types.get(type.key) === type) types.delete(type.key);
      };
    },
    get: (key) => types.get(key),
    list: () => [...types.values()],
  };
}
