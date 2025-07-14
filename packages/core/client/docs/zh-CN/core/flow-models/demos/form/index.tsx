import { Plugin } from '@nocobase/client';
import { FlowModelRenderer } from '@nocobase/flow-engine';
import React from 'react';
import { createApp } from '../createApp';
import { dsm } from '../table/data-source-manager';
import { ActionModel } from './action-model';
import { FormItemModel } from './form-item-model';
import { FormModel } from './form-model';
import { SubmitActionModel } from './submit-action-model';

class PluginDemo extends Plugin {
  async load() {
    this.flowEngine.context.defineProperty('dsm', {
      value: dsm,
    });
    this.flowEngine.registerModels({
      FormModel,
      FormItemModel,
      ActionModel,
      SubmitActionModel,
    });
    const model = this.flowEngine.createModel({
      use: 'FormModel',
      stepParams: {
        default: {
          step1: {
            dataSourceKey: 'main',
            collectionName: 'users',
          },
        },
      },
      subModels: {
        fields: [
          {
            use: 'FormItemModel',
            stepParams: {
              default: {
                step1: {
                  fieldPath: 'main.users.username',
                },
              },
            },
          },
          {
            use: 'FormItemModel',
            stepParams: {
              default: {
                step1: {
                  fieldPath: 'main.users.nickname',
                },
              },
            },
          },
        ],
        actions: [
          {
            use: 'SubmitActionModel',
          },
        ],
      },
    });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} inputArgs={{ filterByTk: 1 }} />,
    });
  }
}

export default createApp({ plugins: [PluginDemo] });
