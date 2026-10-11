/**
 * Studio's workflow status rules (`stage-rules.tsx`) in the projects plugin's workflow editor: Studio assembles the
 * projects and agents plugins, so it joins them here (neither imports the other).
 */
import {
  StatusRuleTypesContext,
  type StatusRuleTypeUI,
} from '@nocobase/app-plugin-projects/client/kit';
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { RETROSPECTIVE_RULE_TYPE } from '../knowledge/retrospective-rule.js';
import { stageRuleTypes } from './stage-rules.js';

export function AgentWorkflowRules({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  // The knowledge base's retrospective, a rule for finished statuses, beside the agents' stage rules.
  const statusRuleTypes: readonly StatusRuleTypeUI[] = [
    ...stageRuleTypes(t),
    RETROSPECTIVE_RULE_TYPE,
  ];
  return (
    <StatusRuleTypesContext.Provider value={statusRuleTypes}>
      {children}
    </StatusRuleTypesContext.Provider>
  );
}
