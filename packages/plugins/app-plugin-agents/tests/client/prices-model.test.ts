/**
 * Agent team › Usage › Prices without React: what is priced, and the price table changed one row at a time, each price
 * keyed by its source and model.
 */
import type { ModelPrice, PricesAnswer } from '../../shared/reports.js';
import type { ModelServiceView } from '../../shared/models.js';
import { describe, expect, it } from 'vitest';

import {
  onlineKey,
  exactPrice,
  onlinePairs,
  parseAmount,
  toolKey,
  withoutPrice,
  withPrice,
  withSubscription,
} from '../../client/pages/usage/prices/model.js';

function service(
  name: string,
  provider: ModelServiceView['provider'],
): ModelServiceView {
  return {
    name,
    title: name,
    provider,
    baseUrl: null,
    apiKeySet: true,
    enabled: true,
    models: [{ value: 'gpt-x', label: 'gpt-x' }],
  };
}

function price(overrides: Partial<ModelPrice>): ModelPrice {
  return {
    id: 'p1',
    tool: 'online',
    modelService: 'team',
    model: 'gpt-x',
    inputPerM: 3,
    outputPerM: 15,
    cacheReadPerM: 0.3,
    cacheWritePerM: 0,
    currency: 'USD',
    note: 'list price',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('the models page model', () => {
  it('prices each enabled service’s models, by service and model', () => {
    expect(
      onlinePairs([
        service('a', 'openai-compatible'),
        { ...service('b', 'openai-compatible'), enabled: false },
        { ...service('c', 'deepseek'), models: [] },
        service('d', 'openai-compatible'),
      ]).map(({ service: item, models }) => [item.name, models]),
    ).toEqual([
      ['a', ['gpt-x']],
      ['d', ['gpt-x']],
    ]);
  });

  it('reads an amount', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount(' 0.5 ')).toBe(0.5);
    expect(parseAmount('-1')).toBeNull();
    expect(parseAmount('x')).toBeNull();
  });

  it('sets one price of a source, keeping the rest of the row and the table', () => {
    const answer: PricesAnswer = {
      items: [
        price({}),
        price({ id: 'p2', modelService: 'azure', inputPerM: 5 }),
        price({ id: 'p3', tool: 'codex', modelService: null, model: 'gpt-5*' }),
      ],
      subscriptions: ['claude'],
      seen: [],
    };
    expect(exactPrice(answer.items, onlineKey('azure', 'GPT-X'))?.id).toBe(
      'p2',
    );
    expect(exactPrice(answer.items, onlineKey('other', 'gpt-x'))).toBeNull();

    const changed = withPrice(answer, onlineKey('team', 'gpt-x'), {
      inputPerM: 1,
      outputPerM: 2,
    });
    expect(changed.subscriptions).toEqual(['claude']);
    expect(changed.prices).toHaveLength(3);
    expect(changed.prices[0]).toEqual({
      tool: 'online',
      modelService: 'team',
      model: 'gpt-x',
      inputPerM: 1,
      outputPerM: 2,
      cacheReadPerM: 0.3,
      cacheWritePerM: 0,
      currency: 'USD',
      note: 'list price',
    });
    expect(changed.prices[1]).toMatchObject({
      modelService: 'azure',
      inputPerM: 5,
    });

    const added = withPrice(answer, toolKey('codex', 'gpt-5-codex'), {
      inputPerM: 1.25,
      outputPerM: 10,
    });
    expect(added.prices.at(-1)).toEqual({
      tool: 'codex',
      modelService: null,
      model: 'gpt-5-codex',
      inputPerM: 1.25,
      outputPerM: 10,
    });

    expect(
      withoutPrice(answer, toolKey('codex', 'gpt-5*')).prices.map(
        (item) => item.modelService,
      ),
    ).toEqual(['team', 'azure']);
    expect(withSubscription(answer, 'codex', true).subscriptions).toEqual([
      'claude',
      'codex',
    ]);
    expect(withSubscription(answer, 'claude', false).subscriptions).toEqual([]);
  });
});
