/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { ForeignKeyConfigureField } from '../components/ForeignKeyConfigureField';
import { MBMFieldInterface, PluginM2MArrayClient } from '../index';

describe('MBMFieldInterface', () => {
  it('registers the many-to-many array field interface', async () => {
    const addFieldInterfaces = vi.fn();
    const plugin = Object.create(PluginM2MArrayClient.prototype) as PluginM2MArrayClient & {
      app: {
        addFieldInterfaces: typeof addFieldInterfaces;
      };
    };
    plugin.app = {
      addFieldInterfaces,
    };

    await plugin.load();

    expect(addFieldInterfaces).toHaveBeenCalledWith([MBMFieldInterface]);
  });

  it('defines the many-to-many array field schema and configuration', () => {
    const fieldInterface = new MBMFieldInterface();

    expect(fieldInterface).toMatchObject({
      name: 'mbm',
      type: 'object',
      group: 'relation',
      order: 6,
      isAssociation: true,
      default: {
        type: 'belongsToArray',
        uiSchema: {
          'x-component': 'AssociationField',
          'x-component-props': {
            multiple: true,
          },
        },
      },
      availableTypes: ['belongsToArray'],
      validationType: 'object',
      filterable: {
        nested: true,
        children: [],
      },
    });
    expect(fieldInterface.configure.items).toEqual([
      expect.objectContaining({
        name: 'source',
        component: 'SourceCollection',
        layout: { row: 'collections', column: 'source', span: 12 },
      }),
      expect.objectContaining({
        name: 'target',
        component: 'Select',
        required: true,
        disabled: '{{ !createOnly }}',
      }),
      expect.objectContaining({
        name: 'foreignKey',
        Component: ForeignKeyConfigureField,
        required: true,
        defaultValue: '{{ useNewId("f_") }}',
      }),
      expect.objectContaining({
        name: 'targetKey',
        component: 'TargetKey',
        required: true,
        disabled: '{{ !createOnly }}',
      }),
    ]);
  });
});
