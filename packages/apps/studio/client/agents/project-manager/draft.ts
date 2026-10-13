/** The settings dialog's form state, and what saving it sends (`settings-dialog.tsx`). */
import {
  COMMENT_RUN_LIMIT_MAX,
  FALLBACK_AFTER_SECONDS_MAX,
  DELEGATION_QUEUE_TIMEOUT_SECONDS_MAX,
  type ProjectManagerPatch,
  type ProjectManagerView,
} from '../../../shared/project-manager.js';

export interface Draft {
  readonly name: string;
  readonly description: string;
  readonly firstChoiceAgentId: string | null;
  readonly fallbackAgentId: string | null;
  readonly principles: string;
  readonly commentRunLimit: string;
  readonly fallbackAfterSeconds: string;
  readonly delegationQueueTimeoutSeconds: string;
}

export function draftOf(view: ProjectManagerView): Draft {
  return {
    name: view.name,
    description: view.description ?? '',
    firstChoiceAgentId: view.firstChoiceAgentId,
    fallbackAgentId: view.fallbackAgentId,
    principles: view.principles ?? view.builtInPrinciples,
    commentRunLimit: String(view.commentRunLimit),
    fallbackAfterSeconds: String(view.fallbackAfterSeconds),
    delegationQueueTimeoutSeconds: String(view.delegationQueueTimeoutSeconds),
  };
}

/** The limit entered, or null when it is not a whole number in range. */
export function limitOf(text: string): number | null {
  const value = Number(text.trim());
  return Number.isInteger(value) && value >= 1 && value <= COMMENT_RUN_LIMIT_MAX
    ? value
    : null;
}
export function fallbackSecondsOf(text: string): number | null {
  const value = Number(text.trim());
  return Number.isInteger(value) &&
    value >= 1 &&
    value <= FALLBACK_AFTER_SECONDS_MAX
    ? value
    : null;
}

export function delegationSecondsOf(text: string): number | null {
  const value = Number(text.trim());
  return Number.isInteger(value) &&
    value >= 1 &&
    value <= DELEGATION_QUEUE_TIMEOUT_SECONDS_MAX
    ? value
    : null;
}

/** What saving sends: the principles as `null` when they are the built-in ones. */
export function patchOf(
  draft: Draft,
  view: ProjectManagerView,
): ProjectManagerPatch {
  const principles = draft.principles.trim();
  return {
    name: draft.name.trim(),
    description: draft.description.trim() === '' ? null : draft.description,
    delegationQueueTimeoutSeconds:
      delegationSecondsOf(draft.delegationQueueTimeoutSeconds) ??
      view.delegationQueueTimeoutSeconds,
    firstChoiceAgentId: draft.firstChoiceAgentId,
    fallbackAgentId:
      draft.fallbackAgentId === draft.firstChoiceAgentId
        ? null
        : draft.fallbackAgentId,
    principles:
      principles === '' || principles === view.builtInPrinciples.trim()
        ? null
        : draft.principles,
    commentRunLimit: limitOf(draft.commentRunLimit) ?? view.commentRunLimit,
    fallbackAfterSeconds:
      fallbackSecondsOf(draft.fallbackAfterSeconds) ??
      view.fallbackAfterSeconds,
  };
}
