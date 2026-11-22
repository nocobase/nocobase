import type { ReactElement } from 'react';

import { DataRuleList } from './data-rule-list.js';
import { SHARING_RULES } from './data-rule-kinds.js';

/** The Sharing rules: particular records of a resource, given to particular people on top of their roles. */
export default function SharingRules(): ReactElement {
  return <DataRuleList kind={SHARING_RULES} />;
}
