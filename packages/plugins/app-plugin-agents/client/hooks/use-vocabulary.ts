/**
 * What the application calls the things agents work with (`GET agents/admin/vocabulary`), and its texts in the
 * viewer's language. Read once per page; while it loads, or when it cannot be read, names fall back to their keys.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { CONVERSATION_SUBJECT } from '../../shared/conversations.js';
import type { I18nText } from '../../shared/i18n.js';
import type {
  AgentsVocabulary,
  ScopeVocabulary,
  SubjectVocabulary,
} from '../../shared/vocabulary.js';
import { agentsKeys } from '../api/keys.js';
import { useAgentsApi } from './use-agents-api.js';

const EMPTY: AgentsVocabulary = { subjects: [], sources: [], scopes: [] };

export function useVocabulary(): AgentsVocabulary {
  const api = useAgentsApi();
  const vocabulary = useQuery({
    queryKey: agentsKeys.vocabulary,
    queryFn: () => api.vocabulary(),
    staleTime: 5 * 60_000,
  });
  return vocabulary.data ?? EMPTY;
}

/** Translates a contributed text in its own namespace; `fallback` when there is none. */
export function useText(): (
  text: I18nText | null | undefined,
  fallback: string,
) => string {
  const { t } = useTranslation();
  return useCallback(
    (text, fallback) =>
      text ? t(text.key, { ns: text.ns, defaultValue: fallback }) : fallback,
    [t],
  );
}

interface Named<Name extends string | null> {
  readonly name: Name;
  readonly nameText?: I18nText | null;
}

/** An agent's name and description as people see them: an application's agent's in the viewer's language. */
export interface AgentText {
  /** Its name; null stays null (an agent that no longer exists). */
  name<Name extends string | null>(agent: Named<Name>): Name;
  description(agent: {
    readonly description: string | null;
    readonly descriptionText?: I18nText | null;
  }): string | null;
}

/**
 * Translates an agent's `nameText` and `descriptionText` (such as an application's built-in agents), falling back to the text as
 * written; an agent people named shows its name as is.
 */
export function useAgentText(): AgentText {
  const text = useText();
  return useMemo(() => {
    function name<Name extends string | null>(agent: Named<Name>): Name;
    function name(agent: Named<string | null>): string | null {
      return agent.name === null ? null : text(agent.nameText, agent.name);
    }
    return {
      name,
      description: (agent) =>
        agent.description === null
          ? null
          : text(agent.descriptionText, agent.description),
    };
  }, [text]);
}

/**
 * The scenarios "Preview full prompt" offers, the subject kinds with a sample: the application's first and a
 * conversation last; empty when there is nothing to preview.
 */
export function usePreviewSubjects(): readonly SubjectVocabulary[] {
  const { subjects } = useVocabulary();
  return useMemo(() => previewSubjects(subjects), [subjects]);
}

export function previewSubjects(
  subjects: readonly SubjectVocabulary[],
): SubjectVocabulary[] {
  const offered = subjects.filter((subject) => subject.preview);
  return [
    ...offered.filter((subject) => subject.kind !== CONVERSATION_SUBJECT),
    ...offered.filter((subject) => subject.kind === CONVERSATION_SUBJECT),
  ];
}

export function subjectOf(
  vocabulary: AgentsVocabulary,
  kind: string,
): SubjectVocabulary | undefined {
  return vocabulary.subjects.find((subject) => subject.kind === kind);
}

export function scopeOf(
  vocabulary: AgentsVocabulary,
  key: string,
): ScopeVocabulary | undefined {
  return vocabulary.scopes.find((scope) => scope.key === key);
}

/**
 * What started a run, in the viewer's language: the subject's own name for the trigger, else this plugin's (`retry`,
 * `message`), else the trigger as it is.
 */
export function useTriggerLabel(): (
  subjectKind: string,
  trigger: string,
) => string {
  const vocabulary = useVocabulary();
  const text = useText();
  // This plugin's own triggers, in its namespace whichever page asks.
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return useCallback(
    (subjectKind, trigger) =>
      text(
        subjectOf(vocabulary, subjectKind)?.triggers[trigger],
        t(`runs.trigger.${trigger}`, { defaultValue: trigger }),
      ),
    [vocabulary, text, t],
  );
}
