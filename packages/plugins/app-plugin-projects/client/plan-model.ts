/**
 * Operation plans as pure data, with nothing to render and no request to make: the state a plan is in, what may be
 * done with it, its rows with unsaved edits applied, moving a row in or out of the tree of new issues, the `PATCH` body
 * of the edits, the countdown to its expiry or the end of its undo window, and the hues of its statuses and risk flags.
 * The UI Library's `plan-card` block reads these here, and the hooks that load and act on a plan from `client/kit`.
 */
export {
  abilitiesOf,
  blockingRefs,
  canIndent,
  canOutdent,
  canRemove,
  counts,
  createdTitle,
  decodeProjectTarget,
  editRequest,
  effectiveStatus,
  encodeProjectTarget,
  flagsOf,
  hoursLeft,
  indentParams,
  isClosedPlan,
  mergeEdits,
  outdentParams,
  patchParams,
  planCountdown,
  planHref,
  planObjectHref,
  planObjectLabel,
  referencedRefs,
  refOf,
  removalEdits,
  restoreEdits,
  riskyRows,
  rowViews,
  type PlanAbilities,
  type PlanCountdown,
  type PlanEdits,
  type RowEdit,
  type RowView,
} from './kit/plans/model.js';
export {
  FLAG_TONE as PLAN_FLAG_TONE,
  PLAN_STATUS_TONE,
  type PlanTone,
} from './kit/plans/tones.js';
