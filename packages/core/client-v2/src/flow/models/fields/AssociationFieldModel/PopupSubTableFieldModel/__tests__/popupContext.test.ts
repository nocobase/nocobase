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

function createContext(record?: Record<string, unknown>, parentRecord: Record<string, unknown> = { id: 1 }) {
  const open = vi.fn();
  const sourceCollection = {
    getFilterByTK: vi.fn((sourceRecord: Record<string, unknown>) => sourceRecord.id),
  };
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
        value: parentRecord,
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
        resourceName: 'users.roles',
        collection: sourceCollection,
      },
      record,
      getFormValues: () => ({ id: 1 }),
      getPropertyOptions: () => undefined,
    },
  };
}

describe('PopupSubTable popup context', () => {
  it('passes popup and parent record context to the add-new popup', () => {
    const { context, open } = createContext();
    const handler = getOpenViewHandler(PopupSubTableFieldModel);

    handler(context, { mode: 'drawer', size: 'medium' });

    expect(open).toHaveBeenCalledOnce();
    expect(open.mock.calls[0][0].inputArgs).toMatchObject({
      openerUids: ['root-page-uid', 'parent-popup-uid'],
      associationName: 'users.roles',
      sourceId: 1,
    });
  });

  it('passes popup and parent record context to the edit popup', () => {
    const { context, open } = createContext({ id: 2, name: 'Member' });
    const handler = getOpenViewHandler(PopupSubTableEditActionModel);

    handler(context, { mode: 'dialog', size: 'medium' });

    expect(open).toHaveBeenCalledOnce();
    expect(open.mock.calls[0][0].inputArgs).toMatchObject({
      openerUids: ['root-page-uid', 'parent-popup-uid'],
      associationName: 'users.roles',
      sourceId: 1,
    });
  });

  it('does not expose a parent record reference before the parent record is persisted', () => {
    const { context, open } = createContext(undefined, { nickname: 'Draft user' });
    const handler = getOpenViewHandler(PopupSubTableFieldModel);

    handler(context, { mode: 'drawer', size: 'medium' });

    expect(open).toHaveBeenCalledOnce();
    expect(open.mock.calls[0][0].inputArgs).not.toHaveProperty('associationName');
    expect(open.mock.calls[0][0].inputArgs).not.toHaveProperty('sourceId');
  });
});
