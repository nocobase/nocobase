/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowContext,
  FlowEngine,
  FlowEngineProvider,
  FlowViewContextProvider,
  type FlowModel,
} from '@nocobase/flow-engine';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../index';
import { BlockGridModel } from '../../../base/BlockGridModel';
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
      flowSettingsEnabled: false,
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
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe.each(['drawer', 'dialog'])('%s configuration mode', (mode) => {
    it.each([
      { scenario: 'configuration', modelEnabled: true, globalEnabled: false },
      { scenario: 'global configuration', modelEnabled: true, globalEnabled: true },
      { scenario: 'runtime', modelEnabled: false, globalEnabled: false },
      { scenario: 'read-only configuration', modelEnabled: false, globalEnabled: true },
    ])('uses the field configuration state in $scenario', async ({ modelEnabled, globalEnabled }) => {
      const engine = new FlowEngine();
      engine.registerModels({ BlockGridModel });
      engine.flowSettings.enabled = globalEnabled;
      engine.context.defineProperty('themeToken', {
        value: { marginBlock: 16, marginSM: 8, paddingLG: 24 },
      });
      engine.context.defineProperty('t', { value: (key: string) => key });
      const save = vi.fn(async (model: FlowModel) => model.serialize());
      engine.setModelRepository({
        findOne: vi.fn(async () => null),
        save,
        destroy: vi.fn(async () => true),
        move: vi.fn(async () => undefined),
        duplicate: vi.fn(async () => null),
      });
      const load = vi.spyOn(engine, 'loadOrCreateModel');
      const { context, open } = createContext({});
      context.model.context.flowSettingsEnabled = modelEnabled;
      getOpenViewHandler()(context, { mode, size: 'medium' });
      const config = open.mock.calls[0][0];
      expect(config.inheritContext).toBe(false);

      // Detached popups inherit the engine context, not the approval form's model context.
      const popupContext = new FlowContext();
      popupContext.addDelegate(engine.context);
      popupContext.defineProperty('engine', { value: engine });
      popupContext.defineProperty('view', {
        value: { type: mode, inputArgs: config.inputArgs, Header: () => null, close: vi.fn() },
      });
      const { container } = render(
        <FlowEngineProvider engine={engine}>
          <FlowViewContextProvider context={popupContext}>{config.content()}</FlowViewContextProvider>
        </FlowEngineProvider>,
      );

      await waitFor(() => expect(container.querySelector('.nb-block-grid')).toBeInTheDocument());
      if (modelEnabled) {
        expect(screen.getByRole('button', { name: /Add block/ })).toBeInTheDocument();
        expect(save).toHaveBeenCalledOnce();
      } else {
        expect(screen.queryByRole('button', { name: /Add block/ })).not.toBeInTheDocument();
        expect(save).not.toHaveBeenCalled();
      }
      expect(load).toHaveBeenCalledWith(
        expect.objectContaining({ use: 'BlockGridModel', parentId: context.model.uid }),
        { delegateToParent: false, delegate: popupContext, skipSave: !modelEnabled },
      );
      expect(engine.context.flowSettingsEnabled).toBe(globalEnabled);
    });
  });

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
