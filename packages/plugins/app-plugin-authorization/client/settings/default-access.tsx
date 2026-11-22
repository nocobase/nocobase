import type { ReactElement } from 'react';

import { DataRuleList } from './data-rule-list.js';
import { DEFAULT_ACCESS_RULES } from './data-rule-kinds.js';

/** The Default access rules: one rule per resource, the records everyone allowed an operation can also reach. */
export default function DefaultAccessRules(): ReactElement {
  return <DataRuleList kind={DEFAULT_ACCESS_RULES} />;
}
