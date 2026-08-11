/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { PortalDataCapabilityService } from '../portal-data-capability-service';

function createServiceContext(
  options: {
    can?: boolean;
    rows?: unknown[];
    count?: number;
    resolvedParams?: Record<string, unknown>;
  } = {},
) {
  const repository = {
    collection: {
      name: 'orders',
      options: {},
      fields: new Map([
        [
          'id',
          {
            options: {
              name: 'id',
              type: 'bigInt',
            },
          },
        ],
      ]),
    },
    find: vi.fn(async () => options.rows ?? []),
    findOne: vi.fn(async () => ({ id: 1 })),
    findAndCount: vi.fn(async () => [options.rows ?? [], options.count ?? 0]),
    create: vi.fn(async ({ values }) => ({ id: 1, values })),
    update: vi.fn(async ({ values }) => ({ values })),
    destroy: vi.fn(async () => undefined),
    query: vi.fn(async () => ({ rows: options.rows ?? [] })),
  };
  const ctx = {
    app: {
      acl: {
        resolveActionParams: vi.fn(async (_ctx, { params }) => ({
          mergedParams: options.resolvedParams ?? params,
        })),
      },
    },
    db: {
      getRepository: vi.fn(() => repository),
    },
    can: vi.fn(() => options.can ?? true),
    get: vi.fn(() => 'Asia/Shanghai'),
    throw: vi.fn((status: number, message?: string) => {
      const error = new Error(message);
      Object.assign(error, { status });
      throw error;
    }),
  };
  const service = new PortalDataCapabilityService(ctx.app);

  return {
    ctx,
    repository,
    service,
  };
}

describe('PortalDataCapabilityService', () => {
  it('queries records with target collection permission checks', async () => {
    const { ctx, repository, service } = createServiceContext({
      rows: [{ id: 1 }],
      count: 1,
    });

    const result = await service.query(
      {
        collection: 'orders',
        filter: {
          status: 'pending',
        },
        page: 2,
        pageSize: 10,
      },
      { ctx },
    );

    expect(ctx.can).toHaveBeenCalledWith({
      action: 'list',
      rawResourceName: 'orders',
      resource: 'orders',
    });
    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          status: 'pending',
        },
        limit: 10,
        offset: 10,
      }),
    );
    expect(result).toMatchObject({
      count: 1,
      page: 2,
      pageSize: 10,
      rows: [{ id: 1 }],
      totalPage: 1,
    });
  });

  it('rejects operations when the target collection action is not allowed', async () => {
    const { ctx, service } = createServiceContext({
      can: false,
    });

    await expect(
      service.create(
        {
          collection: 'orders',
          values: {
            status: 'draft',
          },
        },
        { ctx },
      ),
    ).rejects.toMatchObject({
      message: 'No permissions',
      status: 403,
    });
  });

  it('returns collection metadata without exposing raw SQL', async () => {
    const { ctx, service } = createServiceContext();

    const metadata = await service.metadata(
      {
        collection: 'orders',
      },
      { ctx },
    );

    expect(metadata).toMatchObject({
      fields: [
        {
          name: 'id',
          type: 'bigInt',
        },
      ],
      name: 'orders',
    });
    expect(service.capabilities()).toEqual({
      data: {
        actions: ['query', 'get', 'create', 'update', 'destroy', 'aggregate'],
        permissionAware: true,
        rawSql: false,
      },
    });
  });
});
