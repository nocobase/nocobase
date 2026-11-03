import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';

import {
  MODEL_SUGGESTION_KEYS,
  modelSuggestion,
  modelTemplateKey,
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
    expect(MODEL_SUGGESTION_KEYS[entry.id]).toBeDefined();
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
          suggestion: MODEL_CATALOG.find((entry) => entry.id === 'gpt-6.1-sol')!
            .goodAt,
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
          suggestion: MODEL_CATALOG.find(
            (entry) => entry.id === 'claude-opus-5-5',
          )!.goodAt,
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

it('preserves coding tool and operating system product names in every locale', async () => {
  for (const locale of Object.keys(locales)) {
    const { default: copy } = (await locales[locale]()) as {
      default: typeof enUS;
    };
    expect(copy.tools.pi).toBe('Pi');
    expect(copy.connect.system.linux).toBe('Linux');
    expect(copy.connect.system.windows).toBe('Windows');
  }
});

it.each([
  ['en-US', 'Application description'],
  ['zh-CN', '应用说明'],
  ['zh-TW', '应用说明'],
  ['de-DE', 'Application description'],
])(
  'uses the application suggestion for a catalog model in %s',
  (locale, expected) => {
    expect(
      modelSuggestion(
        {
          tool: 'codex',
          model: 'gpt-6.1-sol',
          suggestion: { en: 'Application description', zh: '应用说明' },
        },
        locale,
        () => {
          throw new Error('Unexpected catalog translation');
        },
      ),
    ).toBe(expected);
  },
);

it.each([
  ['claude-haiku-5-5', 'small'],
  ['anthropic/claude-opus-6', 'design'],
  ['claude-sonnet-6-1', 'routine'],
  ['openai/gpt-7.1-sol', 'large'],
  ['gpt-7-astra', 'review'],
  ['gpt-7-luna', 'small'],
])(
  'prefills the family template for %s when there is no suggestion',
  (model, template) => {
    expect(
      modelSuggestion(
        { tool: 'claude', model, suggestion: null },
        'en-US',
        (key) => key,
      ),
    ).toBe(`modelSuggestions.${template}`);
  },
);

it('prefers exact catalog aliases to family guesses and leaves unknown families empty', () => {
  expect(modelTemplateKey('claude', 'opus')).toBe('modelSuggestions.design');
  expect(modelTemplateKey('claude', 'claude-fable-5-1')).toBe(
    'modelSuggestions.explanation',
  );
  for (const model of [
    'unrecognized',
    'solaris',
    'custom-haiku',
    'gpt-7',
    '',
  ]) {
    expect(
      modelSuggestion(
        { tool: 'claude', model, suggestion: null },
        'en-US',
        (key) => key,
      ),
    ).toBe('');
  }
});

it('keeps an external suggestion ahead of a recognized family', () => {
  expect(
    modelSuggestion(
      {
        tool: 'claude',
        model: 'claude-haiku-5-5',
        suggestion: { en: 'Custom text', zh: '自定义' },
      },
      'zh-CN',
      (key) => key,
    ),
  ).toBe('自定义');
});
