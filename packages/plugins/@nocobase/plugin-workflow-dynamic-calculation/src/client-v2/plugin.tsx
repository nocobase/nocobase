/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getOptions } from '@nocobase/evaluators/client';
import { Application, Plugin } from '@nocobase/client-v2';
import type { PluginDataSourceManagerClientV2 } from '@nocobase/plugin-data-source-manager/client-v2';
import { tExpr } from './locale';

export default class PluginWorkflowDynamicCalculationClientV2 extends Plugin<any, Application> {
  async load() {
    const dataSourceManager = (this.app.pm.get('@nocobase/plugin-data-source-manager') ||
      this.app.pm.get('data-source-manager')) as PluginDataSourceManagerClientV2 | undefined;

    dataSourceManager?.registerCollectionTemplate?.({
      name: 'expression',
      title: tExpr('Expression collection'),
      order: 60,
      color: 'orange',
      collection: {
        options: {
          template: 'expression',
          createdBy: true,
          updatedBy: true,
          createdAt: true,
          updatedAt: true,
        },
        fields: [
          {
            name: 'engine',
            type: 'string',
            interface: 'radioGroup',
            uiSchema: {
              type: 'string',
              title: tExpr('Calculation engine'),
              'x-component': 'Radio.Group',
              enum: getOptions(),
              default: 'formula.js',
            },
          },
          {
            name: 'sourceCollection',
            type: 'string',
            interface: 'select',
            uiSchema: {
              type: 'string',
              title: tExpr('Collection'),
              'x-component': 'CollectionSelect',
              'x-component-props': {},
            },
          },
          {
            name: 'expression',
            type: 'text',
            interface: 'expression',
            uiSchema: {
              type: 'string',
              title: tExpr('Expression'),
              'x-component': 'DynamicExpression',
            },
          },
        ],
      },
      fieldInterfaces: {
        include: [],
      },
    });
  }
}
