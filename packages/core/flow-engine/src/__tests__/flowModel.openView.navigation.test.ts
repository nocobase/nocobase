/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { FlowContext, FlowRunJSContext } from '../flowContext';
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
      parent: undefined,
      parentId: undefined,
      context: {
        defineProperty: vi.fn(),
      },
      getStepParams: vi.fn(() => undefined),
      setStepParams: vi.fn(),
      setParent: vi.fn(),
      save: vi.fn(async () => undefined),
      saveStepParams: vi.fn(async () => undefined),
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

  it('inherits current model input args when opening an external popup', async () => {
    const { parent, child } = setup();
    parent['getInputArgs'] = vi.fn(() => ({
      filterByTk: 2,
      sourceId: 10,
      defaultInputKeys: ['filterByTk', 'sourceId'],
    }));

    await (parent.context as any).openView('child-uid', { mode: 'dialog' });

    expect(child.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(child.dispatchEvent.mock.calls[0][1]).toMatchObject({
      mode: 'dialog',
      filterByTk: 2,
      sourceId: 10,
    });
    expect(child.dispatchEvent.mock.calls[0][1]).not.toHaveProperty('defaultInputKeys');
  });

  it('does not debounce external popup dispatches', async () => {
    const { parent, child } = setup();

    await (parent.context as any).openView('child-uid', { mode: 'dialog', filterByTk: 1 });

    expect(child.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(child.dispatchEvent.mock.calls[0][2]).toBeUndefined();
  });

  it('syncs persisted openView config for an existing popup in the current model subtree', async () => {
    const { parent, child } = setup();
    child.parent = parent;
    child.parentId = parent.uid;
    let openViewConfig: Record<string, unknown> = {
      collectionName: 'users',
      dataSourceKey: 'main',
      mode: 'drawer',
      size: 'medium',
    };
    child.stepParams = { popupSettings: { otherStep: { keep: true }, openView: openViewConfig } };
    child.getStepParams = vi.fn((flowKey: string, stepKey: string) => {
      return flowKey === 'popupSettings' && stepKey === 'openView' ? openViewConfig : undefined;
    });
    child.setStepParams = vi.fn((_flowKey: string, stepParams: Record<string, Record<string, unknown>>) => {
      openViewConfig = stepParams.openView;
      child.stepParams = { popupSettings: stepParams };
    });

    await (parent.context as any).openView('child-uid', {
      mode: 'dialog',
      size: 'large',
      title: 'Runtime title',
      filterByTk: 1,
      sourceId: 'runtime-source',
    });

    expect(child.setStepParams).toHaveBeenCalledWith('popupSettings', {
      otherStep: { keep: true },
      openView: {
        collectionName: 'users',
        dataSourceKey: 'main',
        mode: 'dialog',
        size: 'large',
      },
    });
    expect(child.saveStepParams).toHaveBeenCalledTimes(1);
    expect(openViewConfig).not.toHaveProperty('title');
    expect(openViewConfig).not.toHaveProperty('filterByTk');
    expect(openViewConfig).not.toHaveProperty('sourceId');
  });

  it('does not save subtree popup config when persisted openView config already matches', async () => {
    const { parent, child } = setup();
    child.parent = parent;
    child.parentId = parent.uid;
    const openViewConfig = {
      mode: 'dialog',
      size: 'large',
    };
    child.stepParams = { popupSettings: { openView: openViewConfig } };
    child.getStepParams = vi.fn((flowKey: string, stepKey: string) => {
      return flowKey === 'popupSettings' && stepKey === 'openView' ? openViewConfig : undefined;
    });

    await (parent.context as any).openView('child-uid', {
      mode: 'dialog',
      size: 'large',
    });

    expect(child.setStepParams).not.toHaveBeenCalled();
    expect(child.saveStepParams).not.toHaveBeenCalled();
  });

  it('removes runtime-only keys from matching subtree popup config', async () => {
    const { parent, child } = setup();
    child.parent = parent;
    child.parentId = parent.uid;
    let openViewConfig: Record<string, unknown> = {
      mode: 'dialog',
      size: 'large',
      title: 'Configured popup title',
      pageModelClass: 'CustomChildPageModel',
      popupTemplateUid: 'tpl-popup',
      filterByTk: 1,
      sourceId: 'runtime-source',
      navigation: true,
      params: { foo: 'bar' },
    };
    child.stepParams = { popupSettings: { openView: openViewConfig } };
    child.getStepParams = vi.fn((flowKey: string, stepKey: string) => {
      return flowKey === 'popupSettings' && stepKey === 'openView' ? openViewConfig : undefined;
    });
    child.setStepParams = vi.fn((_flowKey: string, stepParams: Record<string, Record<string, unknown>>) => {
      openViewConfig = stepParams.openView;
      child.stepParams = { popupSettings: stepParams };
    });

    await (parent.context as any).openView('child-uid', {
      mode: 'dialog',
      size: 'large',
    });

    expect(child.setStepParams).toHaveBeenCalledWith('popupSettings', {
      openView: {
        mode: 'dialog',
        size: 'large',
        title: 'Configured popup title',
        pageModelClass: 'CustomChildPageModel',
        popupTemplateUid: 'tpl-popup',
      },
    });
    expect(child.saveStepParams).toHaveBeenCalledTimes(1);
    expect(openViewConfig).toMatchObject({
      title: 'Configured popup title',
      pageModelClass: 'CustomChildPageModel',
      popupTemplateUid: 'tpl-popup',
    });
    expect(openViewConfig).not.toHaveProperty('filterByTk');
    expect(openViewConfig).not.toHaveProperty('sourceId');
    expect(openViewConfig).not.toHaveProperty('navigation');
    expect(openViewConfig).not.toHaveProperty('params');
  });

  it('keeps explicit navigation for external popup opened outside RunJS', async () => {
    const { parent, child } = setup();

    await (parent.context as any).openView('child-uid', {
      mode: 'dialog',
      navigation: true,
    });

    expect(child.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(child.dispatchEvent.mock.calls[0][1]).toMatchObject({
      mode: 'dialog',
      navigation: true,
    });
  });

  it('forces navigation=false for external popup opened directly from RunJS ctx.openView', async () => {
    const { parent, child } = setup();
    const runCtx = new FlowRunJSContext(parent.context);

    await (runCtx as any).openView('child-uid', {
      mode: 'dialog',
      navigation: true,
    });

    expect(child.dispatchEvent).toHaveBeenCalledTimes(1);
    const dispatchedParams = child.dispatchEvent.mock.calls[0][1];
    expect(dispatchedParams).toMatchObject({
      mode: 'dialog',
      navigation: false,
    });
    expect(Reflect.ownKeys(dispatchedParams).filter((key) => typeof key === 'symbol')).toHaveLength(0);
    expect(child.setStepParams).not.toHaveBeenCalled();
    expect(child.saveStepParams).not.toHaveBeenCalled();
  });

  it('keeps RunJS external popup direct after a previous open mutates the runtime parent', async () => {
    const engine = new FlowEngine();
    const parent = engine.createModel({ use: 'FlowModel', uid: 'parent-uid' });
    const external = engine.createModel({
      use: 'FlowModel',
      uid: 'external-popup-uid',
      parentId: 'external-parent-uid',
      stepParams: {
        popupSettings: {
          openView: {
            mode: 'drawer',
          },
        },
      },
    });
    const saveStepParams = vi.spyOn(external, 'saveStepParams').mockResolvedValue(undefined);
    const dispatchEvent = vi.spyOn(external, 'dispatchEvent').mockResolvedValue([]);
    (engine as any).loadModel = vi.fn(async ({ uid }: { uid: string }) => (uid === external.uid ? external : null));

    await (parent.context as any).openView(external.uid, {
      mode: 'dialog',
      navigation: true,
    });
    expect(external.parentId).toBe(parent.uid);

    const runCtx = new FlowRunJSContext(parent.context);
    await (runCtx as any).openView(external.uid, {
      mode: 'dialog',
      navigation: true,
    });

    expect(dispatchEvent).toHaveBeenCalledTimes(2);
    expect(dispatchEvent.mock.calls[1][1]).toMatchObject({
      mode: 'dialog',
      navigation: false,
    });
    expect(saveStepParams).not.toHaveBeenCalled();
  });

  it('uses refreshed repository parentId when detecting whether a RunJS popup is in the current subtree', async () => {
    const engine = new FlowEngine();
    const parent = engine.createModel({ use: 'FlowModel', uid: 'parent-uid' });
    const external = engine.createModel({
      use: 'FlowModel',
      uid: 'moving-popup-uid',
      parentId: 'external-parent-uid',
      stepParams: {
        popupSettings: {
          openView: {
            mode: 'drawer',
          },
        },
      },
    });
    let persistedParentId = 'external-parent-uid';
    engine.setModelRepository({
      findOne: vi.fn(async ({ uid }: { uid: string }) => {
        if (uid !== external.uid) {
          return null;
        }
        return {
          uid: external.uid,
          use: 'FlowModel',
          parentId: persistedParentId,
          stepParams: external.stepParams,
        };
      }),
      save: vi.fn(async () => ({})),
      destroy: vi.fn(async () => true),
      move: vi.fn(async () => undefined),
      duplicate: vi.fn(async () => null),
    });
    const saveStepParams = vi.spyOn(external, 'saveStepParams').mockResolvedValue(undefined);
    const dispatchEvent = vi.spyOn(external, 'dispatchEvent').mockResolvedValue([]);
    (engine as any).loadModel = vi.fn(async ({ uid }: { uid: string }) => (uid === external.uid ? external : null));

    const runCtx = new FlowRunJSContext(parent.context);
    await (runCtx as any).openView(external.uid, {
      mode: 'dialog',
      navigation: true,
    });
    expect(dispatchEvent.mock.calls[0][1]).toMatchObject({
      mode: 'dialog',
      navigation: false,
    });

    persistedParentId = parent.uid;
    await (runCtx as any).openView(external.uid, {
      mode: 'dialog',
      navigation: true,
    });

    expect(dispatchEvent).toHaveBeenCalledTimes(2);
    expect(dispatchEvent.mock.calls[1][1]).toMatchObject({
      mode: 'dialog',
      navigation: true,
    });
    expect(saveStepParams).toHaveBeenCalledTimes(1);
    expect(external.getStepParams('popupSettings', 'openView')).toMatchObject({
      mode: 'dialog',
    });
  });

  it('reports a clear error when RunJS ctx.openView has no delegated openView', async () => {
    const runCtx = new FlowRunJSContext(new FlowContext());

    await expect((runCtx as any).openView('child-uid')).rejects.toThrow(
      'ctx.openView is not available in this RunJS context.',
    );
  });
});
