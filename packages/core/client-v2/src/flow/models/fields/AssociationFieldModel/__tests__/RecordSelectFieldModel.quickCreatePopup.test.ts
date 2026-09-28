/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import '../../../index';
import { RecordSelectFieldModel } from '../RecordSelectFieldModel';

type OpenViewHandler = (ctx: unknown, params: Record<string, unknown>) => void;

function getOpenViewHandler(): OpenViewHandler {
  const flow = RecordSelectFieldModel.globalFlowRegistry.getFlow('popupSettings');
  const handler = flow?.getStep('openView')?.serialize().handler;

  if (!handler) {
    throw new Error('popupSettings.openView handler is not registered');
  }

  return handler as OpenViewHandler;
}

function createContext(record: Record<string, unknown>) {
  const open = vi.fn();
  const sourceCollection = {
    getFilterByTK: vi.fn((sourceRecord: Record<string, unknown>) => sourceRecord.id),
  };
  const model = {
    uid: 'record-select-uid',
    props: {
      quickCreate: 'modalAdd',
      allowMultiple: true,
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
      inputArgs: { onChange: vi.fn() },
      view: {
        inputArgs: {
          viewUid: 'approval-popup-uid',
        },
      },
      viewer: { open },
      layoutContentElement: {},
      model,
      collection: {
        dataSourceKey: 'main',
        filterTargetKey: 'id',
      },
      collectionField: {
        type: 'hasMany',
        target: 'orgs',
        resourceName: 'users.orgs',
        collection: sourceCollection,
      },
      record,
    },
  };
}

describe('RecordSelectFieldModel quick create popup', () => {
  it('passes the parent record reference when the parent record has a primary key', () => {
    const { context, open } = createContext({ id: 1, nickname: 'Saved user' });

    getOpenViewHandler()(context, { mode: 'drawer', size: 'medium' });

    expect(open).toHaveBeenCalledOnce();
    const { inputArgs } = open.mock.calls[0][0];
    expect(inputArgs).toMatchObject({
      scene: 'create',
      collectionName: 'orgs',
      associationName: 'users.orgs',
      sourceId: 1,
    });
    expect(inputArgs).not.toHaveProperty('sourceAssociationName');
  });

  it('only passes sourceAssociationName when the parent record has no primary key yet', () => {
    const { context, open } = createContext({});

    getOpenViewHandler()(context, { mode: 'drawer', size: 'medium' });

    expect(open).toHaveBeenCalledOnce();
    const { inputArgs } = open.mock.calls[0][0];
    expect(inputArgs).toMatchObject({
      scene: 'create',
      collectionName: 'orgs',
      sourceAssociationName: 'users.orgs',
    });
    expect(inputArgs).not.toHaveProperty('associationName');
    expect(inputArgs).not.toHaveProperty('sourceId');
  });
});
