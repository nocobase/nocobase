/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type {
  PortalDataAggregateInput,
  PortalDataBaseInput,
  PortalDataCapabilities,
  PortalDataCreateInput,
  PortalDataDeleteResult,
  PortalDataDestroyInput,
  PortalDataGetInput,
  PortalDataMetadataInput,
  PortalDataQueryInput,
  PortalDataQueryResult,
  PortalDataRequestContext,
  PortalDataUpdateInput,
  TargetResourceAction,
} from './types';

interface Repository {
  collection?: {
    name?: string;
    options?: Record<string, unknown>;
    fields?: Map<string, unknown> | Record<string, unknown>;
  };
  find(options: Record<string, unknown>): Promise<unknown[]>;
  findOne(options: Record<string, unknown>): Promise<unknown>;
  findAndCount(options: Record<string, unknown>): Promise<[unknown[], number]>;
  create(options: Record<string, unknown>): Promise<unknown>;
  update(options: Record<string, unknown>): Promise<unknown>;
  destroy(options: Record<string, unknown>): Promise<unknown>;
  query?(options: Record<string, unknown>): Promise<unknown>;
}

interface DatabaseLike {
  getRepository(name: string): Repository;
  getCollection?(name: string): unknown;
}

interface AclLike {
  resolveActionParams?(
    ctx: Context,
    options: {
      resourceName: string;
      rawResourceName: string;
      actionName: string;
      params: Record<string, unknown>;
    },
  ): Promise<{
    mergedParams?: Record<string, unknown>;
  }>;
}

interface AppLike {
  db?: DatabaseLike;
  acl?: AclLike;
}

interface ContextWithRuntime extends Context {
  app: AppLike;
  db: DatabaseLike;
  can?: (options: { resource: string; action: string; rawResourceName?: string }) => unknown;
  get?: (field: string) => string | undefined;
  throw: (status: number, message?: string) => never;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;

const CAPABILITIES: PortalDataCapabilities = {
  data: {
    actions: ['query', 'get', 'create', 'update', 'destroy', 'aggregate'],
    rawSql: false,
    permissionAware: true,
  },
};

export class PortalDataCapabilityService {
  constructor(private readonly app: AppLike) {}

  capabilities(): PortalDataCapabilities {
    return CAPABILITIES;
  }

  async metadata(input: PortalDataMetadataInput, requestContext: PortalDataRequestContext = {}) {
    const collection = this.getCollectionName(input);
    const ctx = this.requireContext(requestContext);
    await this.resolvePermissionParams(ctx, collection, 'list', {});

    const repository = this.getRepository(ctx, collection);
    const fields = this.serializeFields(repository.collection?.fields);

    return {
      name: repository.collection?.name ?? collection,
      options: repository.collection?.options ?? {},
      fields,
    };
  }

