/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { FlowEngine } from '../flowEngine';
import { FlowModel } from '../models/flowModel';

describe('FlowModelContext.openView - navigation enforcement', () => {
  function setup() {
    const engine = new FlowEngine();
    const parent = engine.createModel({ use: 'FlowModel', uid: 'parent-uid' });

    // minimal child model stub used by ctx.openView
    const child: any = {
      uid: 'child-uid',
      stepParams: {},
      context: {
        defineProperty: vi.fn(),
      },
      getStepParams: vi.fn(() => undefined),
      setStepParams: vi.fn(),
      setParent: vi.fn(),
      save: vi.fn(async () => undefined),
      dispatchEvent: vi.fn(async (_event: string, _params?: any) => undefined),
    };

    // inject loadModel so ctx.openView finds existing model and skips createModel('PopupActionModel')
    (engine as any).loadModel = vi.fn(async ({ uid }: { uid: string }) => (uid ? child : null));

    return { engine, parent, child };
  }

  it('forces options.navigation=false when options.defineProperties exists', async () => {
    const { parent, child } = setup();

    // call and then assert via recorded defineProperty calls

    await (parent.context as any).openView('child-uid', {
      mode: 'drawer',
      navigation: true,
      defineProperties: {
        foo: { get: () => 'bar' },
      },
    });

    // verify view.inputArgs.navigation is forced false (check the first set before it gets cleared)
    const viewCalls = child.context.defineProperty.mock.calls.filter((args: any[]) => args?.[0] === 'view');
    const firstView = viewCalls?.[0]?.[1]?.value;
    expect(firstView?.inputArgs?.navigation).toBe(false);
    // verify the params passed to dispatchEvent carry navigation=false
    expect(child.dispatchEvent).toHaveBeenCalledTimes(1);
    const dispatchedParams = child.dispatchEvent.mock.calls[0][1];
    expect(dispatchedParams.navigation).toBe(false);
  });

  it('forces options.navigation=false when options.defineMethods exists', async () => {
    const { parent, child } = setup();

    await (parent.context as any).openView('child-uid', {
      navigation: true,
      defineMethods: {
        test: vi.fn(),
      },
    });

    const viewCalls = child.context.defineProperty.mock.calls.filter((args: any[]) => args?.[0] === 'view');
    const firstView = viewCalls?.[0]?.[1]?.value;
    expect(firstView?.inputArgs?.navigation).toBe(false);
    expect(child.dispatchEvent).toHaveBeenCalledTimes(1);
    const dispatchedParams = child.dispatchEvent.mock.calls[0][1];
    expect(dispatchedParams.navigation).toBe(false);
  });

  it('dispatches the popupSettings bound event (object form) when opening external popup', async () => {
    const { parent, child } = setup();

    child.getFlow = vi.fn((key: string) => {
      if (key !== 'popupSettings') return undefined;
      return { on: { eventName: 'openDuplicatePopup' } };
    });

    await (parent.context as any).openView('child-uid', { mode: 'drawer' });

    expect(child.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(child.dispatchEvent.mock.calls[0][0]).toBe('openDuplicatePopup');
  });

  it('falls back to click when popupSettings has no explicit on event', async () => {
    const { parent, child } = setup();

    child.getFlow = vi.fn((key: string) => {
      if (key !== 'popupSettings') return undefined;
      return { on: undefined };
    });

    await (parent.context as any).openView('child-uid', { mode: 'drawer' });

    expect(child.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(child.dispatchEvent.mock.calls[0][0]).toBe('click');
  });
});
