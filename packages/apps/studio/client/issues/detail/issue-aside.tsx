/**
 * The projects plugin's cards of an issue's side column, drawn with the installed `issue-detail` block over the
 * plugin's headless hooks, in its words: the editable properties, who follows the issue, and when it was created and
 * changed. Among the agents only the project manager may be the executor ("Arrange"); people may be too. Moving an
 * issue to In progress starts the work. Controls the server would refuse are disabled rather than hidden: every field without
 * `issues/edit`; the owner and the done or closed statuses also for anyone but the owner, the project lead and whoever
 * holds them on every issue.
 */
import {
  type IssuePageActions,
  type IssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { PreviewPreferenceField } from '../../previews/preference-field.js';

import { PropertyCard, PropertyRow } from '@/components/property-fields';
import {
  IssueDates,
  IssueFollowers,
} from '@/extensions/nocobase-issue-detail/issue-properties';

import { useIssuePropertyFields } from './issue-property-fields.js';
import { useIssuePageWording } from './labels.js';

/** The editable properties, the issue page's side column card (`issue-property-fields.tsx`). */
export function IssuePropertiesCard({
  detail,
  update,
  pageActions,
}: {
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
  readonly pageActions: IssuePageActions;
}): ReactElement {
  const { detail: labels } = useIssuePageWording();
  const { busy, fields } = useIssuePropertyFields({
    detail,
    update,
    pageActions,
  });
  return (
    <PropertyCard title={labels.properties} busy={busy} labels={labels}>
      <PreviewPreferenceField issueId={detail.id} />
      {fields.map((field) => (
        <PropertyRow
          key={field.key}
          label={field.label}
          {...(field.htmlFor ? { htmlFor: field.htmlFor } : {})}
        >
          {field.control}
        </PropertyRow>
      ))}
    </PropertyCard>
  );
}

/**
 * Who is notified about the issue, and the viewer's subscribe button: titled "Notifications" so it is not taken for the
 * follow star of "My follow-ups".
 */
export function IssueFollowersCard({
  detail,
  pageActions,
}: {
  readonly detail: IssueDetail;
  readonly pageActions: IssuePageActions;
}): ReactElement {
  const { t, detail: labels } = useIssuePageWording();
  const { t: appT } = useTranslation();
  const viewer = useViewer();
  return (
    <IssueFollowers
      followers={detail.subscribers.map((subscriber) => ({
        id: subscriber.userId,
        name: subscriber.name,
        reason: t(`subscribers.reason.${subscriber.reason}`, {
          defaultValue: subscriber.reason,
        }),
      }))}
      following={detail.subscribers.some(
        (subscriber) => subscriber.userId === viewer?.userId,
      )}
      {...(viewer ? { onToggle: pageActions.setFollowing } : {})}
      labels={{
        ...labels,
        followers: {
          ...labels.followers,
          title: appT('issueLive.notifications.title'),
          follow: appT('issueLive.notifications.subscribe'),
          unfollow: appT('issueLive.notifications.unsubscribe'),
        },
      }}
    />
  );
}

/** When the issue was created and last changed. */
export function IssueDatesCard({
  detail,
}: {
  readonly detail: IssueDetail;
}): ReactElement {
  const { i18n } = useTranslation();
  const { detail: labels } = useIssuePageWording();
  return (
    <IssueDates
      createdAt={detail.createdAt}
      updatedAt={detail.updatedAt}
      locale={i18n.language}
      labels={labels}
    />
  );
}
