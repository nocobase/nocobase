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
import { actionLinkageRules, linkageSetActionProps, updateLinkageRules } from '../linkageRules';

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
    expect(fork.serialize().props).toMatchObject({ title: 'Updated' });
    expect(fork.serialize().props).not.toHaveProperty('disabled');

    const refreshedFork = master.createFork({ className: 'row-action' });
    expect(refreshedFork.getProps().title).toBe('Updated');
  });

  it.each(['disable', 'delete'] as const)(
    'restores a row action when linkage rules are %sd without persisting disabled',
    async (change) => {
      const engine = new FlowEngine();
      engine.registerModels({ ConfiguredActionModel });
      engine.registerActions({ actionLinkageRules, linkageSetActionProps });

      let savedData: ReturnType<ConfiguredActionModel['serialize']> | undefined;
      engine.setModelRepository({
        save: async (model) => {
          savedData = model.serialize();
          return savedData;
        },
      } as Parameters<FlowEngine['setModelRepository']>[0]);

      const enabledRules = [
        {
          key: 'disable-edit',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [{ name: 'linkageSetActionProps', params: { value: 'disabled' } }],
        },
      ];
      const master = engine.createModel<ConfiguredActionModel>({
        use: 'ConfiguredActionModel',
        props: { title: 'Edit' },
        stepParams: {
          buttonSettings: {
            linkageRules: { value: enabledRules },
          },
        },
      });
      const fork = master.createFork({ className: 'row-action' });

      await fork.dispatchEvent('beforeRender', undefined, { useCache: false });
      expect(fork.getProps().disabled).toBe(true);

      const nextRules =
        change === 'disable'
          ? updateLinkageRules(enabledRules, (rules) => {
              rules[0].enable = false;
            })
          : [];
      fork.setStepParams('buttonSettings', 'linkageRules', { value: nextRules });
      await fork.saveStepParams();
      await fork.rerender();

      expect(savedData).toBeDefined();
      expect(savedData?.props).not.toHaveProperty('disabled');
      expect(savedData?.stepParams.buttonSettings.linkageRules.value).toEqual(nextRules);
      expect(fork.getProps().disabled).toBeUndefined();

      const reloadedEngine = new FlowEngine();
      reloadedEngine.registerModels({ ConfiguredActionModel });
      reloadedEngine.registerActions({ actionLinkageRules, linkageSetActionProps });
      const reloadedMaster = reloadedEngine.createModel<ConfiguredActionModel>({
        use: 'ConfiguredActionModel',
        props: savedData?.props,
        stepParams: savedData?.stepParams,
      });
      const reloadedFork = reloadedMaster.createFork({ className: 'row-action' });

      await reloadedFork.dispatchEvent('beforeRender', undefined, { useCache: false });
      expect(reloadedFork.getProps().disabled).toBeUndefined();
    },
  );

  it.each(['disabled', 'deleted'] as const)(
    'ignores a historical disabled prop after the linkage rule is %s',
    async (state) => {
      const engine = new FlowEngine();
      engine.registerModels({ ConfiguredActionModel });
      engine.registerActions({ actionLinkageRules, linkageSetActionProps });
      const rules =
        state === 'disabled'
          ? [
              {
                key: 'disable-edit',
                enable: false,
                condition: { logic: '$and', items: [] },
                actions: [{ name: 'linkageSetActionProps', params: { value: 'disabled' } }],
              },
            ]
          : [];
      const master = engine.createModel<ConfiguredActionModel>({
        use: 'ConfiguredActionModel',
        props: { title: 'Edit', disabled: true },
        stepParams: {
          buttonSettings: {
            linkageRules: { value: rules },
          },
        },
      });
      const fork = master.createFork({ className: 'row-action' });

      expect(master.getProps()).not.toHaveProperty('disabled');
      await fork.dispatchEvent('beforeRender', undefined, { useCache: false });

      expect(fork.getProps().disabled).toBeUndefined();
    },
  );

  it('still applies an enabled linkage rule after dropping a historical disabled prop', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ ConfiguredActionModel });
    engine.registerActions({ actionLinkageRules, linkageSetActionProps });
    const master = engine.createModel<ConfiguredActionModel>({
      use: 'ConfiguredActionModel',
      props: { title: 'Edit', disabled: true },
      stepParams: {
        buttonSettings: {
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

    expect(master.getProps()).not.toHaveProperty('disabled');
    await fork.dispatchEvent('beforeRender', undefined, { useCache: false });

    expect(fork.getProps().disabled).toBe(true);
  });

  it('preserves a default disabled state as runtime-only state', async () => {
    class DefaultDisabledActionModel extends ConfiguredActionModel {
      defaultProps = { ...this.defaultProps, disabled: true };
    }
    const engine = new FlowEngine();
    engine.registerModels({ DefaultDisabledActionModel });
    engine.registerActions({ actionLinkageRules, linkageSetActionProps });
    const master = engine.createModel<DefaultDisabledActionModel>({
      use: 'DefaultDisabledActionModel',
      props: { title: 'Edit' },
      stepParams: {
        buttonSettings: {
          linkageRules: { value: [] },
        },
      },
    });
    const fork = master.createFork({ className: 'row-action' });

    await fork.dispatchEvent('beforeRender', undefined, { useCache: false });

    expect(fork.getProps().disabled).toBe(true);
    expect(fork.serialize().props).not.toHaveProperty('disabled');
  });

  it('updates a disabled row action title through the real beforeRender flow', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ ConfiguredActionModel });
    engine.registerActions({ actionLinkageRules, linkageSetActionProps });
    let savedData: ReturnType<ConfiguredActionModel['serialize']> | undefined;
    engine.setModelRepository({
      save: async (model) => {
        savedData = model.serialize();
        return savedData;
      },
    } as Parameters<FlowEngine['setModelRepository']>[0]);
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

    fork.setStepParams('buttonSettings', 'general', { title: 'Updated' });
    await fork.saveStepParams();
    await fork.rerender();

    expect(savedData?.props).not.toHaveProperty('disabled');
    expect(savedData?.stepParams.buttonSettings.general.title).toBe('Updated');
    expect(fork.getProps()).toMatchObject({ title: 'Updated', disabled: true });

    const reloadedEngine = new FlowEngine();
    reloadedEngine.registerModels({ ConfiguredActionModel });
    reloadedEngine.registerActions({ actionLinkageRules, linkageSetActionProps });
    const reloadedMaster = reloadedEngine.createModel<ConfiguredActionModel>({
      use: 'ConfiguredActionModel',
      props: savedData?.props,
      stepParams: savedData?.stepParams,
    });
    const reloadedFork = reloadedMaster.createFork({ className: 'row-action' });

    await reloadedFork.dispatchEvent('beforeRender', undefined, { useCache: false });
    expect(reloadedFork.getProps()).toMatchObject({ title: 'Updated', disabled: true });
  });

  it('creates a new rules value when disabling a linkage rule', () => {
    const rules = [
      {
        key: 'disable-edit',
        title: 'Linkage rule',
        enable: true,
        condition: { logic: '$and', items: [] },
        actions: [],
      },
    ];
    const nextRules = updateLinkageRules(rules, (next) => {
      next[0].enable = false;
    });

    expect(nextRules).toEqual([expect.objectContaining({ key: 'disable-edit', enable: false })]);
    expect(nextRules).not.toBe(rules);
    expect(rules[0].enable).toBe(true);
  });
});
