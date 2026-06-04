/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel } from '@nocobase/client-v2';
import { FlowEngine, FlowModel, type FlowModelExtraMenuItem } from '@nocobase/flow-engine';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerMenuExtensions } from '../menuExtensions';
import { ReferenceBlockModel } from '../models/ReferenceBlockModel';

const t = (key: string) => key;

const findItem = (items: FlowModelExtraMenuItem[], key: string) => items.find((item) => item.key === key);

describe('registerMenuExtensions', () => {
  let disposeMenuExtensions: (() => void) | undefined;

  beforeEach(() => {
    disposeMenuExtensions = registerMenuExtensions();
  });

  afterEach(() => {
    cleanup();
    disposeMenuExtensions?.();
    disposeMenuExtensions = undefined;
  });

  it('registers the block save-as-template menu once and opens the v2 dialog handler', async () => {
    const engine = new FlowEngine();
    const dialog = vi.fn(() => ({ close: vi.fn() }));
    const api = { resource: vi.fn(() => ({})) };
    const message = { error: vi.fn(), success: vi.fn() };
    const model = new BlockModel({ uid: 'block-1', use: 'BlockModel', flowEngine: engine, props: { title: 'Orders' } });
    model.context.defineProperty('api', { value: api });
    model.context.defineProperty('viewer', { value: { dialog } });
    model.context.defineProperty('message', { value: message });

    expect(registerMenuExtensions()).toBe(disposeMenuExtensions);

    const items = await BlockModel.getExtraMenuItems(model, t);
    const saveItems = items.filter((item) => item.key === 'block-reference:convert-to-template');
    expect(saveItems).toHaveLength(1);
    expect(saveItems[0].label).toBe('Save as template');

    await saveItems[0].onClick?.();

    expect(dialog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Save as template',
        destroyOnClose: true,
      }),
    );
  });

  it('hides normal block conversion for reference targets and exposes reference conversion', async () => {
    const engine = new FlowEngine();
    const reference = new ReferenceBlockModel({
      uid: 'reference-block',
      use: 'ReferenceBlockModel',
      flowEngine: engine,
    });
    reference.setStepParams('referenceSettings', 'useTemplate', { templateUid: 'tpl-1' });

    const target = new BlockModel({ uid: 'target-block', use: 'BlockModel', flowEngine: engine });
    target.setParent(reference);

    const targetItems = await BlockModel.getExtraMenuItems(target, t);
    expect(findItem(targetItems, 'block-reference:convert-to-template')).toBeUndefined();

    const referenceItems = await ReferenceBlockModel.getExtraMenuItems(reference, t);
    const convertItem = findItem(referenceItems, 'block-reference:convert-to-copy');
    expect(convertItem).toMatchObject({
      label: 'Convert reference to duplicate',
      group: 'common-actions',
      sort: -5,
    });
  });

  it('registers popup template menu items from popupSettings flow state', async () => {
    class PopupModel extends FlowModel {}

    PopupModel.registerFlow({
      key: 'popupSettings',
      title: 'Popup settings',
      steps: {
        openView: {
          title: 'Open view',
          use: 'openView',
        },
      },
    });

    const engine = new FlowEngine();
    const popup = new PopupModel({ uid: 'popup-1', use: 'PopupModel', flowEngine: engine });

    const saveItems = await PopupModel.getExtraMenuItems(popup, t);
    expect(findItem(saveItems, 'block-reference:save-popup-as-template')).toMatchObject({
      label: 'Save as template',
      sort: -8,
    });

    popup.setStepParams('popupSettings', 'openView', { popupTemplateUid: 'tpl-popup' });
    const referenceItems = await PopupModel.getExtraMenuItems(popup, t);
    expect(findItem(referenceItems, 'block-reference:save-popup-as-template')).toBeUndefined();
    expect(findItem(referenceItems, 'block-reference:convert-popup-template-to-copy')).toMatchObject({
      label: 'Convert reference to duplicate',
      sort: -8,
    });
  });

  it('does not persist popup template internal flags when converting popup template to copy mode', async () => {
    class PopupModel extends FlowModel {}

    PopupModel.registerFlow({
      key: 'popupSettings',
      title: 'Popup settings',
      steps: {
        openView: {
          title: 'Open view',
          use: 'openView',
        },
      },
    });

    const engine = new FlowEngine();
    vi.spyOn(engine, 'duplicateModel').mockResolvedValue({ uid: 'popup-copy' } as any);
    const popup = new PopupModel({ uid: 'popup-1', use: 'PopupModel', flowEngine: engine });
    const saveStepParams = vi.spyOn(popup, 'saveStepParams').mockResolvedValue(undefined as any);
    const message = { error: vi.fn(), success: vi.fn() };
    const api = {
      resource: vi.fn(() => ({
        get: vi.fn(async () => ({
          data: {
            data: {
              uid: 'tpl-popup',
              targetUid: 'popup-template-target',
              useModel: 'PopupModel',
              filterByTk: null,
              sourceId: null,
            },
          },
        })),
      })),
    };
    popup.context.defineProperty('api', { value: api });
    popup.context.defineProperty('message', { value: message });
    popup.context.defineProperty('t', { value: (key: string) => key });
    popup.setStepParams('popupSettings', 'openView', {
      popupTemplateUid: 'tpl-popup',
      uid: 'popup-template-target',
      dataSourceKey: 'main',
      collectionName: 'orders',
      filterByTk: '{{ ctx.record.id }}',
      sourceId: '{{ ctx.resource.sourceId }}',
      popupTemplateContext: true,
      popupTemplateHasFilterByTk: true,
      popupTemplateHasSourceId: true,
    });

    const originalWindow = globalThis.window;
    vi.stubGlobal('window', {
      ...(originalWindow || {}),
      confirm: vi.fn(() => true),
    });
    try {
      const items = await PopupModel.getExtraMenuItems(popup, t);
      await findItem(items, 'block-reference:convert-popup-template-to-copy')?.onClick?.();
    } finally {
      vi.stubGlobal('window', originalWindow);
    }

    const openViewParams = popup.getStepParams('popupSettings', 'openView');
    expect(openViewParams).toMatchObject({
      uid: 'popup-copy',
      dataSourceKey: 'main',
      collectionName: 'orders',
    });
    expect(openViewParams).not.toHaveProperty('popupTemplateUid');
    expect(openViewParams).not.toHaveProperty('filterByTk');
    expect(openViewParams).not.toHaveProperty('sourceId');
    expect(openViewParams).not.toHaveProperty('popupTemplateContext');
    expect(openViewParams).not.toHaveProperty('popupTemplateHasFilterByTk');
    expect(openViewParams).not.toHaveProperty('popupTemplateHasSourceId');
    expect(saveStepParams).toHaveBeenCalledTimes(1);
  });

  it('does not persist popup template internal flags when saving popup as template with convert mode', async () => {
    class PopupModel extends FlowModel {}

    PopupModel.registerFlow({
      key: 'popupSettings',
      title: 'Popup settings',
      steps: {
        openView: {
          title: 'Open view',
          use: 'openView',
        },
      },
    });

    const engine = new FlowEngine();
    vi.spyOn(engine, 'duplicateModel').mockResolvedValue({ uid: 'popup-template-target' } as any);
    const popup = new PopupModel({ uid: 'popup-2', use: 'PopupModel', flowEngine: engine });
    const saveStepParams = vi.spyOn(popup, 'saveStepParams').mockResolvedValue(undefined as any);
    const message = { error: vi.fn(), success: vi.fn() };
    const create = vi.fn(async () => ({
      data: {
        data: {
          uid: 'tpl-created',
        },
      },
    }));
    const api = {
      resource: vi.fn(() => ({
        create,
      })),
    };
    const dialog = vi.fn();
    popup.context.defineProperty('api', { value: api });
    popup.context.defineProperty('viewer', { value: { dialog } });
    popup.context.defineProperty('message', { value: message });
    popup.context.defineProperty('t', { value: (key: string) => key });
    popup.setStepParams('popupSettings', 'openView', {
      uid: 'old-popup',
      dataSourceKey: 'main',
      collectionName: 'orders',
      filterByTk: '{{ ctx.record.id }}',
      sourceId: '{{ ctx.resource.sourceId }}',
      popupTemplateContext: true,
      popupTemplateHasFilterByTk: true,
      popupTemplateHasSourceId: true,
    });

    const items = await PopupModel.getExtraMenuItems(popup, t);
    await findItem(items, 'block-reference:save-popup-as-template')?.onClick?.();

    const dialogOptions = dialog.mock.calls[0][0];
    const currentDialog = {
      close: vi.fn(),
      Footer: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
    };
    render(React.createElement(React.Fragment, null, dialogOptions.content(currentDialog)));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(saveStepParams).toHaveBeenCalledTimes(1));

    const openViewParams = popup.getStepParams('popupSettings', 'openView');
    expect(openViewParams).toMatchObject({
      popupTemplateUid: 'tpl-created',
      uid: 'popup-template-target',
      dataSourceKey: 'main',
      collectionName: 'orders',
    });
    expect(openViewParams).not.toHaveProperty('popupTemplateContext');
    expect(openViewParams).not.toHaveProperty('popupTemplateHasFilterByTk');
    expect(openViewParams).not.toHaveProperty('popupTemplateHasSourceId');
    dialogOptions.onClose?.();
  });
});
