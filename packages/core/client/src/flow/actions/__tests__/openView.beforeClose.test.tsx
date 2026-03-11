/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowPage } from '../../FlowPage';
import { openView } from '../openView';

const createCtx = (inputArgs: any = {}) => {
  const engine = {
    getModel: vi.fn(),
    context: { themeToken: { colorBgLayout: '#fff' } },
  } as any;

  const ctx: any = {
    inputArgs,
    engine,
    model: {
      uid: 'popup-action-uid',
      context: { inputArgs: {} },
      flowEngine: { context: { themeToken: { colorBgLayout: '#fff' } } },
    },
    layoutContentElement: {},
    view: {},
    viewer: {
      open: vi.fn(async (_opts: any) => undefined),
    },
  };

  return { ctx, engine };
};

const createPageModel = (overrides: any = {}) => {
  const modalConfirm = vi.fn();
  const dispatchEvent = vi.fn().mockResolvedValue(undefined);
  const pageModel: any = {
    uid: 'page-model-uid',
    subModels: {},
    context: {
      defineProperty: vi.fn(),
      defineMethod: vi.fn(),
      modal: { confirm: modalConfirm },
      t: vi.fn((value: string) => value),
    },
    dispatchEvent,
    invalidateFlowCache: vi.fn(),
    _rerunLastAutoRun: vi.fn(),
    ...overrides,
  };

  pageModel.context = {
    defineProperty: vi.fn(),
    defineMethod: vi.fn(),
    modal: { confirm: modalConfirm },
    t: vi.fn((value: string) => value),
    ...(overrides.context || {}),
  };

  if (overrides.dispatchEvent) {
    pageModel.dispatchEvent = overrides.dispatchEvent;
  }

  return pageModel;
};

const openAndLoad = async (pageModel: any, inputArgs: any = {}) => {
  const { ctx } = createCtx(inputArgs);

  let capturedContent: any;
  (ctx.viewer.open as any).mockImplementation(async (opts: any) => {
    capturedContent = opts.content;
    return undefined;
  });

  await openView.handler(ctx, {});

  const currentView: any = {
    destroy: vi.fn(),
    update: vi.fn(),
  };
  const element = capturedContent(currentView);

  expect(element.type).toBe(FlowPage);
  element.props.onModelLoaded(pageModel.uid, pageModel);

  return { currentView, pageModel };
};

describe('openView action - beforeClose behavior', () => {
  it('dispatches beforeClose with clean dirty state when no form was modified', async () => {
    const pageModel = createPageModel();
    const { currentView } = await openAndLoad(pageModel);

    const allowed = await currentView.beforeClose({ result: 'done', force: false });

    expect(allowed).toBe(true);
    expect(pageModel.context.modal.confirm).not.toHaveBeenCalled();
    expect(pageModel.dispatchEvent).toHaveBeenCalledWith(
      'beforeClose',
      expect.objectContaining({
        result: 'done',
        force: false,
        dirty: {
          hasDirtyForms: false,
          formModelUids: [],
        },
        controller: expect.any(Object),
      }),
    );
  });

  it('passes dirty form info into beforeClose event payload', async () => {
    const pageModel = createPageModel({
      subModels: {
        items: [
          {
            uid: 'dirty-form-uid',
            subModels: {},
            getUserModifiedFields: () => new Set(['title']),
          },
        ],
      },
    });
    const { currentView } = await openAndLoad(pageModel);

    const allowed = await currentView.beforeClose({ force: false });

    expect(allowed).toBe(true);
    expect(pageModel.dispatchEvent).toHaveBeenCalledWith(
      'beforeClose',
      expect.objectContaining({
        dirty: {
          hasDirtyForms: true,
          formModelUids: ['dirty-form-uid'],
        },
      }),
    );
  });

  it('allows dynamic beforeClose flows to prevent closing after confirmation', async () => {
    const dispatchEvent = vi.fn().mockImplementation(async (_eventName: string, inputArgs: any) => {
      inputArgs.controller.prevent();
    });
    const pageModel = createPageModel({
      subModels: {
        items: [
          {
            uid: 'dirty-form-uid',
            subModels: {},
            getUserModifiedFields: () => new Set(['title']),
          },
        ],
      },
      dispatchEvent,
    });
    pageModel.context.modal.confirm.mockResolvedValue(true);
    const { currentView } = await openAndLoad(pageModel);

    const allowed = await currentView.beforeClose({ force: false });

    expect(allowed).toBe(false);
    expect(dispatchEvent).toHaveBeenCalledWith(
      'beforeClose',
      expect.objectContaining({
        dirty: {
          hasDirtyForms: true,
          formModelUids: ['dirty-form-uid'],
        },
        controller: expect.any(Object),
      }),
    );
  });
});
