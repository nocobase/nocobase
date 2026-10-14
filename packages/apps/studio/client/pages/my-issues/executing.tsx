import type { ReactElement } from 'react';

import { MyIssuesTab } from './tab.js';

/** Tab `/my-issues/executing`: issues the viewer executes. */
export default function MyExecutingIssues(): ReactElement {
  return <MyIssuesTab role='executing' />;
}
