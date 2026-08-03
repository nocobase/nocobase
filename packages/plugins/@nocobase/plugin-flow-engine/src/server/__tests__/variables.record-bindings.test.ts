/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { analyzeVariableTemplate, type PathSegment } from '../template/variable-expression';
import { planRecordBindings } from '../variables/record-bindings';
import { getRecordBindingPolicies } from '../variables/registry';

const recordParams = (filterByTk = 1) => ({ collection: 'users', dataSourceKey: 'main', filterByTk });

const usageOf = (template: unknown) => analyzeVariableTemplate(template).usage;

function strictOptions(template: unknown, slots: readonly (readonly PathSegment[])[]) {
  const analysis = analyzeVariableTemplate(template);
  return {
    policies: new Map(
      analysis.paths.map((path, index) => [
        path.canonicalKey,
        { slot: slots[index], source: 'direct-record' as const },
      ]),
    ),
    usage: analysis.usage,
  };
}

describe('record binding planner', () => {
  it('authorizes only a structured strict prefix and removes the descriptor from ordinary context params', () => {
    const plan = planRecordBindings({
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

  it('rejects an exact scalar leaf in strict mode', () => {
    const plan = planRecordBindings({
      ...strictOptions('{{ ctx.view.record.name }}', [['record']]),
      contextParams: { 'view.record.name': recordParams() },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.rejections).toEqual([
      expect.objectContaining({
        reason: 'record-slot-mismatch',
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
    const plan = planRecordBindings({
      ...strictOptions(`{{ ctx.${path} }}`, [prefix]),
      contextParams: { [path]: recordParams() },
    });

    expect(plan.rejections).toEqual([]);
    expect(plan.bindings).toEqual([
      expect.objectContaining({ varName: 'popup', prefix, relativePaths: [[]], preferFullRecord: true }),
    ]);
  });

  it('does not treat a whole-record slot as globally allowed', () => {
    const plan = planRecordBindings({
      ...strictOptions('{{ ctx.popup.parent.record }}', [['record']]),
      contextParams: { 'popup.parent.record': recordParams() },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.rejections[0]?.reason).toBe('record-slot-mismatch');
  });

  it('compiles fixed direct, view, and popup parent slots per canonical path', () => {
    const analysis = analyzeVariableTemplate([
      '{{ ctx.record.name }}',
      '{{ ctx.responseRecord.id }}',
      '{{ ctx.clickedRowRecord.title }}',
      '{{ ctx.view.record.department.name }}',
      '{{ ctx.popup.parent.sourceRecord.owner.name }}',
    ]);
    const policies = getRecordBindingPolicies(analysis.usage);

    expect(analysis.paths.map((path) => policies.get(path.canonicalKey)?.slot)).toEqual([
      [],
      [],
      [],
      ['record'],
      ['parent', 'sourceRecord'],
    ]);
  });

  it('filters each binding to paths authorized for its exact slot', () => {
    const plan = planRecordBindings({
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
  ] as const)('rejects a descriptor moved below its exact slot for %s', (template, contextKey, slot) => {
    const plan = planRecordBindings({
      ...strictOptions(template, [slot]),
      contextParams: { [contextKey]: recordParams() },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.contextParams).toEqual({});
    expect(plan.rejections[0]).toMatchObject({ reason: 'record-slot-mismatch', contextKey });
  });

  it('keeps dashed keys structured under an authorized slot', () => {
    const plan = planRecordBindings({
      ...strictOptions('{{ ctx.view.record.a-b }}', [['record']]),
      contextParams: { 'view.record': recordParams() },
    });

    expect(plan.bindings[0]).toMatchObject({ prefix: ['record'], relativePaths: [['a-b']] });
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

  it.each(['view.then.record', 'view.constructor.record', 'view.defineProperty.record'])(
    'rejects protected nested binding segment %s in trusted mode',
    (path) => {
      const plan = planRecordBindings({
        usage: usageOf(`{{ ctx.${path}.name }}`),
        contextParams: { [path]: recordParams() },
        mode: 'trusted',
      });

      expect(plan.bindings).toEqual([]);
      expect(plan.rejections[0]?.reason).toBe('protected-context-key');
    },
  );

  it('keeps flat numeric indices structured', () => {
    const plan = planRecordBindings({
      usage: usageOf('{{ ctx.list[0].name }}'),
      contextParams: { 'list.0': recordParams() },
      mode: 'trusted',
    });

    expect(plan.bindings[0]).toMatchObject({ prefix: [0], relativePaths: [['name']] });
  });

  it('keeps nested array indices structured', () => {
    const plan = planRecordBindings({
      usage: usageOf('{{ ctx.list[0].name }}'),
      contextParams: { list: [recordParams()] },
      mode: 'trusted',
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
      mode: 'trusted',
    });
    const flat = planRecordBindings({
      usage,
      contextParams: { 'view.record.name': recordParams() },
      mode: 'trusted',
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

  it('fails closed when a strict path has no record slot policy', () => {
    const plan = planRecordBindings({
      usage: usageOf('{{ ctx.registered.record.name }}'),
      contextParams: { 'registered.record': recordParams() },
    });

    expect(plan.bindings).toEqual([]);
    expect(plan.rejections[0]?.reason).toBe('missing-record-slot-policy');
  });

  it('requires an explicit trusted mode for permissive exact bindings', () => {
    const options = {
      usage: usageOf('{{ ctx.internal.record }}'),
      contextParams: { 'internal.record': recordParams() },
    };

    expect(planRecordBindings(options).rejections[0]?.reason).toBe('missing-record-slot-policy');
    expect(planRecordBindings({ ...options, mode: 'trusted' }).bindings[0]).toMatchObject({
      relativePaths: [[]],
      preferFullRecord: true,
    });
  });

  it('returns an immutable plan without freezing caller input', () => {
    const params = recordParams();
    const contextParams = { 'view.record': params };
    const plan = planRecordBindings({ usage: usageOf('{{ ctx.view.record.name }}'), contextParams, mode: 'trusted' });

    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.bindings)).toBe(true);
    expect(Object.isFrozen(plan.bindings[0].relativePaths[0])).toBe(true);
    expect(Object.isFrozen(plan.bindings[0].params)).toBe(true);
    expect(Object.isFrozen(plan.contextParams)).toBe(true);
    expect(Object.isFrozen(params)).toBe(false);
  });
});
