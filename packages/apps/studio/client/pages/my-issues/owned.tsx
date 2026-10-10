import type { ReactElement } from 'react';

import { MyIssuesTab } from './tab.js';

/** Tab `/my-issues/owned`: issues the viewer owns. */
export default function MyOwnedIssues(): ReactElement {
  return <MyIssuesTab role='owned' />;
}
