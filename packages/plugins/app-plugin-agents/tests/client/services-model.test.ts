/**
 * The model services UI without React: services in list order, a new service's title, a service's models as one list,
 * and the base URL as it is checked, sent and shown.
 */
import { describe, expect, it } from 'vitest';

import {
  baseUrlOf,
  guessKind,
  hostOf,
  kindCounts,
  modelRows,
  newServiceTitle,
  serviceStatus,
  setModelDimensions,
  setModelKind,
  sortServices,
  testModelOf,
  toggleModel,
  validBaseUrl,
} from '../../client/online/model.js';
import {
  guessModelKind,
  providerOf,
  type ModelProviderName,
  type ModelServiceView,
} from '../../shared/models.js';

function service(
  name: string,
  provider: ModelProviderName,
  extra: Partial<ModelServiceView> = {},
): ModelServiceView {
  return {
    name,
    title: name,
    provider,
    baseUrl: null,
    apiKeySet: true,
    enabled: true,
    models: [{ value: 'gpt-x', label: 'gpt-x' }],
    ...extra,
  };
}

describe('the model services UI model', () => {
  it('lists services by provider in the providers’ order, several of one provider kept in order', () => {
    expect(
      sortServices([
        service('compat-a', 'openai-compatible'),
        service('ds', 'deepseek'),
        service('compat-b', 'openai-compatible'),
      ]).map((item) => item.name),
    ).toEqual(['ds', 'compat-a', 'compat-b']);
  });

  it('numbers the title of another service of a provider', () => {
    const compatible = providerOf('openai-compatible')!;
    expect(newServiceTitle(compatible, [])).toBe('OpenAI-compatible');
    expect(
      newServiceTitle(compatible, [
        service('a', 'openai-compatible', { title: 'OpenAI-compatible' }),
        service('b', 'openai-compatible', { title: 'OpenAI-compatible 2' }),
      ]),
    ).toBe('OpenAI-compatible 3');
  });

  it('lists the offered models, then those the provider lists', () => {
    expect(
      modelRows(
        [
          { value: 'b', label: 'b', kind: 'chat', dimensions: null },
          { value: 'a', label: 'a', kind: 'embedding', dimensions: null },
        ],
        [
          { id: 'a', kind: 'chat' },
          { id: 'c', kind: 'rerank' },
          { id: 'c', kind: 'rerank' },
          { id: 'd', kind: 'chat' },
        ],
      ),
    ).toEqual([
      { id: 'b', on: true, kind: 'chat' },
      { id: 'a', on: true, kind: 'embedding' },
      { id: 'c', on: false, kind: 'rerank' },
      { id: 'd', on: false, kind: 'chat' },
    ]);
    const a = {
      value: 'a',
      label: 'a',
      kind: 'chat',
      dimensions: null,
    } as const;
    expect(toggleModel([a], ' b ', true)).toEqual([
      a,
      { value: 'b', label: 'b', kind: 'chat', dimensions: null },
    ]);
    expect(toggleModel([a], 'a', false)).toEqual([]);
    // A new model takes the kind its id suggests, among those its provider serves.
    expect(
      toggleModel([], 'text-embedding-3-small', true, providerOf('openai')),
    ).toEqual([
      {
        value: 'text-embedding-3-small',
        label: 'text-embedding-3-small',
        kind: 'embedding',
        dimensions: null,
      },
    ]);
    // Turned on from the list, it keeps the kind shown there when its provider serves it.
    expect(
      toggleModel(
        [],
        'bge-m3',
        true,
        providerOf('openai-compatible'),
        'embedding',
      )[0]?.kind,
    ).toBe('embedding');
    expect(guessModelKind('BAAI/bge-reranker-v2', ['chat', 'rerank'])).toBe(
      'rerank',
    );
    expect(guessModelKind('nomic-embed-text', ['chat', 'embedding'])).toBe(
      'embedding',
    );
    expect(guessModelKind('gpt-4.1', ['chat', 'embedding'])).toBe('chat');
    expect(guessKind('rerank-v3.5', providerOf('cohere'))).toBe('rerank');
    expect(guessKind('rerank-v3.5', providerOf('anthropic'))).toBe('chat');
    const embedding = setModelDimensions(
      setModelKind([a], 'a', 'embedding'),
      'a',
      '512',
    );
    expect(embedding).toEqual([{ ...a, kind: 'embedding', dimensions: 512 }]);
    expect(setModelKind(embedding, 'a', 'rerank')).toEqual([
      { ...a, kind: 'rerank', dimensions: null },
    ]);
    expect(kindCounts(embedding)).toEqual([{ kind: 'embedding', count: 1 }]);
    expect(testModelOf(embedding)).toEqual(embedding[0]);
  });

  it('checks, sends and shows a base URL', () => {
    const openai = providerOf('openai');
    expect(validBaseUrl('')).toBe(true);
    expect(validBaseUrl('https://api.example.com/v1')).toBe(true);
    expect(validBaseUrl('api.example.com')).toBe(false);
    expect(baseUrlOf(' https://api.openai.com/v1 ', openai)).toBeNull();
    expect(baseUrlOf('http://127.0.0.1:9/v1', openai)).toBe(
      'http://127.0.0.1:9/v1',
    );
    expect(hostOf(service('o', 'openai'))).toBe('api.openai.com');
    expect(
      hostOf(
        service('c', 'openai-compatible', {
          baseUrl: 'http://127.0.0.1:9/v1',
        }),
      ),
    ).toBe('127.0.0.1:9');
    expect(hostOf(service('c', 'openai-compatible'))).toBeNull();
  });

  it('tells what a service lacks', () => {
    expect(serviceStatus(service('a', 'openai'))).toBe('on');
    expect(serviceStatus(service('a', 'openai', { enabled: false }))).toBe(
      'off',
    );
    expect(serviceStatus(service('a', 'openai', { apiKeySet: false }))).toBe(
      'noKey',
    );
    // A provider that needs no key is on without one.
    expect(serviceStatus(service('a', 'ollama', { apiKeySet: false }))).toBe(
      'on',
    );
    expect(serviceStatus(service('a', 'openai', { models: [] }))).toBe(
      'noModels',
    );
  });
});
