/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionManager } from '@nocobase/data-source-manager';
import type { ResourcerContext } from '@nocobase/resourcer';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { resolveVariablesTemplate } from '../variables/resolve';
import { resetVariablesRegistryForTest } from './test-utils';

describe('variables:resolve external data source records', () => {
  beforeAll(() => {
    resetVariablesRegistryForTest();
  });

  it('resolves a plain JSON popup record through a non-Sequelize collection manager', async () => {
    const collectionManager = new CollectionManager();
    collectionManager.defineCollection({
      name: 'leads',
      tableName: 'leads',
      filterTargetKey: 'id',
      fields: [],
    });
    const repository = collectionManager.getRepository('leads');
    const findOne = vi.spyOn(repository, 'findOne').mockResolvedValue({
      id: 'lead-1',
      email: 'acme@example.test',
    } as unknown as Awaited<ReturnType<typeof repository.findOne>>);
    const getDataSource = vi.fn((key: string) => {
      expect(key).toBe('crm_external');
      return {
        collectionManager,
      };
    });
    const koaContext = {
      app: {
        dataSourceManager: { get: getDataSource },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;

    const result = await resolveVariablesTemplate(
      koaContext,
      { value: '{{ ctx.popup.record.email }}' },
      {
        'popup.record': {
          dataSourceKey: 'crm_external',
          collection: 'leads',
          filterByTk: 'lead-1',
        },
      },
    );

    expect(result).toEqual({ value: 'acme@example.test' });
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      filterByTk: 'lead-1',
      fields: ['email'],
      appends: undefined,
    });
  });

  it('passes association lookups through the collection manager contract', async () => {
    const findOne = vi.fn(async () => ({ id: 'contact-3', email: 'owner@example.test' }));
    const repository = { findOne } as unknown as ReturnType<CollectionManager['getRepository']>;
    const sourceId = { accountId: 'account-9', tenantId: 'tenant-1' };

    class AssociationCollectionManager extends CollectionManager {
      override getRepository(name: string, sourceId?: string | number) {
        expect(name).toBe('accounts.contacts');
        expect(sourceId).toEqual({ accountId: 'account-9', tenantId: 'tenant-1' });
        return repository;
      }
    }

    const collectionManager = new AssociationCollectionManager();
    const koaContext = {
      app: {
        dataSourceManager: {
          get: vi.fn(() => ({ collectionManager })),
        },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;

    const result = await resolveVariablesTemplate(
      koaContext,
      { value: '{{ ctx.popup.record.email }}' },
      {
        'popup.record': {
          associationName: 'accounts.contacts',
          collection: 'contacts',
          dataSourceKey: 'crm_external',
          filterByTk: 'contact-3',
          sourceId,
        },
      },
    );

    expect(result).toEqual({ value: 'owner@example.test' });
    expect(findOne).toHaveBeenCalledWith({
      filterByTk: 'contact-3',
      fields: ['email'],
      appends: undefined,
    });
  });

  it('preserves explicit fields for a non-Sequelize collection manager', async () => {
    const collectionManager = new CollectionManager();
    collectionManager.defineCollection({
      name: 'leads',
      tableName: 'leads',
      filterTargetKey: 'id',
      fields: [],
    });
    const repository = collectionManager.getRepository('leads');
    const findOne = vi.spyOn(repository, 'findOne').mockResolvedValue({
      id: 'lead-1',
    } as unknown as Awaited<ReturnType<typeof repository.findOne>>);
    const koaContext = {
      app: {
        dataSourceManager: {
          get: vi.fn(() => ({ collectionManager })),
        },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;

    const result = await resolveVariablesTemplate(
      koaContext,
      {
        email: '{{ ctx.popup.record.email }}',
        id: '{{ ctx.popup.record.id }}',
      },
      {
        'popup.record': {
          collection: 'leads',
          dataSourceKey: 'crm_external',
          fields: ['id'],
          filterByTk: 'lead-1',
        },
      },
    );

    expect(result).toEqual({
      email: '{{ ctx.popup.record.email }}',
      id: 'lead-1',
    });
    expect(findOne).toHaveBeenCalledWith({
      filterByTk: 'lead-1',
      fields: ['id'],
      appends: undefined,
    });
  });
});
