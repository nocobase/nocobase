/**
 * The issue page's side column: properties, followers, dates, then the agents' execution log.
 */
import type {
  IssuePageActions,
  IssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { ReactElement } from 'react';

import { IssueRunPanel } from '../../../agents/issue-runs.js';

import {
  IssueDatesCard,
  IssueFollowersCard,
  IssuePropertiesCard,
} from '../../../issues/detail/issue-aside.js';

export function IssuePageAside({
  detail,
  update,
  pageActions,
}: {
  readonly detail: IssueDetail;
  readonly update: IssueUpdate;
  readonly pageActions: IssuePageActions;
}): ReactElement {
  return (
    <div className='flex flex-col gap-4'>
      <IssuePropertiesCard
        detail={detail}
        update={update}
        pageActions={pageActions}
      />
      <IssueFollowersCard detail={detail} pageActions={pageActions} />
      <IssueDatesCard detail={detail} />
      <IssueRunPanel issue={detail} />
    </div>
  );
}
