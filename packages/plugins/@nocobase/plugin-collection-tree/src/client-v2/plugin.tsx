/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import type { CollectionTemplateField } from '@nocobase/client-v2';
import type { PluginDataSourceManagerClientV2 } from '@nocobase/plugin-data-source-manager/client-v2';

function getTreeCollectionFields(): CollectionTemplateField[] {
  return [
    {
      interface: 'integer',
      name: 'parentId',
      type: 'bigInt',
      title: '{{t("Parent ID")}}',
      isForeignKey: true,
      uiSchema: {
        'x-read-pretty': true,
      },
    },
    {
      interface: 'm2o',
      type: 'belongsTo',
      name: 'parent',
      title: '{{t("Parent")}}',
      foreignKey: 'parentId',
      treeParent: true,
      onDelete: 'CASCADE',
      componentProps: {
        multiple: false,
        fieldNames: {
          label: 'id',
          value: 'id',
        },
      },
    },
    {
      interface: 'o2m',
      type: 'hasMany',
      name: 'children',
      title: '{{t("Children")}}',
      foreignKey: 'parentId',
      treeChildren: true,
      onDelete: 'CASCADE',
      componentProps: {
        multiple: true,
        fieldNames: {
          label: 'id',
          value: 'id',
        },
      },
    },
  ];
}

function normalizeTreeCollectionSubmitValues(values: Record<string, any>) {
  if (!Array.isArray(values.fields)) {
    return;
  }

  values.fields = values.fields.map((field) => {
    if (!field.target && ['belongsToMany', 'belongsTo', 'hasMany', 'hasOne'].includes(field.type)) {
      return { ...field, target: values.name };
    }
    return field;
  });

  const primaryKey = values.fields.find((field) => field.primaryKey);
  const parentId = values.fields.find((field) => field.name === 'parentId' && field.isForeignKey);
  if (primaryKey && parentId) {
    const parentIdTitle = parentId.uiSchema?.title;
    parentId.interface = primaryKey.interface;
    parentId.type = primaryKey.type;
    parentId.uiSchema = structuredClone(primaryKey.uiSchema || {});
    parentId.uiSchema.title = parentIdTitle;
    parentId.autoFill = false;
  }
}

export class PluginCollectionTreeClientV2 extends Plugin<any, Application> {
  async load() {
    const dataSourceManager = (this.app.pm.get('@nocobase/plugin-data-source-manager') ||
      this.app.pm.get('data-source-manager')) as PluginDataSourceManagerClientV2 | undefined;

    dataSourceManager?.registerCollectionTemplate?.({
      name: 'tree',
      title: '{{t("Tree collection")}}',
      order: 24,
      color: 'blue',
      collection: {
        options: {
          template: 'tree',
          tree: 'adjacencyList',
        },
        fields: getTreeCollectionFields,
      },
      presetFields: {
        disabledIncludes: ['id'],
      },
      configure: {
        transformSubmitValues: normalizeTreeCollectionSubmitValues,
      },
    });
  }
}

export default PluginCollectionTreeClientV2;
