/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';

import * as registeredActions from '../index';
import * as linkageActions from '../linkageRules';

const tabLinkageRules = (linkageActions as Record<string, unknown>).tabLinkageRules as
  | typeof linkageActions.menuLinkageRules
  | undefined;
const linkageSetTabProps = (linkageActions as Record<string, unknown>).linkageSetTabProps as
  | typeof linkageActions.linkageSetMenuItemProps
  | undefined;

function createRuntime() {
  let matched = true;
  const setProps = vi.fn(function (this: { props: Record<string, unknown> }, props: Record<string, unknown>) {
    this.props = {
      ...this.props,
      ...props,
    };
  });
  const setHidden = vi.fn(function (this: { hidden: boolean }, value: boolean) {
    this.hidden = value;
  });
  const model = {
    uid: 'tab-1',
    props: {},
    hidden: false,
    __allModels: [],
    setProps,
    setHidden,
  };
  const ctx = {
    app: { jsonLogic: { apply: () => matched } },
    model,
    t: (text: string) => text,
    getAction: (name: string) => (name === 'linkageSetTabProps' ? linkageSetTabProps : undefined),
    resolveJsonTemplate: vi.fn(async (value: unknown) => value),
  };

  return {
    ctx,
    model,
    setMatched(value: boolean) {
      matched = value;
    },
  };
}

const hideRule = {
  value: [
    {
      key: 'rule-1',
      title: 'Hide tab',
      enable: true,
      condition: {
        logic: '$and',
        items: [{ path: 'status', operator: '$eq', value: 'visible' }],
      },
      actions: [
        {
          key: 'action-1',
          name: 'linkageSetTabProps',
          params: { value: 'hidden' },
        },
      ],
    },
  ],
};

describe('tab linkage rules', () => {
  it('should append the tab linkage scene without changing existing scene values', () => {
    const scenes = ActionScene as unknown as Record<string, number>;

    expect(scenes.MENU_LINKAGE_RULES).toBe(7);
    expect(scenes.TAB_LINKAGE_RULES).toBe(8);
    expect(scenes.TAB_LINKAGE_RULES).toBe(Math.max(...Object.values(scenes).filter(Number.isInteger)));
  });

  it('should register tab linkage actions from the actions entry', () => {
    expect((registeredActions as Record<string, unknown>).tabLinkageRules).toBe(tabLinkageRules);
    expect((registeredActions as Record<string, unknown>).linkageSetTabProps).toBe(linkageSetTabProps);
    expect(tabLinkageRules).toBeDefined();
    expect(linkageSetTabProps).toBeDefined();
  });

  it('should expose tab state and runjs actions in ui schema', () => {
    expect(tabLinkageRules).toBeDefined();
    expect(linkageSetTabProps).toBeDefined();

    const schema = tabLinkageRules?.uiSchema?.({
      getActions: () =>
        new Map([
          ['linkageSetTabProps', linkageSetTabProps],
          ['linkageRunjs', linkageActions.linkageRunjs],
          ['linkageSetMenuItemProps', linkageActions.linkageSetMenuItemProps],
        ]),
    } as never) as Record<string, Record<string, Record<string, unknown>>> | undefined;

    expect(schema?.value?.['x-component-props']?.supportedActions).toEqual(['linkageSetTabProps', 'linkageRunjs']);
    expect(linkageSetTabProps?.scene).toBe((ActionScene as unknown as Record<string, number>).TAB_LINKAGE_RULES);
    expect(linkageActions.linkageRunjs.scene).toContain(
      (ActionScene as unknown as Record<string, number>).TAB_LINKAGE_RULES,
    );
  });

  it('should hide the tab when the condition matches and restore it when the condition misses', async () => {
    expect(tabLinkageRules).toBeDefined();
    const runtime = createRuntime();

    await tabLinkageRules?.handler(runtime.ctx as never, hideRule);
    expect(runtime.model.hidden).toBe(true);

    runtime.setMatched(false);
    await tabLinkageRules?.handler(runtime.ctx as never, hideRule);
    expect(runtime.model.hidden).toBe(false);
  });

  it('should restore the tab when linkage rules are cleared', async () => {
    expect(tabLinkageRules).toBeDefined();
    const runtime = createRuntime();

    await tabLinkageRules?.handler(runtime.ctx as never, hideRule);
    expect(runtime.model.hidden).toBe(true);

    await tabLinkageRules?.handler(runtime.ctx as never, { value: [] });
    expect(runtime.model.hidden).toBe(false);
  });
});
