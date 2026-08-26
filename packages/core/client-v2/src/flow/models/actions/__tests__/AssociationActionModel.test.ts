/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { BaseRecordResource, FlowEngine } from '@nocobase/flow-engine';
import {
  applyDisassociateAction,
  ActionModel,
  applyAssociateAction,
  AssociateActionModel,
  CollectionActionGroupModel,
  DisassociateActionModel,
  getAssociationSelectorContextInputArgs,
  getAssociationTargetResourceSettings,
  PopupActionModel,
  RecordActionGroupModel,
} from '../../..';

class TestAssociationResource<T = any> extends BaseRecordResource<T> {
  async refresh(): Promise<void> {}
}

const createEngine = () => {
  const engine = new FlowEngine();
  engine.registerModels({
    ActionModel,
    AssociateActionModel,
    DisassociateActionModel,
    PopupActionModel,
    CollectionActionGroupModel,
    RecordActionGroupModel,
  });
  return engine;
};

const createContext = (engine: FlowEngine, resourceSettingsInit: any) => {
  const collection = {
    options: {
      availableActions: ['list', 'update'],
    },
    getFilterByTK: vi.fn((record) => record.id),
  };
  return {
    engine,
    collection,
    blockModel: {
      collection,
      getResourceSettingsInitParams: () => resourceSettingsInit,
    },
  } as any;
};

