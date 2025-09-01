/**
 * defaultShowCode: true
 * title: 错误回退 - CreateForm 自动流异常
 */

import React from 'react';
import {
  Application,
  Plugin,
  CreateFormModel,
  FormFieldGridModel,
  CollectionFieldFormItemModel,
  FormFieldModel,
} from '@nocobase/client';
import { APIClient } from '@nocobase/sdk';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import { FilterManager } from '../../../../../../client/src/flow/models/filter-blocks/filter-manager/FilterManager';

class DemoPlugin extends Plugin {
  form!: CreateFormModel;

  async load() {
    // 提供 api（用于 ErrorFallback 的“下载日志”按钮）
    const api = new APIClient({ baseURL: 'https://localhost:8000/api' });
    this.flowEngine.context.defineProperty('api', { value: api });

    // 强制开启配置模式（demo 场景下始终展示 FlowSettings）
    this.flowEngine.flowSettings.forceEnable();

    // 准备数据源与集合
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'posts',
      title: 'Posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID' },
        { name: 'title', type: 'string', title: 'Title' },
      ],
    });

    this.flowEngine.registerModels({
      CreateFormModel,
      FormFieldGridModel,
      CollectionFieldFormItemModel,
      FormFieldModel,
    });

    this.form = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'posts' } } },
      subModels: {
        grid: {
          use: 'FormFieldGridModel',
          subModels: {
            items: [
              {
                use: 'CollectionFieldFormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'posts', fieldPath: 'title' } },
                },
                subModels: {
                  field: {
                    use: 'FormFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'posts', fieldPath: 'title' } },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    });

    // 在该表单实例上注册一个会在自动流阶段抛错的流程
    this.form.registerFlow({
      key: 'throwOnInit',
      sort: 1,
      steps: {
        init: {
          async handler() {
            throw new Error('Demo: 自动流执行失败（throwOnInit）');
          },
        },
      },
    });

    // 避免某些内部流程依赖缺失
    this.form.context.defineProperty('filterManager', { value: new FilterManager(this.form) });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="CreateForm 自动流异常演示" style={{ marginTop: 12 }}>
              <FlowModelRenderer model={this.form} showFlowSettings showErrorFallback />
            </Card>
          </div>
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
}).getRootComponent();
