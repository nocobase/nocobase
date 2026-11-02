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

/** Exact catalog entries take precedence over guesses for newer models in a known family. */
export function modelTemplateKey(
  tool: AgentView['tool'],
  model: string | null,
): string | undefined {
  if (!model) return undefined;
  const entry = tool ? catalogEntry(tool, model) : undefined;
  const exact = entry && MODEL_SUGGESTION_KEYS[entry.id];
  if (exact) return exact;
  const name = model.split('/').at(-1)!.toLowerCase();
  if (/^(?:claude-)?opus(?:-|$)/u.test(name)) return 'modelSuggestions.design';
  if (/^(?:claude-)?sonnet(?:-|$)/u.test(name))
    return 'modelSuggestions.routine';
  if (/^(?:claude-)?haiku(?:-|$)/u.test(name)) return 'modelSuggestions.small';
  if (/^(?:gpt-[\d.]+-)?sol(?:-|$)/u.test(name))
    return 'modelSuggestions.large';
  if (/^(?:gpt-[\d.]+-)?astra(?:-|$)/u.test(name))
    return 'modelSuggestions.review';
  if (/^(?:gpt-[\d.]+-)?luna(?:-|$)/u.test(name))
    return 'modelSuggestions.small';
  return undefined;
}

/** Catalog-owned suggestions use the same complete locale resources as the rest of the dialog. */
export function modelSuggestion(
  agent: Pick<AgentView, 'tool' | 'model' | 'suggestion'>,
  locale: string,
  t: Translator,
): string {
  if (!agent.suggestion) {
    const key = modelTemplateKey(agent.tool, agent.model);
    return key ? t(key) : '';
  }
  const entry =
    agent.tool && agent.model
      ? catalogEntry(agent.tool, agent.model)
      : undefined;
  const key = entry && MODEL_SUGGESTION_KEYS[entry.id];
  if (
    key &&
    agent.suggestion.en === entry.goodAt.en &&
    agent.suggestion.zh === entry.goodAt.zh
  )
    return t(key);
  // Application overrides and suggestions from a newer catalog use their declared languages.
  return locale.startsWith('zh') ? agent.suggestion.zh : agent.suggestion.en;
}
