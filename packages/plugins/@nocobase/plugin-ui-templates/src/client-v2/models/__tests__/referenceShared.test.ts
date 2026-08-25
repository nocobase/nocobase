/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowContext, FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it } from 'vitest';
import { ensureBlockScopedEngine, ensureScopedEngineView } from '../referenceShared';

describe('referenceShared', () => {
  it('keeps the bridged view lookup local after the host view delegate is removed', () => {
    const parentEngine = new FlowEngine();
    const hostModel = parentEngine.createModel({ use: 'FlowModel', uid: 'host-model' });
    const hostViewContext = new FlowContext();
    const hostView = { uid: 'host-view' };
    hostViewContext.defineProperty('view', { value: hostView });
    hostModel.context.addDelegate(hostViewContext);

    const scopedEngine = ensureBlockScopedEngine(parentEngine);
    ensureScopedEngineView(scopedEngine, hostModel.context);

    expect(scopedEngine.context).not.toBe(parentEngine.context);
    expect(scopedEngine.context.engine).toBe(scopedEngine);
    expect(scopedEngine.context.view).toBe(hostView);
    expect(parentEngine.context.getPropertyOptions('view')).toBeUndefined();

    const nextHostView = { uid: 'next-host-view' };
    hostViewContext.defineProperty('view', { value: nextHostView });
    expect(scopedEngine.context.view).toBe(nextHostView);

    hostModel.context.removeDelegate(hostViewContext);

    expect(() => scopedEngine.context.view).not.toThrow();
    expect(scopedEngine.context.view).toBeUndefined();
    expect(parentEngine.context.getPropertyOptions('view')).toBeUndefined();
  });
});
