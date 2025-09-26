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
      save: vi.fn(async () => undefined),
      dispatchEvent: vi.fn(async (_event: string, _params?: any) => undefined),
    };

    // inject loadModel so ctx.openView finds existing model and skips createModel('PopupActionModel')
    (engine as any).loadModel = vi.fn(async ({ uid }: { uid: string }) => (uid ? child : null));

    return { engine, parent, child };
  }

  it('forces options.navigation=false when options.defineProperties exists', async () => {
    const { parent, child } = setup();

    // capture the inputArgs assigned to child.context
    let capturedInputArgs: any;
    child.context.defineProperty.mockImplementation((key: string, opts: any) => {
      if (key === 'inputArgs') capturedInputArgs = opts?.value;
    });

    await (parent.context as any).openView('child-uid', {
      mode: 'drawer',
      navigation: true,
      defineProperties: {
        foo: { get: () => 'bar' },
      },
    });

    // verify inputArgs.navigation is forced false
    expect(capturedInputArgs?.navigation).toBe(false);
    // verify the params passed to dispatchEvent carry navigation=false
    expect(child.dispatchEvent).toHaveBeenCalledTimes(1);
    const dispatchedParams = child.dispatchEvent.mock.calls[0][1];
    expect(dispatchedParams.navigation).toBe(false);
  });

  it('forces options.navigation=false when options.defineMethod exists', async () => {
    const { parent, child } = setup();

    let capturedInputArgs: any;
    child.context.defineProperty.mockImplementation((key: string, opts: any) => {
      if (key === 'inputArgs') capturedInputArgs = opts?.value;
    });

    await (parent.context as any).openView('child-uid', {
      navigation: true,
      defineMethod: {
        test: vi.fn(),
      },
    });

    expect(capturedInputArgs?.navigation).toBe(false);
    expect(child.dispatchEvent).toHaveBeenCalledTimes(1);
    const dispatchedParams = child.dispatchEvent.mock.calls[0][1];
    expect(dispatchedParams.navigation).toBe(false);
  });
});
