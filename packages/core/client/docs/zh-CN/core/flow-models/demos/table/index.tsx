import { Plugin } from '@nocobase/client';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import actions from 'packages/plugins/@nocobase/plugin-workflow/src/server/actions';
import React from 'react';
import { createApp } from '../createApp';
import { FormItemModel } from '../form/form-item-model';
import { FormModel } from '../form/form-model';
import { SubmitActionModel } from '../form/submit-action-model';
import { ActionModel, DeleteActionModel, LinkActionModel } from './action-model';
import { dsm } from './data-source-manager';
import { TableColumnActionsModel, TableColumnModel } from './table-column-model';
import { TableModel } from './table-model';

class PluginDemo extends Plugin {
  async load() {
    this.flowEngine.setContext({ dsm });
    this.flowEngine.registerModels({
      DeleteActionModel,
      LinkActionModel,
      FormModel,
      FormItemModel,
      SubmitActionModel,
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
        actions: [
          {
            use: 'DeleteActionModel',
            stepParams: {
              default: {
                step1: {
                  title: 'Delete',
                },
              },
            },
          },
        ],
        columns: [
          {
            use: 'TableColumnActionsModel',
            subModels: {
              actions: [
                {
                  use: 'LinkActionModel',
                  stepParams: {
                    default: {
                      step1: {
                        title: 'View',
                      },
                    },
                  },
                },
                {
                  use: 'LinkActionModel',
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
