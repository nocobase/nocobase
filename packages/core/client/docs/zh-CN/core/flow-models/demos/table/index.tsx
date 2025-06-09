import { Plugin } from '@nocobase/client';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';
import { createApp } from '../createApp';
import { FormItemModel } from '../form/form-item-model';
import { FormModel } from '../form/form-model';
import { ActionModel } from './action-model';
import { TableColumnActionsModel, TableColumnModel } from './table-column-model';
import { TableModel } from './table-model';

class PluginDemo extends Plugin {
  async load() {
    this.flowEngine.registerModels({
      FormModel,
      FormItemModel,
      ActionModel,
      TableModel,
      TableColumnModel,
      TableColumnActionsModel,
    });
    const model = this.flowEngine.createModel({
      use: 'TableModel',
      stepParams: {
        default: {
          step1: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
        },
      },
      subModels: {
        columns: [
          {
            use: 'TableColumnActionsModel',
            subModels: {
              actions: [
                {
                  use: 'ActionModel',
                  stepParams: {
                    default: {
                      step1: {
                        title: 'View',
                      },
                    },
                  },
                },
                {
                  use: 'ActionModel',
                  stepParams: {
                    default: {
                      step1: {
                        title: 'Edit',
                      },
                    },
                  },
                },
              ],
            },
          },
          {
            use: 'TableColumnModel',
            stepParams: {
              default: {
                step1: {
                  fieldPath: 'main.users.username',
                },
              },
            },
          },
        ],
      },
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

export default createApp({ plugins: [PluginDemo] });
