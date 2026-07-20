/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { ActionModel as ConfiguredActionModel } from '../../models/base/ActionModel';
import { ActionModel } from '../../models/base/ActionModelCore';
import { actionLinkageRules, linkageSetActionProps } from '../linkageRules';

class TestActionModel extends ActionModel {}

describe('action linkage rules on action forks', () => {
  it('does not snapshot unrelated master props when disabling an action', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ TestActionModel });
    const master = engine.createModel<TestActionModel>({
      use: 'TestActionModel',
      props: { title: 'Edit' },
    });
    const fork = master.createFork({ className: 'row-action' });

    const ctx = {
      flowKey: 'buttonSettings',
      model: fork,
      app: {
        jsonLogic: {
          apply: vi.fn(() => true),
        },
      },
      t: (value: string) => value,
      resolveJsonTemplate: vi.fn(async (value: unknown) => value),
      getAction: (name: string) => {
        if (name !== 'linkageSetActionProps') return undefined;
        return {
          handler: async (_ctx: unknown, params: { setProps: Function }) => {
            params.setProps(fork, { disabled: true });
          },
        };
      },
    } as never;

    await actionLinkageRules.handler(ctx, {
      value: [
        {
          key: 'disable-edit',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [{ name: 'linkageSetActionProps', params: { value: 'disabled' } }],
        },
      ],
    });

    expect(fork.localProps.title).toBeUndefined();
    expect(fork.__originalProps.title).toBeUndefined();
    expect(fork.localProps.disabled).toBe(true);

    master.setProps('title', 'Updated');
    await actionLinkageRules.handler(ctx, {
      value: [
        {
          key: 'disable-edit',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [{ name: 'linkageSetActionProps', params: { value: 'disabled' } }],
        },
      ],
    });

    expect(fork.getProps().title).toBe('Updated');
    expect(fork.serialize().props.title).toBe('Updated');

    const refreshedFork = master.createFork({ className: 'row-action' });
    expect(refreshedFork.getProps().title).toBe('Updated');
  });

  it('updates a disabled row action title through the real beforeRender flow', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ ConfiguredActionModel });
    engine.registerActions({ actionLinkageRules, linkageSetActionProps });
    const master = engine.createModel<ConfiguredActionModel>({
      use: 'ConfiguredActionModel',
      props: { title: 'Edit' },
      stepParams: {
        buttonSettings: {
          general: { title: 'Edit' },
          linkageRules: {
            value: [
              {
                key: 'disable-edit',
                enable: true,
                condition: { logic: '$and', items: [] },
                actions: [{ name: 'linkageSetActionProps', params: { value: 'disabled' } }],
              },
            ],
          },
        },
      },
    });
    const fork = master.createFork({ className: 'row-action' });

    await fork.dispatchEvent('beforeRender', undefined, { useCache: false });
    expect(fork.getProps()).toMatchObject({ title: 'Edit', disabled: true });

    master.setStepParams('buttonSettings', 'general', { title: 'Updated' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fork.getProps()).toMatchObject({ title: 'Updated', disabled: true });
  });
});
