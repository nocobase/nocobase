/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { ChinaRegionFieldInterface } from '../chinaRegion';
import { ChinaRegionFieldModel, DisplayChinaRegionFieldModel } from '../models';
import PluginFieldChinaRegionClient from '../plugin';

const uidMock = vi.hoisted(() => {
  let index = 0;
  return () => {
    index += 1;
    return `uid-${index}`;
  };
});

vi.mock('@formily/shared', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@formily/shared')>()),
  uid: uidMock,
}));

describe('ChinaRegionFieldInterface', () => {
  it('registers the china region interface and model loaders', async () => {
    const addFieldInterfaces = vi.fn();
    const registerModelLoaders = vi.fn();
    const plugin = Object.create(PluginFieldChinaRegionClient.prototype) as PluginFieldChinaRegionClient & {
      app: {
        addFieldInterfaces: typeof addFieldInterfaces;
        flowEngine: {
          registerModelLoaders: typeof registerModelLoaders;
        };
      };
    };
    plugin.app = {
      addFieldInterfaces,
      flowEngine: {
        registerModelLoaders,
      },
    };

    await plugin.load();

    expect(addFieldInterfaces).toHaveBeenCalledWith([ChinaRegionFieldInterface]);
    expect(registerModelLoaders).toHaveBeenCalledWith({
      ChinaRegionFieldModel: {
        loader: expect.any(Function),
      },
      DisplayChinaRegionFieldModel: {
        loader: expect.any(Function),
      },
    });

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.ChinaRegionFieldModel.loader()).resolves.toHaveProperty(
      'ChinaRegionFieldModel',
      ChinaRegionFieldModel,
    );
    await expect(loaders.DisplayChinaRegionFieldModel.loader()).resolves.toHaveProperty(
      'DisplayChinaRegionFieldModel',
      DisplayChinaRegionFieldModel,
    );
  });

  it('defines the china region field schema and configuration', () => {
    const fieldInterface = new ChinaRegionFieldInterface();

    expect(fieldInterface).toMatchObject({
      name: 'chinaRegion',
      type: 'object',
      group: 'choices',
      order: 7,
      title: '{{t("China region")}}',
      isAssociation: true,
      availableTypes: ['belongsToMany'],
      default: {
        interface: 'chinaRegion',
        type: 'belongsToMany',
        target: 'chinaRegions',
        targetKey: 'code',
        sortBy: 'level',
        uiSchema: {
          type: 'array',
          'x-component': 'Cascader',
          'x-component-props': {
            changeOnSelectLast: false,
            labelInValue: true,
            maxLevel: 3,
            fieldNames: {
              label: 'name',
              value: 'code',
              children: 'children',
            },
          },
        },
      },
      filterable: {
        children: [
          {
            name: 'name',
            title: '{{t("Province/city/area name")}}',
            operators: 'string',
          },
        ],
      },
    });
    expect(fieldInterface.configure.items).toEqual([
      expect.objectContaining({
        name: 'uiSchema.x-component-props.maxLevel',
        component: 'Radio.Group',
        defaultValue: 3,
      }),
      expect.objectContaining({
        name: 'uiSchema.x-component-props.changeOnSelectLast',
        component: 'Checkbox',
      }),
    ]);
  });

  it('initializes relation keys without overwriting existing values', () => {
    const fieldInterface = new ChinaRegionFieldInterface();
    const emptyValues: Record<string, string> = {};
    const existingValues = {
      through: 'existing_through',
      foreignKey: 'existing_foreign',
      otherKey: 'existing_other',
      sourceKey: 'uuid',
      targetKey: 'code',
    };

    fieldInterface.initialize(emptyValues);
    fieldInterface.initialize(existingValues);

    expect(emptyValues).toEqual({
      through: 't_uid-1',
      foreignKey: 'f_uid-2',
      otherKey: 'f_uid-3',
      sourceKey: 'id',
      targetKey: 'id',
    });
    expect(existingValues).toEqual({
      through: 'existing_through',
      foreignKey: 'existing_foreign',
      otherKey: 'existing_other',
      sourceKey: 'uuid',
      targetKey: 'code',
    });
  });
});
