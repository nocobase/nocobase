/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { actionLinkageRules } from '../linkageRules';

function createRule(actions: any[]) {
  return {
    key: 'r1',
    title: 'r1',
    enable: true,
    condition: { logic: '$and', items: [] },
    actions,
  };
}

describe('linkageRules hidden state propagation', () => {
  it('restores hidden state to same-target models when reverting to original props', async () => {
    const blockModel = { uid: 'block-1' };

    const hostModel: any = {
      uid: 'host',
      hidden: false,
      context: { blockModel, fieldPathArray: ['org_o2m'] },
      __allModels: [],
      setProps: vi.fn(),
      getFlow: vi.fn(() => ({})),
      getStepParams: vi.fn((_flowKey: string, stepKey: string) => {
        if (stepKey === 'init') return { fieldPath: 'org_o2m' };
        return undefined;
      }),
      translate: (s: string) => s,
    };

    const sameTargetModel: any = {
      uid: 'same-target',
      hidden: false,
      context: { blockModel, fieldPathArray: ['org_o2m'] },
      setProps: vi.fn(),
      getStepParams: vi.fn((_flowKey: string, stepKey: string) => {
        if (stepKey === 'init') return { fieldPath: 'org_o2m' };
        return undefined;
      }),
      translate: (s: string) => s,
    };

    const nestedColumnModel: any = {
      uid: 'nested-column',
      hidden: true,
      context: { blockModel, fieldPathArray: ['org_o2m'] },
      setProps: vi.fn(),
      getStepParams: vi.fn((_flowKey: string, stepKey: string) => {
        if (stepKey === 'init') return { fieldPath: 'org_o2m.companyName' };
        return undefined;
      }),
      translate: (s: string) => s,
    };

    const engine = {
      forEachModel: (visitor: (m: any) => void) => {
        [hostModel, sameTargetModel, nestedColumnModel].forEach(visitor);
      },
    };

    const ctx: any = {
      flowKey: 'buttonSettings',
      model: hostModel,
      engine,
      app: {
        jsonLogic: {
          apply: vi.fn(() => true),
        },
      },
      resolveJsonTemplate: vi.fn(async (value: any) => value),
      getAction: (name: string) => {
        if (name !== 'linkageSetActionProps') return undefined;
        return {
          handler: async (_ctx: any, params: any) => {
            params.setProps(hostModel, {
              hiddenModel: params.value === 'hidden',
              disabled: false,
              hiddenText: false,
            });
          },
        };
      },
    };

    await actionLinkageRules.handler(ctx, {
      value: [
        createRule([
          {
            name: 'linkageSetActionProps',
            params: { value: 'hidden' },
          },
        ]),
      ],
    });
    expect(hostModel.hidden).toBe(true);
    expect(sameTargetModel.hidden).toBe(true);
    expect(nestedColumnModel.hidden).toBe(true);

    await actionLinkageRules.handler(ctx, { value: [] });
    expect(hostModel.hidden).toBe(false);
    expect(sameTargetModel.hidden).toBe(false);
    expect(nestedColumnModel.hidden).toBe(true);
  });
});
