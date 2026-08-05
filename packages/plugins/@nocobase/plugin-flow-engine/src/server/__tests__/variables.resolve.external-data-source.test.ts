/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { generateFlowModelRd } from '@nocobase/utils';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as variableExpression from '../template/variable-expression';
import { authorizeVariablesResolve } from '../variables/allow-list';
import {
  resolveAnalyzedVariablesTemplate,
  resolveVariablesBatch,
  resolveVariablesTemplate,
} from '../variables/resolve';
import { createBuiltInRecordSlotResolvers } from '../variables/record-slot-policy';
import { getRecordSlotResolverRegistry } from '../variables/record-slot-resolvers';
import { resetVariablesRegistryForTest } from './test-utils';

describe('variables:resolve external data source records', () => {
  beforeAll(() => {
    resetVariablesRegistryForTest();
  });

  it('resolves a registered external record field when the repository returns plain JSON', async () => {
    const analyze = vi.spyOn(variableExpression, 'analyzeVariableTemplate');
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
      db: { getRepository: vi.fn() },
      state: { currentRole: 'root', currentRoles: ['root'] },
    } as unknown as ResourcerContext;
    const dispose = getRecordSlotResolverRegistry(koaContext.app).register({
      owner: 'test',
      id: 'external-backend',
      match: (path) => path.varName === 'backend' && path.runtimeSegments[0] === 'record',
      resolve: () => ({
        status: 'resolved',
        slot: ['record'],
      }),
    });

    const template = { value: '{{ ctx.backend.record.email }}' };
    const authorization = await authorizeVariablesResolve(koaContext, {
      template,
      contextParams: {
        'backend.record': {
          dataSourceKey: 'crm_external',
          collection: 'leads',
          filterByTk: 'lead-1',
        },
      },
    });
    expect(authorization.allowed).toBe(true);
    if (!authorization.allowed) return;
    const result = await resolveAnalyzedVariablesTemplate(
      koaContext,
      authorization.analysis,
      authorization.policy,
      authorization.bindingPlan,
    );

    expect(result).toEqual({ value: 'acme@example.test' });
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      filterByTk: 'lead-1',
      fields: undefined,
      appends: undefined,
    });
    expect(analyze).toHaveBeenCalledTimes(1);
    analyze.mockRestore();
    dispose();
  });

  it('does not query an external Form descriptor without an owning resolver', async () => {
    const userId = 1;
    const signInTime = 'variables-external-projection-1';
    const uid = 'external-record-projection';
    const tokenPayload = Buffer.from(JSON.stringify({ userId, signInTime })).toString('base64url');
    const token = `test.${tokenPayload}.sig`;
    const rd = generateFlowModelRd(uid, `${userId}:${signInTime}`);
    const template = {
      id: '{{ ctx.formValues.id }}',
      owner: '{{ ctx.formValues.contacts[0].email }}',
    };
    const findOne = vi.fn();
    const flowModel = {
      uid,
      options: {
        props: template,
        stepParams: { resourceSettings: { init: { collectionName: 'leads', dataSourceKey: 'crm_external' } } },
        use: 'EditFormModel',
      },
      parentId: null,
      subKey: null,
      async: false,
    };
    const context = {
      app: {
        acl: { getRole: () => ({ getStrategy: () => ({ allowConfigure: false }) }) },
        dataSourceManager: { get: () => undefined },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      db: {
        getCollection: () => ({ repository: { findModelNodeSnapshotById: async () => flowModel } }),
        getRepository: () => ({ find: async () => [] }),
      },
      get: (name: string) => (name.toLowerCase() === 'authorization' ? `Bearer ${token}` : undefined),
      state: { currentRole: 'member', currentRoles: ['member'] },
    } as unknown as ResourcerContext;

    const authorization = await authorizeVariablesResolve(context, {
      contextParams: {
        formValues: {
          appends: ['contacts'],
          collection: 'leads',
          dataSourceKey: 'crm_external',
          fields: ['id'],
          filterByTk: 'lead-1',
        },
      },
      rd,
      template,
    });

    expect(authorization.allowed).toBe(true);
    if (!authorization.allowed) return;
    await expect(
      resolveAnalyzedVariablesTemplate(
        context,
        authorization.analysis,
        authorization.policy,
        authorization.bindingPlan,
      ),
    ).resolves.toEqual(template);
    expect(findOne).not.toHaveBeenCalled();
  });

  it('resolves the external association target submitted in the exact slot', async () => {
    const targetCollection = {
      name: 'contacts',
      filterTargetKey: 'id',
      model: {
        primaryKeyAttribute: 'id',
        rawAttributes: { email: {}, id: {} },
        associations: {},
      },
    };
    const findOne = vi.fn(async () => ({ email: 'owner@example.test', id: 'contact-3' }));
    const getRepository = vi.fn((associationName: string, sourceId: unknown) => {
      expect(associationName).toBe('accounts.contacts');
      expect(sourceId).toBe('account-9');
      return { collection: targetCollection, findOne, targetCollection };
    });
    const getDataSource = vi.fn((key: string) => {
      expect(key).toBe('crm_external');
      return {
        collectionManager: {
          db: {
            getCollection: () => targetCollection,
            getRepository,
          },
        },
      };
    });
    const context = {
      app: {
        dataSourceManager: { get: getDataSource },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      db: { getRepository: vi.fn() },
      state: { currentRole: 'root', currentRoles: ['root'] },
    } as unknown as ResourcerContext;
    const dispose = getRecordSlotResolverRegistry(context.app).register({
      owner: 'test',
      id: 'external-association',
      match: (path) => path.varName === 'backend' && path.runtimeSegments[0] === 'record',
      resolve: () => ({
        status: 'resolved',
        slot: ['record'],
      }),
    });
    const template = { value: '{{ ctx.backend.record.email }}' };
    const authorization = await authorizeVariablesResolve(context, {
      template,
      contextParams: {
        'backend.record': {
          associationName: 'accounts.contacts',
          collection: 'contacts',
          dataSourceKey: 'crm_external',
          filterByTk: 'contact-3',
          sourceId: 'account-9',
        },
      },
    });
    expect(authorization.allowed).toBe(true);
    if (!authorization.allowed) return;

    await expect(
      resolveAnalyzedVariablesTemplate(
        context,
        authorization.analysis,
        authorization.policy,
        authorization.bindingPlan,
      ),
    ).resolves.toEqual({ value: 'owner@example.test' });
    expect(getRepository).toHaveBeenCalledWith('accounts.contacts', 'account-9');
    expect(findOne).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: 'contact-3' }));
    dispose();
  });

  it('keeps a registered request-bound Record slot as a whole object', async () => {
    const findOne = vi.fn(async () => ({ email: 'parent@example.test', id: 'parent-1' }));
    const collection = { name: 'leads', filterTargetKey: 'id', model: { primaryKeyAttribute: 'id' } };
    const context = {
      app: {
        dataSourceManager: {
          get: () => ({
            collectionManager: {
              db: { getCollection: () => collection, getRepository: () => ({ findOne }) },
            },
          }),
        },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;
    const dispose = getRecordSlotResolverRegistry(context.app).register({
      owner: 'test',
      id: 'backend-record',
      match: (path) => path.varName === 'backend' && path.runtimeSegments[0] === 'record',
      resolve: () => ({
        status: 'resolved',
        slot: ['record'],
      }),
    });

    const result = await resolveVariablesTemplate(
      context,
      { value: '{{ ctx.backend.record }}' },
      {
        'backend.record': {
          collection: 'leads',
          dataSourceKey: 'crm_external',
          filterByTk: 'parent-1',
        },
      },
    );

    expect(result).toEqual({ value: { email: 'parent@example.test', id: 'parent-1' } });
    expect(findOne).toHaveBeenCalledWith({ filterByTk: 'parent-1', fields: undefined, appends: undefined });
    dispose();
  });

  it('resolves a direct Record through the public helper without resource metadata', async () => {
    const findOne = vi.fn(async () => ({ id: 'lead-1', name: 'Direct lead' }));
    const collection = { name: 'leads', filterTargetKey: 'id', model: { primaryKeyAttribute: 'id' } };
    const getCollection = vi.fn((name: string) => {
      expect(name).toBe('leads');
      return collection;
    });
    const getRepository = vi.fn((name: string) => {
      expect(name).toBe('leads');
      return { findOne };
    });
    const getDataSource = vi.fn((key: string) => {
      expect(key).toBe('crm_external');
      return {
        collectionManager: {
          db: { getCollection, getRepository },
        },
      };
    });
    const context = {
      app: {
        dataSourceManager: {
          get: getDataSource,
        },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;
    const registry = getRecordSlotResolverRegistry(context.app);
    const disposers = createBuiltInRecordSlotResolvers().map((resolver) => registry.register(resolver));

    const result = await resolveVariablesTemplate(
      context,
      { value: '{{ ctx.record.name }}' },
      {
        record: {
          collection: 'leads',
          dataSourceKey: 'crm_external',
          filterByTk: 'lead-1',
        },
      },
    );

    expect(result).toEqual({ value: 'Direct lead' });
    expect(getDataSource).toHaveBeenCalledWith('crm_external');
    expect(getCollection).toHaveBeenCalledWith('leads');
    expect(getRepository).toHaveBeenCalledWith('leads');
    expect(findOne).toHaveBeenCalledWith({ filterByTk: 'lead-1', fields: undefined, appends: undefined });
    disposers.forEach((dispose) => dispose());
  });

  it('isolates public wrapper analysis failures and hides the lexical helper', async () => {
    const context = {
      app: {
        dataSourceManager: { get: vi.fn() },
        environment: { getVariables: () => ({}) },
        logger: { child: () => ({ debug: vi.fn(), warn: vi.fn() }) },
      },
      state: {},
    } as unknown as ResourcerContext;
    const invalidTemplate = new Proxy(
      {},
      {
        ownKeys: () => {
          throw new TypeError('untrusted template');
        },
      },
    );

    await expect(resolveVariablesTemplate(context, invalidTemplate)).resolves.toBe(invalidTemplate);
    await expect(
      resolveVariablesBatch(context, [
        { id: 'invalid', template: invalidTemplate },
        { id: 'valid', template: { value: 'unchanged' } },
      ]),
    ).resolves.toEqual([
      { id: 'invalid', data: invalidTemplate },
      { id: 'valid', data: { value: 'unchanged' } },
    ]);

    const helperAttempts = {
      directEval: '{{ eval("__resolveVariablePath0") }}',
      parenthesizedEval: '{{ (eval)("__resolveVariablePath0") }}',
      functionConstructor: '{{ Function("return __resolveVariablePath0")() }}',
      globalEval: '{{ globalThis.eval("__resolveVariablePath0") }}',
      indirectEval: '{{ (0, eval)("__resolveVariablePath0") }}',
    };
    await expect(resolveVariablesTemplate(context, helperAttempts, {})).resolves.toEqual(helperAttempts);
  });
});
