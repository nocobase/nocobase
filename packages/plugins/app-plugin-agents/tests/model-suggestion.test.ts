import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';

import {
  MODEL_SUGGESTION_KEYS,
  modelSuggestion,
} from '../client/model-suggestion.js';
import enUS from '../client/locales/en-US.js';
import locales from '../client/locales/index.js';
import { MODEL_CATALOG } from '../shared/model-catalog.js';

it('localizes every catalog suggestion in all ten languages, including provider-qualified aliases', async () => {
  const namespace = '@nocobase/app-plugin-agents';
  const runtime = await createTestI18nRuntime({
    namespaces: { [namespace]: locales },
  });
  for (const entry of MODEL_CATALOG.filter((model) => model.goodAt.en)) {
    expect(MODEL_SUGGESTION_KEYS[entry.id], entry.id).toBeDefined();
  }
  for (const language of Object.keys(locales)) {
    await runtime.changeLanguage(language);
    const { default: copy } = (await locales[language]()) as {
      default: typeof enUS;
    };
    expect(
      modelSuggestion(
        {
          tool: 'codex',
          model: 'gpt-6.1-sol',
          suggestion: { en: 'external', zh: '外部' },
        },
        language,
        runtime.getFixedT(namespace),
      ),
    ).toBe(copy.modelSuggestions.large);
    expect(
      modelSuggestion(
        {
          tool: 'pi',
          model: 'anthropic/opus',
          suggestion: { en: 'external', zh: '外部' },
        },
        language,
        runtime.getFixedT(namespace),
      ),
    ).toBe(copy.modelSuggestions.design);
  }
});

it('preserves external suggestions for a model the shipped catalog does not know', () => {
  expect(
    modelSuggestion(
      {
        tool: 'codex',
        model: 'future',
        suggestion: { en: 'External description', zh: '外部说明' },
      },
      'en-US',
      () => {
        throw new Error('Unexpected plugin key');
      },
    ),
  ).toBe('External description');
});