describe('association action models', () => {
  it('uses update permission for association operations', () => {
    expect(AssociateActionModel.prototype.getAclActionName.call({})).toBe('update');
    expect(DisassociateActionModel.prototype.getAclActionName.call({})).toBe('update');
    expect(AssociateActionModel.capabilityActionName).toBe('update');
    expect(DisassociateActionModel.capabilityActionName).toBe('update');
  });

  it('uses association target collection for selector table blocks', () => {
    const ctx: any = {
      blockModel: {
        association: {
          target: 'transports',
          targetCollection: {
            name: 'transports',
            dataSourceKey: 'main',
          },
        },
        getResourceSettingsInitParams: () => ({
          dataSourceKey: 'main',
          collectionName: 'orders',
          associationName: 'products.transports',
        }),
      },
    };

    expect(getAssociationTargetResourceSettings(ctx)).toEqual({
      dataSourceKey: 'main',
      collectionName: 'transports',
    });
  });

  it('passes one-to-many association context to selector table blocks', () => {
    const association = {
      name: 'orders',
      interface: 'o2m',
      target: 'orders',
      sourceKey: 'id',
      foreignKey: 'userId',
    };
    const ctx: any = {
      blockModel: {
        association,
        resource: {
          getSourceId: () => 362872646860800,
        },
        getResourceSettingsInitParams: () => ({
          dataSourceKey: 'main',
          collectionName: 'orders',
          associationName: 'users.orders',
          sourceId: '{{ctx.popup.record.id}}',
        }),
      },
    };

    expect(getAssociationSelectorContextInputArgs(ctx)).toEqual({
      collectionField: association,
      sourceId: 362872646860800,
      associatedRecords: [],
    });
  });

  it('passes current associated records to selector table blocks', () => {
    const associatedRecords = [{ id: 11 }, { id: 12 }];
    const association = {
      name: 'tags',
      interface: 'm2m',
      target: 'tags',
      sourceKey: 'id',
      targetKey: 'id',
    };
    const ctx: any = {
      blockModel: {
        association,
        resource: {
          getSourceId: () => 1,
          getData: () => associatedRecords,
        },
        getResourceSettingsInitParams: () => ({
          dataSourceKey: 'main',
          collectionName: 'tags',
          associationName: 'posts.tags',
          sourceId: '{{ctx.popup.record.id}}',
        }),
      },
    };

    expect(getAssociationSelectorContextInputArgs(ctx)).toEqual({
      collectionField: association,
      sourceId: 1,
      associatedRecords,
    });
  });

  it('shows Associate only in collection actions of association blocks', async () => {
    const engine = createEngine();

    const relationItems = await CollectionActionGroupModel.defineChildren(
      createContext(engine, {
        dataSourceKey: 'main',
        collectionName: 'orders',
        associationName: 'products.o2m_orders',
      }),
    );
    const normalItems = await CollectionActionGroupModel.defineChildren(
      createContext(engine, {
        dataSourceKey: 'main',
        collectionName: 'orders',
      }),
    );

    expect(relationItems.map((item: any) => item.useModel)).toContain('AssociateActionModel');
    expect(relationItems.map((item: any) => item.useModel)).not.toContain('DisassociateActionModel');
    expect(normalItems.map((item: any) => item.useModel)).not.toContain('AssociateActionModel');
  });

  it('shows Disassociate only in record actions of association blocks', async () => {
    const engine = createEngine();

    const relationItems = await RecordActionGroupModel.defineChildren(
      createContext(engine, {
        dataSourceKey: 'main',
        collectionName: 'orders',
        associationName: 'products.o2m_orders',
      }),
    );
    const normalItems = await RecordActionGroupModel.defineChildren(
      createContext(engine, {
        dataSourceKey: 'main',
        collectionName: 'orders',
      }),
    );

    expect(relationItems.map((item: any) => item.useModel)).toContain('DisassociateActionModel');
    expect(relationItems.map((item: any) => item.useModel)).not.toContain('AssociateActionModel');
    expect(normalItems.map((item: any) => item.useModel)).not.toContain('DisassociateActionModel');
  });

  it('disassociates the current record through association resource remove action', async () => {
    const resource = {
      runAction: vi.fn(async () => ({})),
      refresh: vi.fn(async () => {}),
    };
    const collection = {
      getFilterByTK: vi.fn(() => 12),
    };
    const ctx: any = {
      blockModel: {
        collection,
        resource,
        getResourceSettingsInitParams: () => ({
          dataSourceKey: 'main',
          collectionName: 'orders',
          associationName: 'products.o2m_orders',
        }),
      },
      record: {
        id: 12,
      },
      message: {
        success: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    await applyDisassociateAction(ctx);

    expect(collection.getFilterByTK).toHaveBeenCalledWith(ctx.record);
    expect(resource.runAction).toHaveBeenCalledWith('remove', {
      data: [12],
    });
    expect(resource.refresh).toHaveBeenCalled();
    expect(ctx.message.success).toHaveBeenCalledWith('Record disassociated successfully');
  });

  it('associates selected records through association resource add action', async () => {
    const resource = {
      runAction: vi.fn(async () => ({})),
      refresh: vi.fn(async () => {}),
    };
    const collection = {
      getFilterByTK: vi.fn((record) => record.id),
    };
    const ctx: any = {
      blockModel: {
        collection,
        resource,
        getResourceSettingsInitParams: () => ({
          dataSourceKey: 'main',
          collectionName: 'orders',
          associationName: 'products.o2m_orders',
        }),
      },
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    await applyAssociateAction(ctx, [{ id: 11 }, { id: 12 }]);

    expect(collection.getFilterByTK).toHaveBeenCalledWith({ id: 11 });
    expect(collection.getFilterByTK).toHaveBeenCalledWith({ id: 12 });
    expect(resource.runAction).toHaveBeenCalledWith('add', {
      data: [11, 12],
    });
    expect(resource.refresh).toHaveBeenCalled();
    expect(ctx.message.success).toHaveBeenCalledWith('Record associated successfully');
  });

  it('uses nested association resource url when adding associated records', async () => {
    const engine = createEngine();
    const resource = engine.createResource(TestAssociationResource);
    const api = {
      request: vi.fn().mockResolvedValue({ data: { data: {} } }),
    };
    resource.setAPIClient(api as any);
    resource.setResourceName('products.o2m_orders');
    resource.setSourceId('362872646860800');

    const ctx: any = {
      blockModel: {
        collection: {
          getFilterByTK: vi.fn((record) => record.id),
        },
        resource,
        getResourceSettingsInitParams: () => ({
          dataSourceKey: 'main',
          collectionName: 'orders',
          associationName: 'products.o2m_orders',
          sourceId: '362872646860800',
        }),
      },
      message: {
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
      },
      t: (value: string) => value,
    };

    await applyAssociateAction(ctx, [{ id: 11 }]);

    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: 'products/362872646860800/o2m_orders:add',
        data: [11],
      }),
    );
  });
});
