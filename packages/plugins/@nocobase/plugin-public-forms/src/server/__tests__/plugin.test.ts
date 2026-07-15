/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { PluginPublicFormsServer } from '../plugin';

type PublicFormsServerApp = ConstructorParameters<typeof PluginPublicFormsServer>[0];

function createPlugin() {
  return Object.create(PluginPublicFormsServer.prototype) as PluginPublicFormsServer & Record<string, any>;
}

function createAclPlugin() {
  return new PluginPublicFormsServer(
    {
      db: {
        getCollection: vi.fn(() => null),
      },
    } as unknown as PublicFormsServerApp,
    { name: 'public-forms' },
  );
}

function setupGetMetaPlugin(options: { password?: string; enabled?: boolean } = {}) {
  const plugin = createPlugin();
  const visibleFlowModel = {
    uid: 'pf1',
    use: 'RouteModel',
  };
  const completeFlowModel = {
    uid: 'pf1',
    use: 'RouteModel',
  };
  const sign = vi.fn(() => 'signed-token');
  const instance = {
    collection: 'main:users',
    get: (key: string) => {
      return {
        enabled: options.enabled ?? true,
        password: options.password,
        title: 'Public form',
      }[key];
    },
  };
  const db = {
    getRepository: vi.fn((name: string) => {
      if (name === 'publicForms') {
        return {
          findOne: vi.fn(async () => instance),
        };
      }
      if (name === 'uiSchemas') {
        return {
          getJsonSchema: vi.fn(async () => null),
        };
      }
      return null;
    }),
  };

  Object.defineProperty(plugin, 'app', {
    value: {
      db,
      environment: {
        renderJsonTemplate: vi.fn((value) => value),
      },
      authManager: {
        jwt: {
          sign,
        },
      },
    },
  });
  plugin.getFlowModelTree = vi.fn(async (_uid: string, treeOptions?: { includeAsyncNode?: boolean }) => {
    return treeOptions?.includeAsyncNode ? completeFlowModel : visibleFlowModel;
  });
  plugin.getSchemaAssociationAppends = vi.fn(() => []);
  plugin.getFlowModelAssociationAppends = vi.fn(() => []);
  plugin.parseCollectionData = vi.fn(async (_dataSourceKey, collectionName, appends) => [
    { name: collectionName },
    ...appends.map((name: string) => ({ name })),
  ]);

  return { plugin, sign };
}

type PublicFormAclContext = {
  PublicForm: {
    collectionName: string;
    targetCollections: string[];
  };
  action: {
    resourceName: string;
    actionName: string;
    params: {
      fileCollectionName?: string;
    };
  };
  permission?: {
    skip: boolean;
  };
};

