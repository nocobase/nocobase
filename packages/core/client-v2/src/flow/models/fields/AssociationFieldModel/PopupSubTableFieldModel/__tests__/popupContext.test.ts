/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { PopupSubTableFieldModel } from '../PopupSubTableFieldModel';
import { PopupSubTableEditActionModel } from '../actions/PopupSubTableEditActionModel';

function getOpenViewHandler(modelClass: typeof PopupSubTableFieldModel | typeof PopupSubTableEditActionModel) {
  const flow = modelClass.globalFlowRegistry.getFlow('popupSettings');
  const step = flow?.getStep('openView');
  const handler = step?.serialize().handler;

  if (!handler) {
    throw new Error('popupSettings.openView handler is not registered');
  }

  return handler;
}

function createContext(record?: Record<string, unknown>) {
  const open = vi.fn();
  const model = {
    uid: 'popup-subtable-uid',
    props: {
      value: record ? [record] : [],
    },
    context: {
      inputArgs: {},
    },
    flowEngine: {
      context: {
        themeToken: {
          colorBgLayout: '#fff',
        },
      },
    },
  };

  return {
    open,
    context: {
      inputArgs: {},
      item: {
        value: { id: 1 },
      },
      view: {
        inputArgs: {
          viewUid: 'parent-popup-uid',
          openerUids: ['root-page-uid'],
        },
      },
      viewer: { open },
      layoutContentElement: {},
      model,
      associationModel: model,
      collection: {
        dataSourceKey: 'main',
        filterTargetKey: 'id',
      },
      collectionField: {
        target: 'roles',
      },
      record,
      getFormValues: () => ({ id: 1 }),
      getPropertyOptions: () => undefined,
    },
  };
}

describe('PopupSubTable popup context', () => {
  it('passes openerUids to the add-new popup', () => {
    const { context, open } = createContext();
    const handler = getOpenViewHandler(PopupSubTableFieldModel);

    handler(context, { mode: 'drawer', size: 'medium' });

    expect(open).toHaveBeenCalledOnce();
    expect(open.mock.calls[0][0].inputArgs.openerUids).toEqual(['root-page-uid', 'parent-popup-uid']);
  });

  it('passes openerUids to the edit popup', () => {
    const { context, open } = createContext({ id: 2, name: 'Member' });
    const handler = getOpenViewHandler(PopupSubTableEditActionModel);

    handler(context, { mode: 'dialog', size: 'medium' });

    expect(open).toHaveBeenCalledOnce();
    expect(open.mock.calls[0][0].inputArgs.openerUids).toEqual(['root-page-uid', 'parent-popup-uid']);
  });
});
