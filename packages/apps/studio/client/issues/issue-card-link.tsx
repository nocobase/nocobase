/** The installed `issue-card`'s link, drawn with the router so a plain click stays in the application. */
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import type { IssueCardLinkProps } from '@/components/issue-card';

export function IssueCardRouterLink({
  href,
  ...props
}: IssueCardLinkProps): ReactElement {
  return <Link to={href} {...props} />;
}
