import type { Translator } from '@nocobase/i18n';

import type { AgentView } from '../shared/agents.js';
import { catalogEntry } from '../shared/model-catalog.js';

export const MODEL_SUGGESTION_KEYS: Readonly<Record<string, string>> = {
  'claude-opus-5-5': 'modelSuggestions.design',
  'claude-sonnet-5': 'modelSuggestions.routine',
  'claude-haiku-4-5': 'modelSuggestions.small',
  'claude-fable-5-1': 'modelSuggestions.explanation',
  'gpt-6.1-sol': 'modelSuggestions.large',
  'gpt-6-sol': 'modelSuggestions.large',
  'gpt-6-astra': 'modelSuggestions.review',
  'gpt-6-luna': 'modelSuggestions.small',
};

/** Catalog-owned suggestions use the same complete locale resources as the rest of the dialog. */
export function modelSuggestion(
  agent: Pick<AgentView, 'tool' | 'model' | 'suggestion'>,
  locale: string,
  t: Translator,
): string {
  if (!agent.suggestion) return '';
  const entry =
    agent.tool && agent.model
      ? catalogEntry(agent.tool, agent.model)
      : undefined;
  const key = entry && MODEL_SUGGESTION_KEYS[entry.id];
  if (key) return t(key);
  // Suggestions from a server with a newer catalog remain external data in its declared languages.
  return locale.startsWith('zh') ? agent.suggestion.zh : agent.suggestion.en;
}
