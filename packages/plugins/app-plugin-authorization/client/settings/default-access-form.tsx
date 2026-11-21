import type { ReactElement } from 'react';
import {
  Navigate,
  useLocation,
  useParams,
  useResolvedPath,
} from 'react-router';

import { DEFAULT_ACCESS_RULES } from './data-rule-kinds.js';

/**
 * The addresses a Default access rule once opened on, `create` and `:key/edit` under Data rules. A rule now opens in a
 * side sheet over its list, so a stored link lands on the list, with its query, and that sheet open.
 */
export default function DefaultAccessForm(): ReactElement {
  const { key } = useParams();
  const location = useLocation();
  // The parent route, the Data rules list, wherever the application mounts it.
  const list = useResolvedPath('..').pathname;
  const search = new URLSearchParams(location.search);
  search.set('rule', DEFAULT_ACCESS_RULES.key);
  if (key === undefined) search.set('create', '1');
  else search.set('edit', key);
  return <Navigate replace to={{ pathname: list, search: `?${search}` }} />;
}
