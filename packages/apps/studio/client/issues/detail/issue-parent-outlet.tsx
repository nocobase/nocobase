import type { ReactElement } from 'react';
import { Outlet } from 'react-router';

import type { IssueParent, IssueParentContext } from './issue-parent.js';

/**
 * The list page's outlet, where the issue opened over it renders, carrying the list's trail and address
 * (`issue-parent.ts`); the issue page forwards it to the pages under it.
 */
export function IssueParentOutlet({
  parent,
}: {
  readonly parent: IssueParent;
}): ReactElement {
  const context: IssueParentContext = { issueParent: parent };
  return <Outlet context={context} />;
}
