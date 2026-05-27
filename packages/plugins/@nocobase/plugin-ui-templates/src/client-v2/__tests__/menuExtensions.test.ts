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
        width: 600,
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
});
