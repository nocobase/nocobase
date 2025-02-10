/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { reject, orderBy } from 'lodash';

class PluginDataSourceMainClient extends Plugin {
  collectionPresetFields: { order: number; value: any }[] = [];
  addCollectionPresetField(config) {
    this.collectionPresetFields.push(config);
  }
  removeCollectionPresetField(name) {
    this.collectionPresetFields = reject(this.collectionPresetFields, (v) => v.value.name === name);
  }
  getCollectionPresetFields() {
    return orderBy(this.collectionPresetFields, ['order'], ['asc']);
  }
  async load() {
    this.addCollectionPresetField({
      order: 1,
      description: '{{t("Primary key, unique identifier, self growth") }}',
      value: {
        name: 'id',
        type: 'bigInt',
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        uiSchema: {
          type: 'number',
          title: '{{t("ID")}}',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
        interface: 'integer',
      },
    });
    this.addCollectionPresetField({
      order: 2,
      description: '{{t("Store the creation time of each record")}}',
      value: {
        name: 'createdAt',
        interface: 'createdAt',
        type: 'date',
        field: 'createdAt',
        uiSchema: {
          type: 'datetime',
          title: '{{t("Created at")}}',
          'x-component': 'DatePicker',
          'x-component-props': {},
          'x-read-pretty': true,
        },
      },
    });
    this.addCollectionPresetField({
      order: 3,
      description: '{{t("Primary key, unique identifier, self growth") }}',
      value: {
        name: 'createdBy',
        interface: 'createdBy',
        type: 'belongsTo',
        target: 'users',
        foreignKey: 'createdById',
        uiSchema: {
          type: 'object',
          title: '{{t("Created by")}}',
          'x-component': 'AssociationField',
          'x-component-props': {
            fieldNames: {
              value: 'id',
              label: 'nickname',
            },
          },
          'x-read-pretty': true,
        },
      },
    });
    this.addCollectionPresetField({
      order: 4,
      description: '{{t("Store the last update time of each record")}}',
      value: {
        type: 'date',
        field: 'updatedAt',
        name: 'updatedAt',
        interface: 'updatedAt',
        uiSchema: {
          type: 'datetime',
          title: '{{t("Last updated at")}}',
          'x-component': 'DatePicker',
          'x-component-props': {},
          'x-read-pretty': true,
        },
      },
    });
    this.addCollectionPresetField({
      order: 5,
      description: '{{t("Store the last update user of each record")}}',
      value: {
        type: 'belongsTo',
        target: 'users',
        foreignKey: 'updatedById',
        name: 'updatedBy',
        interface: 'updatedBy',
        uiSchema: {
          type: 'object',
          title: '{{t("Last updated by")}}',
          'x-component': 'AssociationField',
          'x-component-props': {
            fieldNames: {
              value: 'id',
              label: 'nickname',
            },
          },
          'x-read-pretty': true,
        },
      },
    });
  }
}

export default PluginDataSourceMainClient;
