/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FlowEngine } from '@nocobase/flow-engine';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DuplicateActionModel } from '../DuplicateActionModel';

const mocks = vi.hoisted(() => ({
  field: {
    dataSource: undefined as unknown,
    componentProps: {
      defaultCheckedKeys: [] as string[],
    },
    setInitialValue: vi.fn(),
    onCheck: vi.fn(),
  },
  form: {
    query: vi.fn(),
  },
}));

vi.mock('@formily/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@formily/react')>()),
  useForm: () => mocks.form,
}));

describe('DuplicateActionModel ui schema components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.field.dataSource = undefined;
    mocks.field.componentProps.defaultCheckedKeys = [];
    mocks.field.setInitialValue = vi.fn();
    mocks.field.onCheck = vi.fn();
    mocks.form.query = vi.fn(() => ({
      take: (callback: (field: typeof mocks.field) => void) => callback(mocks.field),
    }));
  });

  afterEach(() => {
    cleanup();
  });

  const createSchema = (overrides: Record<string, unknown> = {}) => {
    const { model: modelOverrides, ...ctxOverrides } = overrides as Record<string, any>;
    const model = new DuplicateActionModel({ uid: 'duplicate-action', flowEngine: new FlowEngine() } as never);
    const step = model.getFlow('duplicateModeSettings')?.getStep('duplicateMode')?.serialize() as any;

    return step.uiSchema({
      t: (key: string) => key,
      record: undefined,
      message: {
        success: vi.fn(),
      },
      model: {
        uid: 'duplicate-action',
        props: {
          duplicateFields: ['title'],
        },
        getStepParams: vi.fn(() => undefined),
        flowEngine: {
          flowSettings: {
            registerScopes: vi.fn(),
          },
        },
        ...modelOverrides,
      },
      blockModel: {
        collection: {
          name: 'posts',
          dataSourceKey: 'main',
        },
      },
      dataSourceManager: {
        getDataSource: vi.fn(() => ({
          collectionManager: {
            getAllCollectionsInheritChain: vi.fn(() => ['posts']),
            getCollection: vi.fn(() => ({ title: 'Posts' })),
          },
        })),
        getCollection: vi.fn(() => ({
          fields: new Map(),
        })),
      },
      engine: {
        loadModel: vi.fn(),
      },
      ...ctxOverrides,
    });
  };

  it('selects and clears all duplicate fields from setting shortcuts', () => {
    const schema = createSchema();
    mocks.field.dataSource = [
      {
        key: 'title',
        children: [{ key: 'author.name' }],
      },
    ];
    const SelectAll = schema.selectAll['x-component'];
    const UnselectAll = schema.unselectAll['x-component'];

    render(
      <>
        <SelectAll />
        <UnselectAll />
      </>,
    );

    fireEvent.click(screen.getByText('Select all'));
    expect(mocks.field.componentProps.defaultCheckedKeys).toEqual(['title', 'author.name']);
    expect(mocks.field.setInitialValue).toHaveBeenCalledWith(['title', 'author.name']);
    expect(mocks.field.onCheck).toHaveBeenCalledWith(['title', 'author.name']);

    fireEvent.click(screen.getByText('UnSelect all'));
    expect(mocks.field.componentProps.defaultCheckedKeys).toEqual([]);
    expect(mocks.field.setInitialValue).toHaveBeenLastCalledWith([]);
    expect(mocks.field.onCheck).toHaveBeenLastCalledWith([]);
  });

  it('syncs fields from popup and local form models', async () => {
    const popupGrid = {
      mapSubModels: vi.fn(),
    };
    const localGrid = {
      mapSubModels: vi.fn(),
    };
    const loadModel = vi
      .fn()
      .mockResolvedValueOnce({ subModels: { tabs: [{ uid: 'tab-uid' }] } })
      .mockResolvedValueOnce({ subModels: { items: [{ subModels: { grid: popupGrid } }] } })
      .mockResolvedValueOnce({ subModels: { items: [{ subModels: { grid: localGrid } }] } });
    const popupSchema = createSchema({
      engine: {
        loadModel,
      },
      model: {
        getStepParams: vi.fn(() => ({ uid: 'popup-uid' })),
      },
    });
    const SyncFromPopup = popupSchema.syncFromForm['x-component'];

    const { unmount } = render(<SyncFromPopup />);
    fireEvent.click(screen.getByText('Sync from form fields'));

    await waitFor(() => {
      expect(loadModel).toHaveBeenCalledWith({ parentId: 'popup-uid', refresh: true });
      expect(popupGrid.mapSubModels).toHaveBeenCalled();
    });

    unmount();

    const localSchema = createSchema({
      engine: {
        loadModel,
      },
      model: {
        getStepParams: vi.fn(() => undefined),
      },
    });
    const SyncFromLocal = localSchema.syncFromForm['x-component'];

    render(<SyncFromLocal />);
    fireEvent.click(screen.getByText('Sync from form fields'));

    await waitFor(() => {
      expect(loadModel).toHaveBeenCalledWith({ parentId: 'duplicate-action', refresh: true });
      expect(localGrid.mapSubModels).toHaveBeenCalled();
    });
  });
});