describe('PluginPublicFormsServer', () => {
  it('keeps primary collection options in public form meta', async () => {
    const plugin = createPlugin();
    const getCollection = vi.fn((name: string) => {
      if (name === 'users') {
        return {
          name: 'users',
          options: {
            name: 'users',
            title: 'Users',
            template: 'general',
          },
          filterTargetKey: 'id',
          titleField: 'nickname',
          getFields: () => [
            {
              options: {
                name: 'nickname',
                type: 'string',
              },
            },
          ],
        };
      }

      return {
        name,
        options: {
          name,
        },
        filterTargetKey: 'name',
        titleField: 'title',
        getFields: () => [],
      };
    });

    Object.defineProperty(plugin, 'app', {
      value: {
        dataSourceManager: {
          dataSources: new Map([
            [
              'main',
              {
                collectionManager: {
                  getCollection,
                },
              },
            ],
          ]),
        },
      },
    });

    const collections = await plugin.parseCollectionData('main', 'users', ['roles']);

    expect(collections[0]).toMatchObject({
      name: 'users',
      title: 'Users',
      template: 'general',
      filterTargetKey: 'id',
      titleField: 'nickname',
      fields: [
        {
          name: 'nickname',
          type: 'string',
        },
      ],
    });
    expect(collections[1]).toMatchObject({
      name: 'roles',
      filterTargetKey: 'name',
      titleField: 'title',
      fields: [],
    });
  });

  it('returns public form meta without async nodes while using the complete tree for appends', async () => {
    const plugin = createPlugin();
    const visibleFlowModel = {
      uid: 'pf1',
      use: 'RouteModel',
    };
    const completeFlowModel = {
      uid: 'pf1',
      use: 'RouteModel',
      subModels: {
        popup: {
          uid: 'popup-grid',
          use: 'BlockGridModel',
        },
      },
    };
    const sign = vi.fn(() => 'signed-token');

    const db = {
      getRepository: vi.fn((name: string) => {
        if (name === 'publicForms') {
          return {
            findOne: vi.fn(async () => ({
              collection: 'main:users',
              get: (key: string) => {
                return {
                  enabled: true,
                  title: 'Public form',
                }[key];
              },
            })),
          };
        }
        if (name === 'uiSchemas') {
          return {
            getJsonSchema: vi.fn(async () => null),
          };
        }
        return null;
      }),
    };
    Object.defineProperty(plugin, 'app', {
      value: {
        db,
        environment: {
          renderJsonTemplate: vi.fn((value) => value),
        },
        authManager: {
          jwt: {
            sign,
          },
        },
      },
    });
    plugin.getFlowModelTree = vi.fn(async (_uid: string, options?: { includeAsyncNode?: boolean }) => {
      return options?.includeAsyncNode ? completeFlowModel : visibleFlowModel;
    });
    plugin.getSchemaAssociationAppends = vi.fn(() => []);
    plugin.getFlowModelAssociationAppends = vi.fn((_dataSourceKey, _collectionName, flowModel) => {
      return flowModel === completeFlowModel ? ['roles'] : [];
    });
    plugin.parseCollectionData = vi.fn(async (_dataSourceKey, collectionName, appends) => [
      { name: collectionName },
      ...appends.map((name: string) => ({ name })),
    ]);

    const meta = await plugin.getMetaByTk('pf1', {});

    expect(meta.flowModel).toBe(visibleFlowModel);
    expect(plugin.getFlowModelTree).toHaveBeenCalledWith('pf1');
    expect(plugin.getFlowModelTree).toHaveBeenCalledWith('pf1', { includeAsyncNode: true });
    expect(plugin.getFlowModelAssociationAppends).toHaveBeenCalledWith('main', 'users', completeFlowModel);
    expect(plugin.parseCollectionData).toHaveBeenCalledWith('main', 'users', ['roles']);
    expect(sign).toHaveBeenCalledWith(
      {
        collectionName: 'users',
        formKey: 'pf1',
        targetCollections: ['roles'],
      },
      {
        expiresIn: '1h',
      },
    );
  });

  it('requires password when a protected public form has no valid token', async () => {
    const { plugin } = setupGetMetaPlugin({ password: 'secret' });

    await expect(plugin.getMetaByTk('pf1', {})).resolves.toEqual({
      passwordRequired: true,
    });
  });

  it('validates submitted password before trusting any cached token', async () => {
    const { plugin } = setupGetMetaPlugin({ password: 'secret' });
    plugin.validatePublicFormToken = vi.fn(async () => ({ formKey: 'pf1' }));

    await expect(plugin.getMetaByTk('pf1', { password: 'wrong', token: 'cached-token' })).rejects.toThrow(
      'Please enter your password',
    );
    expect(plugin.validatePublicFormToken).not.toHaveBeenCalled();
  });

  it('keeps the legacy password flow working without a token', async () => {
    const { plugin, sign } = setupGetMetaPlugin({ password: 'secret' });

    const meta = await plugin.getMetaByTk('pf1', { password: 'secret' });

    expect(meta.token).toBe('signed-token');
    expect(sign).toHaveBeenCalledWith(
      {
        collectionName: 'users',
        formKey: 'pf1',
        targetCollections: [],
      },
      {
        expiresIn: '1h',
      },
    );
  });

  it('uses the submitted password before validating a stale token', async () => {
    const { plugin } = setupGetMetaPlugin({ password: 'secret' });
    plugin.validatePublicFormToken = vi.fn(async () => {
      throw new Error('Invalid public form token');
    });

    const meta = await plugin.getMetaByTk('pf1', { password: 'secret', token: 'stale-token' });

    expect(meta.token).toBe('signed-token');
    expect(plugin.validatePublicFormToken).not.toHaveBeenCalled();
  });

  it('allows a protected public form only with a token for the same form', async () => {
    const { plugin } = setupGetMetaPlugin({ password: 'secret' });
    plugin.validatePublicFormToken = vi.fn(async () => ({ formKey: 'pf1' }));

    const meta = await plugin.getMetaByTk('pf1', { token: 'same-form-token' });

    expect(meta.token).toBe('signed-token');
    expect(plugin.validatePublicFormToken).toHaveBeenCalledWith('pf1', 'same-form-token');
  });

  it('asks for password again when a cached token belongs to another form', async () => {
    const { plugin } = setupGetMetaPlugin({ password: 'secret' });
    plugin.validatePublicFormToken = vi.fn(async () => {
      throw new Error('Invalid public form token');
    });

    await expect(plugin.getMetaByTk('pf1', { token: 'another-form-token' })).resolves.toEqual({
      passwordRequired: true,
    });
  });

  it('loads async flow model by parent after validating the public form token', async () => {
    const plugin = createPlugin();
    const popupTree = {
      uid: 'popup-grid',
      use: 'BlockGridModel',
    };
    const findModelByParentId = vi.fn(async () => popupTree);

    plugin.validatePublicFormToken = vi.fn(async () => ({ formKey: 'pf1' }));
    plugin.isFlowModelDescendant = vi.fn(async () => true);
    const db = {
      getCollection: vi.fn(() => ({
        repository: {
          findModelByParentId,
        },
      })),
    };
    Object.defineProperty(plugin, 'app', {
      value: {
        db,
      },
    });

    await expect(
      plugin.getFlowModelByTk('pf1', {
        parentId: 'field1',
        subKey: 'grid-block',
        token: 'token',
      }),
    ).resolves.toBe(popupTree);
    expect(plugin.validatePublicFormToken).toHaveBeenCalledWith('pf1', 'token');
    expect(plugin.isFlowModelDescendant).toHaveBeenCalledWith('pf1', 'field1');
    expect(findModelByParentId).toHaveBeenCalledWith('field1', {
      subKey: 'grid-block',
      includeAsyncNode: true,
    });
    expect(plugin.isFlowModelDescendant).toHaveBeenCalledWith('pf1', 'popup-grid');
  });

  it('loads public form flow model by uid after validating descendant relation', async () => {
    const plugin = createPlugin();
    const popupTree = {
      uid: 'popup-grid',
      use: 'BlockGridModel',
    };
    const findModelById = vi.fn(async () => popupTree);

    plugin.validatePublicFormToken = vi.fn(async () => ({ formKey: 'pf1' }));
    plugin.isFlowModelDescendant = vi.fn(async () => true);
    const db = {
      getCollection: vi.fn(() => ({
        repository: {
          findModelById,
        },
      })),
    };
    Object.defineProperty(plugin, 'app', {
      value: {
        db,
      },
    });

    await expect(
      plugin.getFlowModelByTk('pf1', {
        uid: 'popup-grid',
        token: 'token',
      }),
    ).resolves.toBe(popupTree);
    expect(plugin.validatePublicFormToken).toHaveBeenCalledWith('pf1', 'token');
    expect(plugin.isFlowModelDescendant).toHaveBeenCalledWith('pf1', 'popup-grid');
    expect(findModelById).toHaveBeenCalledWith('popup-grid', { includeAsyncNode: true });
  });

  it('allows public form storage checks', async () => {
    const plugin = createAclPlugin();
    const ctx: PublicFormAclContext = {
      PublicForm: {
        collectionName: 'orders',
        targetCollections: [],
      },
      action: {
        resourceName: 'storages',
        actionName: 'check',
        params: {
          fileCollectionName: 'publicFiles',
        },
      },
    };
    const next = vi.fn(async () => undefined);

    await plugin.parseACL(ctx, next);

    expect(ctx.permission).toEqual({ skip: true });
    expect(next).toHaveBeenCalled();
  });
});
