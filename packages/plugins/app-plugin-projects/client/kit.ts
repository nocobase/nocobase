/**
 * Components and hooks the application reuses on its own pages (such as an application's members, roles and inbox), so they look and behave
 * like the plugin's. Components that translate their own text are bound to this plugin's namespace; the text an
 * application passes in stays its own.
 */
import { withNamespace } from '@nocobase/i18n/client';

export {
  StatusEventsContext,
  type StatusEventUI,
} from './lib/status-events.js';
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
import { SectionHeading as BaseSectionHeading } from './pages/config/section-heading.js';
import { SettingsPageHeader as BaseSettingsPageHeader } from './pages/config/settings-page-header.js';
import { NewIssueButton as BaseNewIssueButton } from './pages/issues/new-issue-button.js';
import { PmShortcuts as BasePmShortcuts } from './components/pm-shortcuts.js';

const bound = <T>(component: T): T =>
  withNamespace(ACCESS_NAMESPACE, component as never) as T;

export const DataTable: typeof BaseDataTable = bound(BaseDataTable);
/** A compact text area for long text that expands on demand. */
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
/** "New issue": opens the `new` dialog under `/issues`, with the manual form. */
export const NewIssueButton: typeof BaseNewIssueButton =
  bound(BaseNewIssueButton);
/** The issues pages' keyboard shortcuts (`C` new issue, ⌘K search) and their help. */
export const PmShortcuts: typeof BasePmShortcuts = bound(BasePmShortcuts);
export { useNewIssueShortcut } from './components/use-new-issue-shortcut.js';
export {
  PageContextSinkContext,
  createPageContextStore,
  usePageContextEntries,
  usePageContextSource,
  type PageContextEntry,
  type PageContextKind,
  type PageContextSink,
  type PageContextStore,
} from './kit/page-context.js';
export { PageContextProvider } from './kit/page-slots.js';

export { useViewer } from './hooks/use-viewer.js';
export { canManageProject, canUseSetting } from './lib/permissions.js';
export { pmKeys } from './api/keys.js';
/** Use the same history pagination protection in an application's own query cache. */
export { PmQueryClient } from './api/invalidate-queries.js';
export {
  announcedIssueIds,
  changedIssueSegments,
  embeddedIssueSegments,
  isIssueRead,
} from './api/changed-issues.js';
export { usePmApi } from './hooks/use-pm-api.js';
export { useApiKeyActors } from './hooks/use-api-key-actors.js';

export { PmDescriptionImage } from './components/pm-description-image.js';

export {
  ExecutorPresentationContext,
  type ExecutorPresentation,
  type ExecutorPresentationProps,
} from './kit/executor-presentation.js';
