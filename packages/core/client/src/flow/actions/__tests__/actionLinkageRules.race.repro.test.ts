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

function createActionModel() {
  const model: any = {
    uid: 'edit-action',
    hidden: false,
    props: {
      title: 'Edit',
    },
    context: {},
    setProps: vi.fn((keyOrProps: string | Record<string, any>, value?: any) => {
      if (typeof keyOrProps === 'string') {
        model.props[keyOrProps] = value;
        return;
      }
      model.props = {
        ...model.props,
        ...keyOrProps,
      };
    }),
  };

  return model;
}

function createLinkageParams(actions: any[] = []) {
  return {
    value: actions.length
      ? [
          {
            key: 'hide-edit',
            title: 'hide edit',
            enable: true,
            condition: {
              logic: '$and',
              items: [],
            },
            actions,
          },
        ]
      : [],
  };
}

function createRuntime(model: any, options: { pauseHiddenAction?: boolean } = {}) {
  const { pauseHiddenAction = true } = options;
  let releaseHiddenAction: () => void = () => {};
  let hiddenActionCount = 0;
  const hiddenActionWaiters: Array<{ count: number; resolve: () => void }> = [];
  const waitForHiddenActionCount = (count: number) => {
    if (hiddenActionCount >= count) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      hiddenActionWaiters.push({ count, resolve });
    });
  };
  const hiddenActionReachedPromise = waitForHiddenActionCount(1);
  const releaseHiddenActionPromise = new Promise<void>((resolve) => {
    releaseHiddenAction = resolve;
  });
  const notifyHiddenActionReached = () => {
    hiddenActionCount += 1;
    for (let i = hiddenActionWaiters.length - 1; i >= 0; i--) {
      const waiter = hiddenActionWaiters[i];
      if (hiddenActionCount < waiter.count) continue;
      hiddenActionWaiters.splice(i, 1);
      waiter.resolve();
    }
  };

  const ctx: any = {
    flowKey: 'buttonSettings',
    model,
    app: {
      jsonLogic: {
        apply: vi.fn(() => true),
      },
    },
    t: (s: string) => s,
    resolveJsonTemplate: vi.fn(async (value: any) => value),
    getAction: (name: string) => {
      if (name !== 'linkageSetActionProps') return undefined;

      return {
        handler: async (_ctx: any, params: any) => {
          params.setProps(model, {
            hiddenModel: params.value === 'hidden',
            disabled: false,
            hiddenText: false,
          });
          notifyHiddenActionReached();
          if (pauseHiddenAction) {
            await releaseHiddenActionPromise;
          }
        },
      };
    },
  };

  return {
    ctx,
    hiddenActionReachedPromise,
    waitForHiddenActionCount,
    releaseHiddenAction,
  };
}

describe('actionLinkageRules props patch isolation', () => {
  async function runReproOnce() {
    const model = createActionModel();
    const { ctx, hiddenActionReachedPromise, releaseHiddenAction } = createRuntime(model);

    const hideRun = actionLinkageRules.handler(
      ctx,
      createLinkageParams([
        {
          name: 'linkageSetActionProps',
          params: {
            value: 'hidden',
          },
        },
      ]),
    );

    await hiddenActionReachedPromise;
    expect(model.hidden).toBe(false);

    await actionLinkageRules.handler(ctx, createLinkageParams());
    expect(model.hidden).toBe(false);

    releaseHiddenAction();
    await hideRun;

    expect(model.hidden).toBe(true);
  }

  it('keeps a concurrent empty run from clearing another run props patch', async () => {
    for (let i = 0; i < 50; i++) {
      await runReproOnce();
    }
  });

  it('still restores original props when a later completed run has no matched actions', async () => {
    const model = createActionModel();
    const { ctx } = createRuntime(model, { pauseHiddenAction: false });

    await actionLinkageRules.handler(
      ctx,
      createLinkageParams([
        {
          name: 'linkageSetActionProps',
          params: {
            value: 'hidden',
          },
        },
      ]),
    );
    expect(model.hidden).toBe(true);

    await actionLinkageRules.handler(ctx, createLinkageParams());
    expect(model.hidden).toBe(false);
  });

  it('keeps concurrent matched runs from clearing each other props patch', async () => {
    const model = createActionModel();
    const { ctx, waitForHiddenActionCount, releaseHiddenAction } = createRuntime(model);
    const params = createLinkageParams([
      {
        name: 'linkageSetActionProps',
        params: {
          value: 'hidden',
        },
      },
    ]);

    const firstRun = actionLinkageRules.handler(ctx, params);
    await waitForHiddenActionCount(1);

    const secondRun = actionLinkageRules.handler(ctx, params);
    await waitForHiddenActionCount(2);

    releaseHiddenAction();
    await firstRun;
    await secondRun;

    expect(model.hidden).toBe(true);
  });
});
