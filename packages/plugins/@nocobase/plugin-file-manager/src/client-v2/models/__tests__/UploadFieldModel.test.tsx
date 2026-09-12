/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ReactElement } from 'react';
import { FlowEngine } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { UploadFieldModel } from '../UploadFieldModel';

type FileRecord = {
  id: number;
  filename: string;
};

type PickerValue = FileRecord | FileRecord[] | undefined;

type PickerViewOptions = {
  inputArgs: {
    rowSelectionProps: {
      type: 'radio' | 'checkbox';
      onChange: (selectedRowKeys: unknown, selectedRows: FileRecord[]) => void;
    };
  };
  content: () => ReactElement<{ toOne?: boolean }>;
};

type OpenViewContext = {
  inputArgs: {
    mode?: string;
    size?: string;
  };
  collectionField: {
    type: string;
    target: string;
  };
  collection: {
    dataSourceKey: string;
    filterTargetKey: keyof FileRecord;
  };
  model: {
    uid: string;
    props: {
      sourceFieldModelUid?: string;
      value: FileRecord[];
    };
    parent?: {
      use?: string;
    };
    selectedRows: {
      value: PickerValue;
    };
    change: () => void;
    _closeView?: () => void;
    flowEngine: {
      context: {
        themeToken: {
          colorBgLayout: string;
        };
      };
    };
  };
  viewer: {
    open: (options: PickerViewOptions) => void;
  };
  isMobileLayout: boolean;
  layoutContentElement: null;
};

type OpenViewHandler = (ctx: OpenViewContext, params: { mode: string; size: string }) => void;

function getOpenViewHandler(): OpenViewHandler {
  const flow = UploadFieldModel.globalFlowRegistry.getFlow('selectExitRecordSettings');
  const handler = flow?.getStep('openView')?.serialize().handler;

  if (!handler) {
    throw new Error('selectExitRecordSettings.openView handler is not registered');
  }

  return handler as unknown as OpenViewHandler;
}

function createContext(fieldType: string, value: FileRecord[] = []) {
  const open = vi.fn<(options: PickerViewOptions) => void>();
  const closeView = vi.fn();
  const change = vi.fn();
  const selectedRows = { value: undefined as PickerValue };

  const context: OpenViewContext = {
    inputArgs: {},
    collectionField: {
      type: fieldType,
      target: 'attachments',
    },
    collection: {
      dataSourceKey: 'main',
      filterTargetKey: 'id',
    },
    model: {
      uid: 'upload-field',
      props: {
        value,
      },
      selectedRows,
      change,
      _closeView: closeView,
      flowEngine: {
        context: {
          themeToken: {
            colorBgLayout: '#fff',
          },
        },
      },
    },
    viewer: {
      open,
    },
    isMobileLayout: false,
    layoutContentElement: null,
  };

  return { change, closeView, context, open, selectedRows };
}

function getOpenedView(open: ReturnType<typeof vi.fn<(options: PickerViewOptions) => void>>) {
  const view = open.mock.calls[0]?.[0];

  if (!view) {
    throw new Error('Record picker view was not opened');
  }

  return view;
}

describe('UploadFieldModel existing-record picker', () => {
  it('dispatches the picker event from the current field fork', () => {
    const onChange = vi.fn();
    const model = new UploadFieldModel({
      uid: 'upload-field-dispatch',
      use: 'UploadFieldModel',
      flowEngine: new FlowEngine(),
      props: {},
    });
    model.onInit({});
    const fork = model.createFork({ onChange }, 'subtable-row');
    const dispatchEvent = vi.fn<typeof fork.dispatchEvent>().mockResolvedValue([]);
    fork.dispatchEvent = dispatchEvent;
    vi.spyOn(model, 'dispatchEvent').mockResolvedValue([]);
    const event = { type: 'click' };
    const field = (
      fork as unknown as {
        renderOriginal: () => ReactElement<{
          onSelectExitRecordClick: (event: { type: string }) => void;
        }>;
      }
    ).renderOriginal();

    field.props.onSelectExitRecordClick(event);

    expect(dispatchEvent).toHaveBeenCalledWith('openView', {
      event,
    });
  });

  it('preserves a custom existing-record picker handler on a fork', () => {
    const customHandler = vi.fn();
    const model = new UploadFieldModel({
      uid: 'upload-field-custom-handler',
      use: 'UploadFieldModel',
      flowEngine: new FlowEngine(),
      props: {},
    });
    model.onInit({});
    model.onSelectExitRecordClick = customHandler;
    const fork = model.createFork({ onChange: vi.fn() }, 'subtable-row');
    const dispatchEvent = vi.fn<typeof fork.dispatchEvent>().mockResolvedValue([]);
    fork.dispatchEvent = dispatchEvent;
    const event = { type: 'click' };
    const field = (
      fork as unknown as {
        renderOriginal: () => ReactElement<{
          onSelectExitRecordClick: (event: { type: string }) => void;
        }>;
      }
    ).renderOriginal();

    field.props.onSelectExitRecordClick(event);

    expect(customHandler).toHaveBeenCalledWith(event);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('configures a to-one picker without a separate submit action', () => {
    const { context, open } = createContext('belongsTo');

    getOpenViewHandler()(context, { mode: 'drawer', size: 'medium' });

    const view = getOpenedView(open);
    expect(view.inputArgs.rowSelectionProps.type).toBe('radio');
    expect(view.content().props.toOne).toBe(true);
  });

  it('commits through the current model and closes a to-one picker', () => {
    const { change, closeView, context, open, selectedRows } = createContext('belongsTo');
    const selectedRecord = { id: 1, filename: 'report.pdf' };

    getOpenViewHandler()(context, { mode: 'drawer', size: 'medium' });
    getOpenedView(open).inputArgs.rowSelectionProps.onChange(undefined, [selectedRecord]);

    expect(selectedRows.value).toBe(selectedRecord);
    expect(change).toHaveBeenCalledOnce();
    expect(closeView).toHaveBeenCalledOnce();
  });

  it('keeps a to-many picker pending until its submit action is used', () => {
    const existingRecord = { id: 1, filename: 'existing.pdf' };
    const addedRecord = { id: 2, filename: 'added.pdf' };
    const { change, closeView, context, open, selectedRows } = createContext('belongsToMany', [existingRecord]);

    getOpenViewHandler()(context, { mode: 'drawer', size: 'medium' });

    const view = getOpenedView(open);
    expect(view.inputArgs.rowSelectionProps.type).toBe('checkbox');
    expect(view.content().props.toOne ?? false).toBe(false);

    view.inputArgs.rowSelectionProps.onChange(undefined, [existingRecord, addedRecord]);

    expect(selectedRows.value).toEqual([existingRecord, addedRecord]);
    expect(closeView).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
  });
});
