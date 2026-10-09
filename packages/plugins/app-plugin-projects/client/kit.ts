/**
 * Components and hooks the application reuses on its own pages (such as an application's members, roles and inbox), so they look and behave
 * like the plugin's. Components that translate their own text are bound to this plugin's namespace; the text an
 * application passes in stays its own.
 */
import { withNamespace } from '@nocobase/i18n/client';

export {
  StatusRuleTypesContext,
  type StatusRuleConfig,
  type StatusRuleEditorProps,
  type StatusRuleGroup,
  type StatusRuleStatus,
  type StatusRuleSummaryProps,
  type StatusRuleTypeUI,
} from './lib/status-rule-types.js';
export {
  WorkflowEventsContext,
  type WorkflowEventUI,
} from './lib/workflow-events.js';
/** How a queued request to AI says why it waits, such as with the agents plugin's `formatRunWait`. */
export {
  IntakeWaitFormatContext,
  type IntakeWait,
  type IntakeWaitFormat,
} from './lib/intake-wait.js';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import { DataTable as BaseDataTable } from './components/data-table.js';
import { PmExpandableTextarea as BaseExpandableTextarea } from './components/pm-expandable-textarea.js';
import { PmStatusBadge as BaseStatusBadge } from './components/pm-badges.js';
import { PmMultiSelect as BaseMultiSelect } from './components/pm-multi-select.js';
import {
  PmDetailSkeleton as BaseDetailSkeleton,
  PmEmpty as BaseEmpty,
  PmListSkeleton as BaseListSkeleton,
  PmLoadError as BaseLoadError,
} from './components/pm-states.js';
import { PmTag as BaseTag } from './components/pm-tag.js';
import { PmApiKeyTag as BaseApiKeyTag } from './components/pm-api-key-tag.js';
import { UnsavedChangesBoundary as BaseUnsavedChangesBoundary } from './components/unsaved-changes.js';
import { InvitationsSection as BaseInvitations } from './pages/config/members/invitations-section.js';
import { InviteDialog as BaseInviteDialog } from './pages/config/members/invite-dialog.js';
import { PlanListItem as BasePlanListItem } from './kit/plans/plan-list-item.js';
import { SectionHeading as BaseSectionHeading } from './pages/config/section-heading.js';
import { SettingsPageHeader as BaseSettingsPageHeader } from './pages/config/settings-page-header.js';
import { StartDialog as BaseStartDialog } from './pages/issues/detail/start-dialog.js';
import { NewIssueButton as BaseNewIssueButton } from './pages/issues/new-issue-button.js';
import { PmShortcuts as BasePmShortcuts } from './components/pm-shortcuts.js';
import { WorkflowSelect as BaseWorkflowSelect } from './pages/projects/workflow-select.js';

const bound = <T>(component: T): T =>
  withNamespace(ACCESS_NAMESPACE, component as never) as T;

export const DataTable: typeof BaseDataTable = bound(BaseDataTable);
/** A compact text area for long text that expands on demand, such as a status rule's instruction in its editor. */
export const PmExpandableTextarea: typeof BaseExpandableTextarea = bound(
  BaseExpandableTextarea,
);
export const PmMultiSelect: typeof BaseMultiSelect = bound(BaseMultiSelect);
export const PmStatusBadge: typeof BaseStatusBadge = bound(BaseStatusBadge);
export const PmDetailSkeleton: typeof BaseDetailSkeleton =
  bound(BaseDetailSkeleton);
export const PmEmpty: typeof BaseEmpty = bound(BaseEmpty);
export const PmListSkeleton: typeof BaseListSkeleton = bound(BaseListSkeleton);
export const PmLoadError: typeof BaseLoadError = bound(BaseLoadError);
export const PmTag: typeof BaseTag = bound(BaseTag);
/** "API key", beside the name of an actor that is an organization's API key. */
export const PmApiKeyTag: typeof BaseApiKeyTag = bound(BaseApiKeyTag);
export const SectionHeading: typeof BaseSectionHeading =
  bound(BaseSectionHeading);
