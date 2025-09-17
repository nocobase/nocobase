/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { evaluateFlowCondition } from '../evaluateFlowCondition';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models';
import { FlowRuntimeContext } from '../../flowContext';
import type { FlowModelOptions } from '../../types';
import type { FilterGroupType } from '@nocobase/utils/client';

describe('evaluateFlowCondition', () => {
  let engine: FlowEngine;
  let model: FlowModel;

  beforeEach(() => {
    engine = new FlowEngine();
    model = new FlowModel({
      uid: 'test-model',
      flowEngine: engine,
      flowRegistry: {},
      stepParams: {},
      subModels: {},
    } as FlowModelOptions);
  });

  it('returns true when no condition provided', async () => {
    const result = await evaluateFlowCondition({
      model,
      flowKey: 'flowA',
      condition: undefined as any,
    });
    expect(result).toBe(true);
  });

  it('evaluates simple filter condition against ctx.model props', async () => {
    model.props = { status: 'active' };
    const condition = {
      logic: '$and',
      items: [
        {
          path: '{{ ctx.model.props.status }}',
          operator: '$eq',
          value: 'active',
        },
      ],
    } satisfies FilterGroupType;

    const ctx = new FlowRuntimeContext(model, 'flowB');
    (ctx as any).logger = { error: vi.fn(), warn: vi.fn() };
    (ctx as any).app = {
      jsonLogic: {
        apply(logic: any) {
          const op = Object.keys(logic)[0];
          const values = Array.isArray(logic[op]) ? logic[op] : [logic[op]];
          const [a, b] = values;
          if (op === '$eq') return a === b;
          return false;
        },
      },
    };
    const result = await evaluateFlowCondition({ model, flowKey: 'flowB', condition, runtimeContext: ctx });
    expect(result).toBe(true);
  });

  it('returns false when filter condition does not match', async () => {
    model.props = { status: 'inactive' };
    const condition = {
      logic: '$and',
      items: [
        {
          path: '{{ ctx.model.props.status }}',
          operator: '$eq',
          value: 'active',
        },
      ],
    } satisfies FilterGroupType;

    const result = await evaluateFlowCondition({ model, flowKey: 'flowC', condition });
    expect(result).toBe(false);
  });

  it('handles nested groups with $or logic', async () => {
    model.props = { role: 'admin', count: 15 };
    const condition = {
      logic: '$or',
      items: [
        {
          path: '{{ ctx.event.args.type }}',
          operator: '$eq',
          value: 'primary',
        },
        {
          logic: '$and',
          items: [
            {
              path: '{{ ctx.model.props.role }}',
              operator: '$eq',
              value: 'admin',
            },
            {
              path: '{{ ctx.model.props.count }}',
              operator: '$gt',
              value: 10,
            },
          ],
        },
      ],
    } satisfies FilterGroupType;

    const ctx = new FlowRuntimeContext(model, 'flowD');
    (ctx as any).logger = { error: vi.fn(), warn: vi.fn() };
    (ctx as any).app = {
      jsonLogic: {
        apply(logic: any) {
          const op = Object.keys(logic)[0];
          const values = Array.isArray(logic[op]) ? logic[op] : [logic[op]];
          const [a, b] = values;
          if (op === '$eq') return a === b;
          if (op === '$gt') return a > b;
          return false;
        },
      },
    };
    const result = await evaluateFlowCondition({
      model,
      flowKey: 'flowD',
      condition,
      eventName: 'click',
      inputArgs: { type: 'secondary' },
      runtimeContext: ctx,
    });
    expect(result).toBe(true);
  });

  it('supports unary operators such as $notEmpty', async () => {
    model.props = { tags: ['a'] };
    const condition = {
      logic: '$and',
      items: [
        {
          path: '{{ ctx.model.props.tags }}',
          operator: '$notEmpty',
          // 一元操作符：由前端保证提供占位 value（与联动规则一致）
          value: '',
        },
      ],
    } satisfies FilterGroupType;

    const ctx = new FlowRuntimeContext(model, 'flowE');
    (ctx as any).logger = { error: vi.fn(), warn: vi.fn() };
    (ctx as any).app = {
      jsonLogic: {
        apply(logic: any) {
          const op = Object.keys(logic)[0];
          const values = Array.isArray(logic[op]) ? logic[op] : [logic[op]];
          const [a] = values;
          if (op === '$notEmpty') return Array.isArray(a) ? a.length > 0 : !!a;
          return false;
        },
      },
    };
    const result = await evaluateFlowCondition({ model, flowKey: 'flowE', condition, runtimeContext: ctx });
    expect(result).toBe(true);
  });

  it('returns false when condition evaluates to false', async () => {
    const condition: FilterGroupType = {
      logic: '$and',
      items: [
        {
          path: '{{ ctx.event.args.type }}',
          operator: '$eq',
          value: 'never',
        },
      ],
    };

    const ctx = new FlowRuntimeContext(model, 'flowF');
    (ctx as any).logger = { error: vi.fn(), warn: vi.fn() };
    (ctx as any).app = {
      jsonLogic: {
        apply(logic: any) {
          const op = Object.keys(logic)[0];
          const values = Array.isArray(logic[op]) ? logic[op] : [logic[op]];
          const [a, b] = values;
          if (op === '$eq') return a === b;
          return false;
        },
      },
    };

    const result = await evaluateFlowCondition({
      model,
      flowKey: 'flowF',
      condition,
      eventName: 'click',
      inputArgs: { type: 'primary' },
      runtimeContext: ctx,
    });
    expect(result).toBe(false);
  });

  it('executes function condition with runtime context', async () => {
    const fn = vi.fn().mockImplementation((ctx) => ctx.model?.props?.flag === true);
    model.props = { flag: true };

    const result = await evaluateFlowCondition({ model, flowKey: 'flowG', condition: fn });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('returns false when function condition throws error', async () => {
    const errorLogger = { error: vi.fn(), warn: vi.fn() } as any;
    const fn = vi.fn().mockImplementation(() => {
      throw new Error('boom');
    });

    const ctx = new FlowRuntimeContext(model, 'flowH');
    (ctx as any).logger = errorLogger;
    const result = await evaluateFlowCondition({ model, flowKey: 'flowH', condition: fn, runtimeContext: ctx });

    expect(result).toBe(false);
    expect(errorLogger.error).toHaveBeenCalled();
  });

  it('falls back to raw structure if resolveJsonTemplate fails', async () => {
    const warnLogger = { error: vi.fn(), warn: vi.fn() } as any;
    const resolver = vi.fn().mockRejectedValue(new Error('resolve error'));
    const condition = {
      logic: '$and',
      items: [
        {
          path: '{{ ctx.model.props.status }}',
          operator: '$eq',
          value: 'active',
        },
      ],
    } satisfies FilterGroupType;

    model.props = { status: 'active' };
    const context = new FlowRuntimeContext(model, 'flowI');
    // inject failing resolver
    (context as any).resolveJsonTemplate = resolver;

    (context as any).logger = warnLogger;
    const result = await evaluateFlowCondition({ model, flowKey: 'flowI', condition, runtimeContext: context });

    expect(result).toBe(false);
    expect(resolver).toHaveBeenCalled();
    expect(warnLogger.warn).toHaveBeenCalled();
  });
});
