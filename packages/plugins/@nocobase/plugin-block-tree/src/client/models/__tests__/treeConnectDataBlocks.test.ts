/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { pruneDisconnectedTreeTargets, syncTreeConnectConfig, treeConnectDataBlocks } from '../treeConnectDataBlocks';

describe('treeConnectDataBlocks', () => {
  const createModel = (options?: { filterConfig?: any; targets?: any[]; saveConnectFieldsConfig?: any }) => {
    const saveConnectFieldsConfig = options?.saveConnectFieldsConfig || vi.fn(async () => {});
    const getConnectFieldsConfig = vi.fn(() => options?.filterConfig);
    const targets = options?.targets || [];

    return {
      uid: 'tree-filter-1',
      title: 'Tree filter',
      context: {
        t: (value: string) => value,
        filterManager: {
          getConnectFieldsConfig,
          saveConnectFieldsConfig,
        },
        blockGridModel: {
          filterSubModels: vi.fn(() => targets),
        },
      },
      flowEngine: {
        getModel: vi.fn((uid: string) => targets.find((target) => target.uid === uid)),
      },
    } as any;
  };

  it('prunes deleted targets from config', () => {
    const target = {
      uid: 'table-2',
      title: 'Table 2',
      resource: {
        supportsFilter: true,
      },
    };
    const model = createModel({
      targets: [target],
    });

    expect(
      pruneDisconnectedTreeTargets(model, {
        targets: [
          { targetId: 'deleted-table', filterPaths: ['name'] },
          { targetId: 'table-2', filterPaths: ['title'] },
        ],
      }),
    ).toEqual({
      changed: true,
      config: {
        targets: [{ targetId: 'table-2', filterPaths: ['title'] }],
      },
    });
  });

  it('syncs persisted config after target blocks are removed', async () => {
    const saveConnectFieldsConfig = vi.fn(async () => {});
    const model = createModel({
      filterConfig: {
        targets: [
          { targetId: 'deleted-table', filterPaths: ['name'] },
          { targetId: 'table-2', filterPaths: ['title'] },
        ],
      },
      targets: [
        {
          uid: 'table-2',
          title: 'Table 2',
          resource: {
            supportsFilter: true,
          },
        },
      ],
      saveConnectFieldsConfig,
    });

    const nextConfig = await syncTreeConnectConfig(model);

    expect(nextConfig).toEqual({
      targets: [{ targetId: 'table-2', filterPaths: ['title'] }],
    });
    expect(saveConnectFieldsConfig).toHaveBeenCalledWith('tree-filter-1', {
      targets: [{ targetId: 'table-2', filterPaths: ['title'] }],
    });
  });

  it('shows Unconnected in summary when all connected targets were deleted', () => {
    const model = createModel({
      filterConfig: {
        targets: [{ targetId: 'deleted-table', filterPaths: ['name'] }],
      },
      targets: [],
    });

    const uiMode = treeConnectDataBlocks.uiMode({
      model,
    } as any);

    expect(uiMode.props.options).toEqual([
      {
        label: 'Unconnected',
        value: 'Unconnected',
      },
    ]);
  });

  it('does not persist summary as part of connect fields step params', () => {
    const model = createModel();
    model.stepParams = {
      treeSettings: {
        connectFields: {
          summary: 'Old table #1234',
          _summary: 'Old table #1234',
        },
      },
    };
    const params = {
      summary: 'New table #5678',
      _summary: 'New table #5678',
    };

    treeConnectDataBlocks.beforeParamsSave?.(
      {
        model,
      } as any,
      params,
    );

    expect(params.summary).toBeUndefined();
    expect(params._summary).toBeUndefined();
    expect(model.stepParams.treeSettings.connectFields.summary).toBeUndefined();
    expect(model.stepParams.treeSettings.connectFields._summary).toBeUndefined();
  });
});
