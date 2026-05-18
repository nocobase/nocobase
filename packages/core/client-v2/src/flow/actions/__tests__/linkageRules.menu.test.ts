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
import { linkageRunjs, linkageSetMenuItemProps, menuLinkageRules } from '../linkageRules';

describe('menu linkage rules', () => {
  it('should register menu linkage actions from the actions entry', () => {
    expect(registeredActions.menuLinkageRules).toBe(menuLinkageRules);
    expect(registeredActions.linkageSetMenuItemProps).toBe(linkageSetMenuItemProps);
  });

  it('should expose menu state and runjs actions in ui schema', () => {
    const schema = menuLinkageRules.uiSchema?.({
      getActions: () =>
        new Map([
          ['linkageSetMenuItemProps', linkageSetMenuItemProps],
          ['linkageRunjs', linkageRunjs],
          [
            'actionOnly',
            {
              name: 'actionOnly',
              scene: ActionScene.ACTION_LINKAGE_RULES,
            },
          ],
        ]),
    } as any) as any;

    expect(schema?.value?.['x-component-props']?.supportedActions).toEqual(['linkageSetMenuItemProps', 'linkageRunjs']);
  });

  it('should set menu model hidden through common linkage handler', async () => {
    const setProps = vi.fn(function (this: any, props: any) {
      this.props = {
        ...this.props,
        ...props,
      };
    });
    const setHidden = vi.fn(function (this: any, value: boolean) {
      this.hidden = value;
    });
    const model: any = {
      uid: 'menu-item-1',
      props: {},
      hidden: false,
      __allModels: [],
      setProps,
      setHidden,
    };
    const ctx: any = {
      app: { jsonLogic: { apply: () => true } },
      model,
      t: (text: string) => text,
      getAction: (name: string) => (name === 'linkageSetMenuItemProps' ? linkageSetMenuItemProps : undefined),
      resolveJsonTemplate: vi.fn(async (value: any) => value),
    };

    await menuLinkageRules.handler(ctx, {
      value: [
        {
          key: 'r1',
          title: 'Hide menu item',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              key: 'a1',
              name: 'linkageSetMenuItemProps',
              params: {
                value: 'hidden',
              },
            },
          ],
        },
      ],
    });

    expect(setHidden).toHaveBeenCalledWith(true);
    expect(model.hidden).toBe(true);
  });
});
