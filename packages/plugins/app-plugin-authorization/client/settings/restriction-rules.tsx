import type { ReactElement } from 'react';

import { DataRuleList } from './data-rule-list.js';
import { RESTRICTION_RULES } from './data-rule-kinds.js';

/** The Restriction rules: the most some people may reach of a resource, whatever their roles and other rules give. */
export default function RestrictionRules(): ReactElement {
  return <DataRuleList kind={RESTRICTION_RULES} />;
}