/** A settings page's `h1`, description and actions, with the read-only notice when the viewer may not change it. */
export const SettingsPageHeader: typeof BaseSettingsPageHeader = bound(
  BaseSettingsPageHeader,
);
export const InvitationsSection: typeof BaseInvitations =
  bound(BaseInvitations);
export const InviteDialog: typeof BaseInviteDialog = bound(BaseInviteDialog);
export const UnsavedChangesBoundary: typeof BaseUnsavedChangesBoundary = bound(
  BaseUnsavedChangesBoundary,
);
/** One plan in a list: title, status, source, proposer and time, linking to its page or selecting it. */
export const PlanListItem: typeof BasePlanListItem = bound(BasePlanListItem);
/** "Start now?", before a change hands an issue to an agent (the board's drop asks it through `useBoardMove`). */
export const StartDialog: typeof BaseStartDialog = bound(BaseStartDialog);
/** "New issue": opens the `new` dialog under `/issues`, with the AI and manual tabs. */
export const NewIssueButton: typeof BaseNewIssueButton =
  bound(BaseNewIssueButton);
/** The issues pages' keyboard shortcuts (`C` new issue, ⌘K search) and their help. */
export const PmShortcuts: typeof BasePmShortcuts = bound(BasePmShortcuts);
/** A project's workflow picker, as the New project form has it (`null` is the default workflow). */
export const WorkflowSelect: typeof BaseWorkflowSelect =
  bound(BaseWorkflowSelect);
export { useNewIssueShortcut } from './components/use-new-issue-shortcut.js';
export type { PlanListItemProps } from './kit/plans/plan-list-item.js';
/**
 * Operation plans, headless: the UI Library's `plan-card` block draws the card, the confirmation, the undo preview
 * and the editor over these. Reading and acting (`usePlanQuery`, `usePlanMutations`, `usePlanUndoPreview`), the names
 * and choices a plan needs (`usePlanLookup`, `usePlanIssue`, `useCreateLabel`), and the words this plugin keeps for it
 * (`usePlanRowTitle`, `usePlanValueText`, `usePlanErrorText`, `usePlanWording`). The plan as pure data is
 * `client/plan-model`, re-exported here.
 */
export * from './plan-model.js';
export { PlanApi, planKeys, usePlanApi } from './kit/plans/api.js';
export {
  invalidRows,
  usePlanMutations,
  usePlanQuery,
  usePlanUndoPreview,
  type PlanAction,
  type PlanMutations,
} from './kit/plans/use-plan.js';
export {
  executorOf,
  useCreateLabel,
  usePlanIssue,
  usePlanLookup,
  usePlanValueText,
  type PlanLookup,
} from './kit/plans/lookup.js';
export type { ExecutorOption } from './components/pm-executor-select.js';
export {
  PlanWordingContext,
  planErrorReason,
  rowTitle,
  usePlanErrorText,
  usePlanRowTitle,
  usePlanWording,
  type PlanErrorText,
  type PlanWorder,
  type PlanWording,
} from './kit/plans/plan-text.js';
export {
  IntakeAgentSlotContext,
  PageContextSinkContext,
  createPageContextStore,
  usePageContextEntries,
  usePageContextSource,
  type IntakeAgentSlotFill,
  type IntakeAgentSlotProps,
  type PageContextEntry,
  type PageContextKind,
  type PageContextSink,
  type PageContextStore,
} from './kit/page-context.js';
export { IntakeAgentSlot, PageContextProvider } from './kit/page-slots.js';

export { useViewer } from './hooks/use-viewer.js';
export { canManageProject, canUseSetting } from './lib/permissions.js';
export { pmKeys } from './api/keys.js';
export { usePmApi } from './hooks/use-pm-api.js';
export { useApiKeyActors } from './hooks/use-api-key-actors.js';
