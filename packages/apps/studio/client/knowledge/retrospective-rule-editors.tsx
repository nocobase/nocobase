/** The settings editor and summary of the `retrospective` status rule (`retrospective-rule.ts`). */
import type {
  StatusRuleEditorProps,
  StatusRuleSummaryProps,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { useAgentName } from '../agents/agent-name.js';
import { RuleAgentField } from '../agents/stage-rule-editors.js';

const textOf = (value: unknown): string =>
  typeof value === 'string' ? value : '';

export function RetrospectiveEditor({
  config,
  onChange,
  idPrefix,
}: StatusRuleEditorProps): ReactElement {
  return (
    <RuleAgentField
      id={`${idPrefix}-agent`}
      value={textOf(config.agentId)}
      allowCurrent
      onChange={(next) => onChange(next ? { agentId: next } : {})}
    />
  );
}

export function RetrospectiveSummary({
  config,
}: StatusRuleSummaryProps): ReactElement {
  const { t } = useTranslation();
  const name = useAgentName();
  const agentId = textOf(config.agentId);
  return (
    <span>
      {agentId
        ? t('knowledgeRules.retrospectiveAgent', { agent: name(agentId) })
        : t('knowledgeRules.retrospectiveCurrent')}
    </span>
  );
}
