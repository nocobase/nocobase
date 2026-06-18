/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  createContextDatasource,
  deleteContextDatasource,
  listContextDatasources,
  normalizeDatasourceValues,
  previewContextDatasource,
  toDatasourceFormValues,
  updateContextDatasource,
  updateContextDatasourceEnabled,
} from '../pages/DatasourceSettingsPage';

describe('DatasourceSettingsPage request helpers', () => {
  it('normalizes datasource form values', () => {
    expect(
      normalizeDatasourceValues({
        title: 'Orders',
        description: 'Order context',
        collection: ['main', 'orders'],
        fields: ['id', 'status'],
        filterText: '{"logic":"$and","items":[]}',
        sortText: '["-createdAt"]',
        limit: 100,
        enabled: true,
      }),
    ).toEqual({
      title: 'Orders',
      description: 'Order context',
      datasource: 'main',
      collectionName: 'orders',
      fields: ['id', 'status'],
      filter: { logic: '$and', items: [] },
      sort: ['-createdAt'],
      limit: 100,
      enabled: true,
    });
  });

  it('maps records to form values', () => {
    expect(
      toDatasourceFormValues({
        id: 1,
        title: 'Orders',
        datasource: 'main',
        collectionName: 'orders',
        fields: ['id'],
        filter: { logic: '$and', items: [] },
        sort: ['-createdAt'],
        limit: 100,
        enabled: true,
      }),
    ).toMatchObject({
      collection: ['main', 'orders'],
      filterText: JSON.stringify({ logic: '$and', items: [] }, null, 2),
      sortText: JSON.stringify(['-createdAt'], null, 2),
    });
  });

  it('lists datasource settings', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [
          { id: 1, title: 'Orders', datasource: 'main', collectionName: 'orders', limit: 100, enabled: true },
          { title: 'invalid' },
        ],
        count: 1,
      },
    });
    const apiClient = {
      resource: () => ({ list }),
    };

    await expect(listContextDatasources(apiClient)).resolves.toEqual({
      data: [{ id: 1, title: 'Orders', datasource: 'main', collectionName: 'orders', limit: 100, enabled: true }],
      total: 1,
    });
  });

  it('creates and updates datasource settings with id filter', async () => {
    const create = vi.fn().mockResolvedValue({});
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ create, update }),
    };
    const values = {
      title: 'Orders',
      collection: ['main', 'orders'],
      fields: ['id'],
      limit: 100,
      enabled: true,
    };

    await createContextDatasource(apiClient, values);
    await updateContextDatasource(apiClient, 1, values);

    expect(create).toHaveBeenCalledWith({
      values: {
        title: 'Orders',
        description: '',
        datasource: 'main',
        collectionName: 'orders',
        fields: ['id'],
        filter: undefined,
        sort: undefined,
        limit: 100,
        enabled: true,
      },
    });
    expect(update).toHaveBeenCalledWith({
      filterByTk: 1,
      values: {
        title: 'Orders',
        description: '',
        datasource: 'main',
        collectionName: 'orders',
        fields: ['id'],
        filter: undefined,
        sort: undefined,
        limit: 100,
        enabled: true,
      },
    });
  });

  it('deletes and toggles datasource settings by id', async () => {
    const destroy = vi.fn().mockResolvedValue({});
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ destroy, update }),
    };

    await deleteContextDatasource(apiClient, 1);
    await updateContextDatasourceEnabled(apiClient, 1, false);

    expect(destroy).toHaveBeenCalledWith({ filterByTk: 1 });
    expect(update).toHaveBeenCalledWith({
      filterByTk: 1,
      values: { enabled: false },
    });
  });

  it('previews datasource settings with normalized values', async () => {
    const preview = vi.fn().mockResolvedValue({
      data: {
        data: {
          records: [[{ name: 'id', value: 1 }]],
        },
      },
    });
    const apiClient = {
      resource: () => ({ preview }),
    };

    await expect(
      previewContextDatasource(apiClient, {
        title: 'Orders',
        collection: ['main', 'orders'],
        fields: ['id'],
        limit: 100,
        enabled: true,
      }),
    ).resolves.toEqual({
      records: [[{ name: 'id', value: 1 }]],
    });
    expect(preview).toHaveBeenCalledWith({
      values: {
        title: 'Orders',
        description: '',
        datasource: 'main',
        collectionName: 'orders',
        fields: ['id'],
        filter: undefined,
        sort: undefined,
        limit: 100,
        enabled: true,
      },
    });
  });
});
