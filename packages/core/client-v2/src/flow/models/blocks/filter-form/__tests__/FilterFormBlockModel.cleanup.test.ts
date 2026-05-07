/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import '@nocobase/client';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { waitFor } from '@testing-library/react';
import { TableBlockModel } from '../../table/TableBlockModel';
import { FilterFormBlockModel } from '../FilterFormBlockModel';
import { FilterFormGridModel } from '../FilterFormGridModel';
import { FilterFormItemModel } from '../FilterFormItemModel';

describe('FilterFormBlockModel cleanup', () => {
  function createFilterFormSetup() {
    const engine = new FlowEngine();
    engine.registerModels({
      FlowModel,
      TableBlockModel,
      FilterFormBlockModel,
      FilterFormGridModel,
      FilterFormItemModel,
    });

    const blockGridModel = engine.createModel<FlowModel>({
      uid: 'block-grid',
      use: 'FlowModel',
      subModels: {
        items: [],
      },
    } as any);

    const tableBlock = blockGridModel.addSubModel('items', {
      uid: 'target-table',
      use: 'TableBlockModel',
    }) as TableBlockModel;

    const filterForm = blockGridModel.addSubModel('items', {
      uid: 'filter-form',
      use: 'FilterFormBlockModel',
      subModels: {
        grid: {
          uid: 'filter-grid',
          use: 'FilterFormGridModel',
          subModels: {
            items: [],
          },
        },
      },
    }) as FilterFormBlockModel;

    const filterItem = filterForm.subModels.grid.addSubModel('items', {
      uid: 'filter-item',
      use: 'FilterFormItemModel',
      stepParams: {
        filterFormItemSettings: {
          init: {
            defaultTargetUid: tableBlock.uid,
          },
        },
      },
    }) as FilterFormItemModel;

    const removeFilterConfig = vi.fn(async () => {});
    const saveConnectFieldsConfig = vi.fn(async () => {});
    const getConnectFieldsConfig = vi.fn(() => ({
      targets: [
        {
          targetId: tableBlock.uid,
          filterPaths: ['name'],
        },
      ],
    }));

    filterForm.context.defineProperty('blockGridModel', { value: blockGridModel });
    filterForm.context.defineProperty('filterManager', {
      value: {
        removeFilterConfig,
        saveConnectFieldsConfig,
        getConnectFieldsConfig,
      },
    });
    filterForm.subModels.grid.context.defineProperty('filterManager', {
      value: {
        removeFilterConfig,
        saveConnectFieldsConfig,
        getConnectFieldsConfig,
      },
    });

    const destroySpy = vi.spyOn(filterItem, 'destroy').mockResolvedValue(true as any);
    vi.spyOn(filterForm as any, 'applyDefaultsAndInitialFilter').mockResolvedValue(undefined);

    (filterForm as any).onMount();

    return {
      engine,
      blockGridModel,
      tableBlock,
      filterForm,
      filterItem,
      removeFilterConfig,
      saveConnectFieldsConfig,
      getConnectFieldsConfig,
      destroySpy,
    };
  }

  it('does not remove filter items when target block is only removed during popup teardown', async () => {
    const { engine, blockGridModel, tableBlock, filterForm, removeFilterConfig, destroySpy } = createFilterFormSetup();

    await Promise.resolve(engine.removeModelWithSubModels(blockGridModel.uid));

    expect(removeFilterConfig).not.toHaveBeenCalled();
    expect(destroySpy).not.toHaveBeenCalled();

    (filterForm as any).onUnmount();
    expect(engine.getModel(tableBlock.uid)).toBeUndefined();
  });

  it('removes filter items when target block is actually destroyed', async () => {
    const { tableBlock, filterForm, removeFilterConfig, destroySpy } = createFilterFormSetup();

    await tableBlock.destroy();

    await waitFor(() => {
      expect(removeFilterConfig).toHaveBeenCalledWith({ filterId: 'filter-item' });
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    (filterForm as any).onUnmount();
  });
});
