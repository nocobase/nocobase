/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { actionLinkageRules } from '../linkageRules';

const buildRuleParams = (disabled: boolean) => ({
  value: [
    {
      key: 'rule-1',
      title: 'rule-1',
      enable: true,
      condition: {
        logic: '$and',
        items: [],
      },
      actions: [
        {
          name: 'mockSetDisabled',
          params: {
            disabled,
          },
        },
      ],
    },
  ],
});

describe('actionLinkageRules - original props lifecycle', () => {
  it('does not rollback manually changed props between runs', async () => {
    const engine = new FlowEngine();
    const model = new FlowModel({
      uid: 'linkage-original-props',
      flowEngine: engine,
      props: {
        title: 'Action',
      },
    }) as any;

    const ctx: any = {
      model,
      flowKey: 'buttonSettings',
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      t: (value: any) => value,
      resolveJsonTemplate: async (value: any) => value,
      getAction: (name: string) => {
        if (name !== 'mockSetDisabled') {
          return undefined;
        }
        return {
          handler: (_actionCtx: any, params: any) => {
            params.setProps(model, { disabled: !!params.disabled });
          },
        };
      },
    };

    await actionLinkageRules.handler(ctx, buildRuleParams(true));
    expect(model.props.disabled).toBe(true);
    expect(model.props.color).toBeUndefined();

    // simulate user manually updating button color from settings panel
    model.setProps({ color: 'pink' });

    await actionLinkageRules.handler(ctx, buildRuleParams(false));
    expect(model.props.disabled).toBe(false);
    expect(model.props.color).toBe('pink');
  });

  it('restores disabled when linkage condition becomes unmatched', async () => {
    const engine = new FlowEngine();
    const model = new FlowModel({
      uid: 'linkage-unmatched-reset',
      flowEngine: engine,
      props: {
        title: 'Action',
      },
    }) as any;

    const ctx: any = {
      model,
      flowKey: 'buttonSettings',
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      t: (value: any) => value,
      resolveJsonTemplate: async (value: any) => value,
      getAction: (name: string) => {
        if (name !== 'mockSetDisabled') {
          return undefined;
        }
        return {
          handler: (_actionCtx: any, params: any) => {
            params.setProps(model, { disabled: !!params.disabled });
          },
        };
      },
    };

    await actionLinkageRules.handler(ctx, buildRuleParams(true));
    expect(model.props.disabled).toBe(true);

    const unmatchedParams = buildRuleParams(true);
    unmatchedParams.value[0].enable = false;
    await actionLinkageRules.handler(ctx, unmatchedParams);
    expect(model.props.disabled).toBeUndefined();
  });
});
