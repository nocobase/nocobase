/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { analyzeVariableTemplate, type PathSegment } from '../template/variable-expression';
import { planRecordBindings } from '../variables/record-bindings';

const recordParams = (filterByTk = 1) => ({ collection: 'users', dataSourceKey: 'main', filterByTk });
const koaCtx = {} as ResourcerContext;

const usageOf = (template: unknown) => analyzeVariableTemplate(template).usage;
const createPlan = (options: Omit<Parameters<typeof planRecordBindings>[0], 'koaCtx'>) =>
  planRecordBindings({ ...options, koaCtx });

function strictOptions(template: unknown, slots: readonly (readonly PathSegment[])[]) {
  const analysis = analyzeVariableTemplate(template);
  return {
    policies: new Map(
      analysis.paths.map((path, index) => [path.canonicalKey, { status: 'resolved' as const, slot: slots[index] }]),
    ),
    usage: analysis.usage,
  };
}

describe('record binding planner', () => {
  it('authorizes only a structured strict prefix and removes the descriptor from ordinary context params', async () => {
    const plan = await createPlan({
      ...strictOptions('{{ ctx.view.record.name }}', [['record']]),
      contextParams: { 'view.record': recordParams(), plain: { enabled: true } },
    });

    expect(plan.bindings).toHaveLength(1);
    expect(plan.bindings[0]).toMatchObject({
      varName: 'view',
      prefix: ['record'],
      relativePaths: [['name']],
      preferFullRecord: false,
      contextKey: 'view.record',
      contextLocation: ['view.record'],
    });
    expect(plan.contextParams).toEqual({ plain: { enabled: true } });
    expect(plan.rejections).toEqual([]);
  });

  it('preserves each structured target submitted in the exact slot', async () => {
    for (const params of [
      { collection: 'users', dataSourceKey: 'main', filterByTk: 1 },
      {
        associationName: 'accounts.contacts',
        collection: 'contacts',
        dataSourceKey: 'external',
        fields: ['id', 'name'],
        filterByTk: 7,
        sourceId: 9,
      },
    ]) {
      const plan = await createPlan({
        ...strictOptions('{{ ctx.view.record.name }}', [['record']]),
        contextParams: { 'view.record': params },
      });

      expect(plan.bindings[0]?.params).toEqual(params);
    }
  });

  it('strips a descriptor moved to a scalar leaf in strict mode', async () => {
    const plan = await createPlan({
      ...strictOptions('{{ ctx.view.record.name }}', [['record']]),
      contextParams: { 'view.record.name': recordParams() },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.contextParams).toEqual({});
    expect(plan.rejections).toEqual([]);
  });

  it.each<[string, readonly string[]]>([
    ['popup.record', ['record']],
    ['popup.sourceRecord', ['sourceRecord']],
    ['popup.parent.record', ['parent', 'record']],
    ['popup.parent.sourceRecord', ['parent', 'sourceRecord']],
    ['popup.parent.parent.record', ['parent', 'parent', 'record']],
  ])('allows the declared whole-record slot %s', async (path, prefix) => {
    const plan = await createPlan({
      ...strictOptions(`{{ ctx.${path} }}`, [prefix]),
      contextParams: { [path]: recordParams() },
    });

    expect(plan.rejections).toEqual([]);
    expect(plan.bindings).toEqual([
      expect.objectContaining({ varName: 'popup', prefix, relativePaths: [[]], preferFullRecord: true }),
    ]);
  });

  it('does not treat a whole-record slot as globally allowed', async () => {
    const plan = await createPlan({
      ...strictOptions('{{ ctx.popup.parent.record }}', [['record']]),
      contextParams: { 'popup.parent.record': recordParams() },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.rejections).toEqual([]);
  });

  it('filters each binding to paths authorized for its exact slot', async () => {
    const plan = await createPlan({
      ...strictOptions(['{{ ctx.formValues.status }}', '{{ ctx.formValues.department.name }}'], [[], ['department']]),
      contextParams: {
        formValues: recordParams(),
        'formValues.department': recordParams(2),
      },
    });

    expect(plan.rejections).toEqual([]);
    expect(plan.bindings).toEqual([
      expect.objectContaining({ prefix: [], relativePaths: [['status']] }),
      expect.objectContaining({ prefix: ['department'], relativePaths: [['name']] }),
    ]);
    expect(plan.contextParams).toEqual({});
  });

  it.each([
    ['{{ ctx.view.record.department.name }}', 'view.record.department', ['record']],
    ['{{ ctx.popup.record.roles.title }}', 'popup.record.roles', ['record']],
    ['{{ ctx.popup.parent.record.roles.title }}', 'popup.parent.record.roles', ['parent', 'record']],
  ] as const)('strips a descriptor moved below its exact slot for %s', async (template, contextKey, slot) => {
    const plan = await createPlan({
      ...strictOptions(template, [slot]),
      contextParams: { [contextKey]: recordParams() },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.contextParams).toEqual({});
    expect(plan.rejections).toEqual([]);
  });

  it('merges all paths authorized for one exact slot into one binding', async () => {
    const plan = await createPlan({
      ...strictOptions(['{{ ctx.view.record.name }}', '{{ ctx.view.record.email }}'], [['record'], ['record']]),
      contextParams: { 'view.record': recordParams() },
    });

    expect(plan.bindings).toEqual([
      expect.objectContaining({ prefix: ['record'], relativePaths: [['name'], ['email']] }),
    ]);
  });

  it('fails closed for duplicate flat and nested descriptors without blocking a legal sibling', async () => {
    const plan = await createPlan({
      ...strictOptions(
        ['{{ ctx.formValues.department.name }}', '{{ ctx.formValues.owner.name }}'],
        [['department'], ['owner']],
      ),
      contextParams: {
        formValues: { department: recordParams(1), owner: recordParams(2) },
        'formValues.department': recordParams(3),
      },
    });

    expect(plan.bindings).toEqual([
      expect.objectContaining({ prefix: ['owner'], params: expect.objectContaining({ filterByTk: 2 }) }),
    ]);
    expect(plan.contextParams).toEqual({ formValues: {} });
    expect(plan.rejections).toEqual([]);
  });

  it('ignores a slot the contract cannot prove without blocking a legal sibling', async () => {
    const analysis = analyzeVariableTemplate(['{{ ctx.formValues.status }}', '{{ ctx.formValues.department.name }}']);
    const plan = await createPlan({
      policies: new Map([[analysis.paths[0].canonicalKey, { status: 'resolved' as const, slot: [] }]]),
      usage: analysis.usage,
      contextParams: {
        formValues: recordParams(1),
        'formValues.department': recordParams(2),
      },
    });

    expect(plan.bindings).toEqual([expect.objectContaining({ prefix: [], relativePaths: [['status']] })]);
    expect(plan.contextParams).toEqual({});
    expect(plan.rejections).toEqual([]);
  });

  it('strips malformed descriptors instead of exposing them as ordinary context', async () => {
    const plan = await createPlan({
      ...strictOptions('{{ ctx.view.record.name }}', [['record']]),
      contextParams: { 'view.record': { collection: 'users', fields: 'name', filterByTk: 1 } },
    });

    expect(plan).toMatchObject({ bindings: [], contextParams: {}, rejections: [] });
  });

  it('keeps dashed keys structured under an authorized slot', async () => {
    const plan = await createPlan({
      ...strictOptions('{{ ctx.view.record.a-b }}', [['record']]),
      contextParams: { 'view.record': recordParams() },
    });

    expect(plan.bindings[0]).toMatchObject({ prefix: ['record'], relativePaths: [['a-b']] });
  });

  it.each(['query.page', 'env.PUBLIC_X', 'defineProperty.x', 'constructor.x'])(
    'rejects protected context root %s',
    async (path) => {
      const template = `{{ ctx.${path} }}`;
      const plan = await createPlan({
        ...strictOptions(template, [path.split('.').slice(1)]),
        contextParams: { [path]: recordParams() },
      });

      expect(plan.bindings).toEqual([]);
      expect(plan.rejections[0]?.reason).toBe('protected-context-root');
    },
  );

  it.each(['view.then.record', 'view.constructor.record', 'view.defineProperty.record'])(
    'rejects protected nested binding segment %s',
    async (path) => {
      const template = `{{ ctx.${path}.name }}`;
      const plan = await createPlan({
        ...strictOptions(template, [path.split('.').slice(1)]),
        contextParams: { [path]: recordParams() },
      });

      expect(plan.bindings).toEqual([]);
      expect(plan.rejections[0]?.reason).toBe('protected-context-key');
    },
  );

  it('rejects a protected requested segment below an exact descriptor', async () => {
    const plan = await createPlan({
      ...strictOptions('{{ ctx.view.record.constructor.name }}', [['record']]),
      contextParams: { 'view.record': recordParams() },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.rejections[0]?.reason).toBe('protected-context-key');
  });

  it('keeps flat numeric indices structured', async () => {
    const plan = await createPlan({
      ...strictOptions('{{ ctx.list[0].name }}', [[0]]),
      contextParams: { 'list.0': recordParams() },
    });

    expect(plan.bindings[0]).toMatchObject({ prefix: [0], relativePaths: [['name']] });
  });

  it('keeps nested array indices structured', async () => {
    const plan = await createPlan({
      ...strictOptions('{{ ctx.list[0].name }}', [[0]]),
      contextParams: { list: [recordParams()] },
    });

    expect(plan.bindings[0]).toMatchObject({
      prefix: [0],
      relativePaths: [['name']],
      contextLocation: ['list', 0],
    });
  });

  it('distinguishes a literal dotted object key from a flattened context key', async () => {
    const options = strictOptions('{{ ctx.view["record.name"].id }}', [['record.name']]);
    const nested = await createPlan({
      ...options,
      contextParams: { view: { 'record.name': recordParams() } },
    });
    const flat = await createPlan({
      ...options,
      contextParams: { 'view.record.name': recordParams() },
    });

    expect(nested.bindings[0]).toMatchObject({ prefix: ['record.name'], relativePaths: [['id']] });
    expect(flat.bindings).toEqual([]);
    expect(flat.rejections).toEqual([]);
  });

  it('removes unused descriptors without rejecting them', async () => {
    const plan = await createPlan({
      usage: usageOf('{{ ctx.view.record.name }}'),
      contextParams: { 'other.record': recordParams() },
    });

    expect(plan).toMatchObject({ bindings: [], contextParams: {}, rejections: [] });
  });

  it('strips a descriptor when a strict path has no record slot policy', async () => {
    const plan = await createPlan({
      usage: usageOf('{{ ctx.registered.record.name }}'),
      contextParams: { 'registered.record': recordParams() },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.contextParams).toEqual({});
    expect(plan.rejections).toEqual([]);
  });

  it('requires an exact policy for internal variable bindings', async () => {
    const options = {
      usage: usageOf('{{ ctx.internal.record }}'),
      contextParams: { 'internal.record': recordParams() },
    };

    expect((await createPlan(options)).bindings).toEqual([]);
    expect(
      (
        await createPlan({
          ...strictOptions('{{ ctx.internal.record }}', [['record']]),
          contextParams: options.contextParams,
        })
      ).bindings[0],
    ).toMatchObject({
      relativePaths: [[]],
      preferFullRecord: true,
    });
  });

  it('returns an immutable plan without freezing caller input', async () => {
    const params = recordParams();
    const contextParams = { 'view.record': params };
    const plan = await createPlan({
      ...strictOptions('{{ ctx.view.record.name }}', [['record']]),
      contextParams,
    });

    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.bindings)).toBe(true);
    expect(Object.isFrozen(plan.bindings[0].relativePaths[0])).toBe(true);
    expect(Object.isFrozen(plan.bindings[0].params)).toBe(true);
    expect(Object.isFrozen(plan.contextParams)).toBe(true);
    expect(Object.isFrozen(params)).toBe(false);
  });
});
