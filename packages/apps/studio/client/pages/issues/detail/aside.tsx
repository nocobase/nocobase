/**
 * The issue page's side column: the properties, the people and the dates, nothing else. What follows from the code
 * (pull requests, previews, deployments) and the agents' execution log live in the main column, where they have room.
 */
import type {
  IssuePageActions,
  IssueUpdate,
} from '@nocobase/app-plugin-projects/client/issues';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { ReactElement } from 'react';

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
    </div>
  );
}
