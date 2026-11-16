import type { LifecycleRuntime } from '@nocobase/lifecycle';
import { describe, expect, it } from 'vitest';
import {
  workflowGroups,
  type WorkflowSource,
} from '../../server/providers/workflows.js';

/** Just what grouping reads from a runtime: each definition's identity. */
function source(
  name: WorkflowSource['source'],
  definitions: Record<string, { key: string; version: number }>,
): WorkflowSource {
  return {
    source: name,
    runtime: {
      definition: (definition: string) => ({
        ...definitions[definition],
        definitionField: 'lifecycleDefinition',
      }),
    } as unknown as LifecycleRuntime,
    definitions: Object.keys(definitions).map((definition) => ({
      name: definition,
      collection: 'records',
      stateField: 'status',
    })),
  };
}

describe('grouping workflow definitions from several sources', () => {
  it('groups the versions of a key and orders them by number, whatever the registration order', () => {
    const [group] = workflowGroups([
      source('lifecycle', {
        'orders-v3': { key: 'orders', version: 3 },
        orders: { key: 'orders', version: 1 },
      }),
    ]);
    expect(group).toMatchObject({
      id: 'lifecycle.orders',
      key: 'orders',
      definitionField: 'lifecycleDefinition',
      versions: [
        { name: 'orders', version: 1 },
        { name: 'orders-v3', version: 3 },
      ],
    });
  });

  it('refuses a key two sources register', () => {
    expect(() =>
      workflowGroups([
        source('lifecycle', { orders: { key: 'orders', version: 1 } }),
        source('office', { 'office-orders': { key: 'orders', version: 2 } }),
      ]),
    ).toThrow(
      /"orders" is registered by both the "lifecycle" and the "office"/,
    );
  });

  it('refuses a version listed twice', () => {
    expect(() =>
      workflowGroups([
        source('lifecycle', {
          orders: { key: 'orders', version: 1 },
          'orders-copy': { key: 'orders', version: 1 },
        }),
      ]),
    ).toThrow(/lists version 1 twice/);
  });
});