  async query(
    input: PortalDataQueryInput,
    requestContext: PortalDataRequestContext = {},
  ): Promise<PortalDataQueryResult> {
    const collection = this.getCollectionName(input);
    const ctx = this.requireContext(requestContext);
    const params = await this.resolvePermissionParams(ctx, collection, 'list', this.pickFindParams(input));
    const repository = this.getRepository(ctx, collection);

    if (input.paginate === false || input.paginate === 'false') {
      return {
        rows: await repository.find({
          context: ctx,
          ...params,
        }),
      };
    }

    const page = this.toPositiveInteger(params.page, DEFAULT_PAGE);
    const pageSize = this.toPositiveInteger(params.pageSize, DEFAULT_PAGE_SIZE);
    const [rows, count] = await repository.findAndCount({
      context: ctx,
      ...params,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      count,
      rows,
      page,
      pageSize,
      totalPage: Math.ceil(count / pageSize),
    };
  }

  async get(input: PortalDataGetInput, requestContext: PortalDataRequestContext = {}) {
    const collection = this.getCollectionName(input);
    const ctx = this.requireContext(requestContext);
    const params = await this.resolvePermissionParams(ctx, collection, 'get', this.pickFindParams(input));
    const repository = this.getRepository(ctx, collection);

    return await repository.findOne({
      context: ctx,
      ...params,
    });
  }

  async create(input: PortalDataCreateInput, requestContext: PortalDataRequestContext = {}) {
    const collection = this.getCollectionName(input);
    const ctx = this.requireContext(requestContext);
    const params = await this.resolvePermissionParams(ctx, collection, 'create', this.pickCreateParams(input));
    const repository = this.getRepository(ctx, collection);

    return await repository.create({
      context: ctx,
      ...params,
    });
  }

  async update(input: PortalDataUpdateInput, requestContext: PortalDataRequestContext = {}) {
    const collection = this.getCollectionName(input);
    const ctx = this.requireContext(requestContext);
    const params = await this.resolvePermissionParams(ctx, collection, 'update', this.pickUpdateParams(input));
    const repository = this.getRepository(ctx, collection);

    return await repository.update({
      context: ctx,
      ...params,
    });
  }

  async destroy(
    input: PortalDataDestroyInput,
    requestContext: PortalDataRequestContext = {},
  ): Promise<PortalDataDeleteResult> {
    const collection = this.getCollectionName(input);
    const ctx = this.requireContext(requestContext);
    const params = await this.resolvePermissionParams(ctx, collection, 'destroy', this.pickDestroyParams(input));
    const repository = this.getRepository(ctx, collection);

    await repository.destroy({
      context: ctx,
      ...params,
    });

    return { success: true };
  }

  async aggregate(input: PortalDataAggregateInput, requestContext: PortalDataRequestContext = {}) {
    const collection = this.getCollectionName(input);
    const ctx = this.requireContext(requestContext);
    const params = await this.resolvePermissionParams(ctx, collection, 'query', this.pickAggregateParams(input));
    const repository = this.getRepository(ctx, collection);

    if (!repository.query) {
      throw new Error(`Repository for "${collection}" does not support aggregate query`);
    }

    return await repository.query({
      context: ctx,
      ...params,
      timezone: input.timezone ?? ctx.get?.('x-timezone'),
    });
  }

  private getCollectionName(input: PortalDataMetadataInput): string {
    const collection = input.collection ?? input.resource;

    if (!collection || typeof collection !== 'string') {
      throw new Error('Portal data capability requires a collection or resource name');
    }

    return collection;
  }

  private requireContext(requestContext: PortalDataRequestContext): ContextWithRuntime {
    if (!requestContext.ctx) {
      throw new Error('Portal data capability requires a NocoBase request context');
    }

    return requestContext.ctx as ContextWithRuntime;
  }

  private getRepository(ctx: ContextWithRuntime, collection: string): Repository {
    const db = ctx.db ?? this.app.db;

    if (!db?.getRepository) {
      throw new Error('NocoBase database is not available');
    }

    return db.getRepository(collection);
  }

  private async resolvePermissionParams(
    ctx: ContextWithRuntime,
    collection: string,
    action: TargetResourceAction,
    params: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (!ctx.can?.({ resource: collection, action, rawResourceName: collection })) {
      ctx.throw(403, 'No permissions');
    }

    const acl = ctx.app?.acl ?? this.app.acl;
    if (!acl?.resolveActionParams) {
      return params;
    }

    const result = await acl.resolveActionParams(ctx, {
      actionName: action,
      params,
      rawResourceName: collection,
      resourceName: collection,
    });

    return result.mergedParams ?? params;
  }

  private pickFindParams(input: PortalDataBaseInput): Record<string, unknown> {
    return this.pickDefined(input, [
      'filterByTk',
      'filter',
      'fields',
      'appends',
      'except',
      'sort',
      'page',
      'pageSize',
      'targetCollection',
    ]);
  }

  private pickCreateParams(input: PortalDataCreateInput): Record<string, unknown> {
    return this.pickDefined(input, ['values', 'whitelist', 'blacklist', 'updateAssociationValues', 'targetCollection']);
  }

  private pickUpdateParams(input: PortalDataUpdateInput): Record<string, unknown> {
    return this.pickDefined(input, [
      'filterByTk',
      'filter',
      'values',
      'whitelist',
      'blacklist',
      'updateAssociationValues',
      'forceUpdate',
      'targetCollection',
    ]);
  }

  private pickDestroyParams(input: PortalDataDestroyInput): Record<string, unknown> {
    return this.pickDefined(input, ['filterByTk', 'filter', 'targetCollection']);
  }

  private pickAggregateParams(input: PortalDataAggregateInput): Record<string, unknown> {
    return this.pickDefined(input, [
      'measures',
      'dimensions',
      'orders',
      'having',
      'filter',
      'limit',
      'offset',
      'sort',
      'targetCollection',
    ]);
  }

  private pickDefined(input: object, keys: string[]): Record<string, unknown> {
    const record = input as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const key of keys) {
      if (record[key] !== undefined) {
        output[key] = record[key];
      }
    }

    return output;
  }

  private toPositiveInteger(value: unknown, fallback: number): number {
    const numberValue = Number(value ?? fallback);
    if (!Number.isInteger(numberValue) || numberValue < 1) {
      return fallback;
    }
    return numberValue;
  }

  private serializeFields(fields: Repository['collection']['fields']): unknown[] {
    if (!fields) {
      return [];
    }

    const values = fields instanceof Map ? Array.from(fields.values()) : Object.values(fields);

    return values.map((field) => {
      if (field && typeof field === 'object' && 'options' in field) {
        return (field as { options?: unknown }).options ?? field;
      }
      return field;
    });
  }
}
