/**
 * Plans the agents plugin proposes from a workflow's status rule (`suggestExecutor`) are stored with an English title
 * and description, since the server does not know who will read them. Studio words them in the reader's language from
 * the plan's source, for every plan card and list (`PlanWordingContext` of the projects kit).
 */
import {
  PlanWordingContext,
  type PlanWorder,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useStatusLabel } from '../inbox/contributions/projects-wording.js';

/** `source.data` of a suggested executor's plan (`studio/server/agents/stage.ts`). */
interface SuggestionData {
  readonly rule?: unknown;
  readonly statusKey?: unknown;
  readonly statusName?: unknown;
  readonly agentName?: unknown;
  /** A built-in agent's name as an i18n key and namespace (`server/agents/agent-name.ts`). */
  readonly agentNameKey?: unknown;
  readonly agentNameNs?: unknown;
  readonly identifier?: unknown;
  readonly issueTitle?: unknown;
  readonly reason?: unknown;
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value !== '' ? value : null;

export function StudioPlanWording({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  // Other plans are worded further out, when another provider does.
  const outer = useContext(PlanWordingContext);
  // A new function on every render: kept in a ref, so the wording changes only with the language.
  const latest = useStatusLabel();
  const statusLabelRef = useRef(latest);
  useEffect(() => {
    statusLabelRef.current = latest;
  });
  const worder = useMemo<PlanWorder>(
    () => (plan) => {
      if (plan.source.kind !== 'statusRule') return outer?.(plan) ?? null;
      const data = (plan.source.data ?? {}) as SuggestionData;
      const stored = text(data.agentName);
      const nameKey = text(data.agentNameKey);
      const nameNs = text(data.agentNameNs);
      const agent =
        stored && nameKey && nameNs
          ? t(nameKey, { ns: nameNs, defaultValue: stored })
          : stored;
      const identifier = text(data.identifier);
      const statusKey = text(data.statusKey);
      if (data.rule !== 'suggestExecutor' || !agent || !identifier) return null;
      const reason = text(data.reason);
      return {
        title: t('pmChat.plans.suggestTitle', { agent, identifier }),
        description: t(
          reason
            ? 'pmChat.plans.suggestDescriptionReason'
            : 'pmChat.plans.suggestDescription',
          {
            agent,
            identifier,
            title: text(data.issueTitle) ?? '',
            status: statusKey
              ? statusLabelRef.current(statusKey, text(data.statusName))
              : '',
            reason: reason ?? '',
          },
        ),
      };
    },
    [t, outer],
  );
  return (
    <PlanWordingContext.Provider value={worder}>
      {children}
    </PlanWordingContext.Provider>
  );
}
