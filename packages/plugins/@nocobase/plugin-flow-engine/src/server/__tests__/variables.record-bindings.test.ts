/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { analyzeVariableTemplate } from '../template/variable-expression';
import { planRecordBindings, type RecordContextPolicy } from '../variables/record-bindings';

const recordParams = (filterByTk = 1) => ({ collection: 'users', dataSourceKey: 'main', filterByTk });

const usageOf = (template: unknown) => analyzeVariableTemplate(template).usage;

describe('record binding planner', () => {
  it('authorizes only a structured strict prefix and removes the descriptor from ordinary context params', () => {
    const plan = planRecordBindings({
      usage: usageOf('{{ ctx.view.record.name }}'),
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

  it('rejects an exact scalar leaf in strict mode', () => {
    const plan = planRecordBindings({
      usage: usageOf('{{ ctx.view.record.name }}'),
      contextParams: { 'view.record.name': recordParams() },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.rejections).toEqual([
      expect.objectContaining({
        reason: 'exact-whole-record-not-allowed',
        varName: 'view',
        prefix: ['record', 'name'],
      }),
    ]);
  });

  it.each<[string, readonly string[]]>([
    ['popup.record', ['record']],
    ['popup.sourceRecord', ['sourceRecord']],
    ['popup.parent.record', ['parent', 'record']],
    ['popup.parent.sourceRecord', ['parent', 'sourceRecord']],
    ['popup.parent.parent.record', ['parent', 'parent', 'record']],
  ])('allows the declared whole-record slot %s', (path, prefix) => {
    const policy: RecordContextPolicy = { exactWholeRecordPaths: [prefix] };
    const plan = planRecordBindings({
      usage: usageOf(`{{ ctx.${path} }}`),
      contextParams: { [path]: recordParams() },
      policies: { popup: policy },
    });

    expect(plan.rejections).toEqual([]);
    expect(plan.bindings).toEqual([
      expect.objectContaining({ varName: 'popup', prefix, relativePaths: [[]], preferFullRecord: true }),
    ]);
  });

  it('does not treat a whole-record slot as globally allowed', () => {
    const plan = planRecordBindings({
      usage: usageOf('{{ ctx.popup.parent.record }}'),
      contextParams: { 'popup.parent.record': recordParams() },
      policies: { popup: { exactWholeRecordPaths: [['record']] } },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.rejections[0]?.reason).toBe('exact-whole-record-not-allowed');
  });

  it.each(['query.page', 'env.PUBLIC_X', 'defineProperty.x', 'constructor.x'])(
    'rejects protected context root %s',
    (path) => {
      const plan = planRecordBindings({
        usage: usageOf(`{{ ctx.${path} }}`),
        contextParams: { [path]: recordParams() },
        mode: 'trusted',
      });

      expect(plan.bindings).toEqual([]);
      expect(plan.rejections[0]?.reason).toBe('protected-context-root');
    },
  );

  it('keeps flat numeric indices structured', () => {
    const plan = planRecordBindings({
      usage: usageOf('{{ ctx.list[0].name }}'),
      contextParams: { 'list.0': recordParams() },
    });

    expect(plan.bindings[0]).toMatchObject({ prefix: [0], relativePaths: [['name']] });
  });

  it('keeps nested array indices structured', () => {
    const plan = planRecordBindings({
      usage: usageOf('{{ ctx.list[0].name }}'),
      contextParams: { list: [recordParams()] },
    });

    expect(plan.bindings[0]).toMatchObject({
      prefix: [0],
      relativePaths: [['name']],
      contextLocation: ['list', 0],
    });
  });

  it('distinguishes a literal dotted object key from a flattened context key', () => {
    const usage = usageOf('{{ ctx.view["record.name"].id }}');
    const nested = planRecordBindings({
      usage,
      contextParams: { view: { 'record.name': recordParams() } },
    });
    const flat = planRecordBindings({
      usage,
      contextParams: { 'view.record.name': recordParams() },
    });

    expect(nested.bindings[0]).toMatchObject({ prefix: ['record.name'], relativePaths: [['id']] });
    expect(flat.bindings).toEqual([]);
    expect(flat.rejections).toEqual([]);
  });

  it('removes unused descriptors without rejecting them', () => {
    const plan = planRecordBindings({
      usage: usageOf('{{ ctx.view.record.name }}'),
      contextParams: { 'other.record': recordParams() },
    });

    expect(plan).toMatchObject({ bindings: [], contextParams: {}, rejections: [] });
  });

  it('honors an explicit strict-prefix denial', () => {
    const plan = planRecordBindings({
      usage: usageOf('{{ ctx.registered.record.name }}'),
      contextParams: { 'registered.record': recordParams() },
      policies: { registered: { allowGenericStrictPrefix: false } },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.rejections[0]?.reason).toBe('generic-strict-prefix-not-allowed');
  });

  it('requires an explicit trusted mode for permissive exact bindings', () => {
    const options = {
      usage: usageOf('{{ ctx.internal.record }}'),
      contextParams: { 'internal.record': recordParams() },
    };

    expect(planRecordBindings(options).rejections[0]?.reason).toBe('exact-whole-record-not-allowed');
    expect(planRecordBindings({ ...options, mode: 'trusted' }).bindings[0]).toMatchObject({
      relativePaths: [[]],
      preferFullRecord: true,
    });
  });

  it('returns an immutable plan without freezing caller input', () => {
    const params = recordParams();
    const contextParams = { 'view.record': params };
    const plan = planRecordBindings({ usage: usageOf('{{ ctx.view.record.name }}'), contextParams });

    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.bindings)).toBe(true);
    expect(Object.isFrozen(plan.bindings[0].relativePaths[0])).toBe(true);
    expect(Object.isFrozen(plan.bindings[0].params)).toBe(true);
    expect(Object.isFrozen(plan.contextParams)).toBe(true);
    expect(Object.isFrozen(params)).toBe(false);
  });
});
