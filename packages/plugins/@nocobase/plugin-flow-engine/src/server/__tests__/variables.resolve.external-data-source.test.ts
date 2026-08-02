/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { resolveVariablesTemplate } from '../variables/resolve';
import { resetVariablesRegistryForTest } from './test-utils';

describe('variables:resolve external data source records', () => {
  beforeAll(() => {
    resetVariablesRegistryForTest();
  });

  it('resolves a popup record field when the repository returns plain JSON', async () => {
    const findOne = vi.fn(async () => ({ id: 'lead-1', email: 'acme@example.test' }));
    const repository = { findOne };
    const collection = {
      filterTargetKey: 'id',
      model: {
        primaryKeyAttribute: 'id',
      },
    };
    const getDataSource = vi.fn((key: string) => {
      expect(key).toBe('crm_external');
      return {
        collectionManager: {
          db: {
            getCollection: () => collection,
            getRepository: () => repository,
          },
        },
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
      fields: undefined,
      appends: undefined,
    });
  });
});
