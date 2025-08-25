/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { orderBy, reject } from 'lodash';

type PresetFieldConfig = {
  order: number; // 定义字段的顺序。
  description: string; // 字段描述
  value: {
    name: string;
    interface: string;
    type: string;
    uiSchema: Record<string, any>;
    field?: string;
    [T: string]: any;
  };
};
class PluginDataSourceMainClient extends Plugin {
  collectionPresetFields: { order: number; value: any }[] = [];
  addCollectionPresetField(config: PresetFieldConfig) {
    this.collectionPresetFields.push(config);
  }
  removeCollectionPresetField(fieldName: string) {
    this.collectionPresetFields = reject(this.collectionPresetFields, (v) => v.value.name === fieldName);
  }
  getCollectionPresetFields() {
    return orderBy(this.collectionPresetFields, ['order'], ['asc']);
  }
  async load() {
    this.addCollectionPresetField({
      order: 100,
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
        interface: 'id',
      },
    });
    this.addCollectionPresetField({
      order: 200,
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
      order: 300,
      description: '{{t("Store the creation user of each record") }}',
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
      order: 400,
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
      order: 500,
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
