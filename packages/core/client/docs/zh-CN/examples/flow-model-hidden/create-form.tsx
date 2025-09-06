/**
 * defaultShowCode: true
 * title: CreateFormModel - hidden 简明示例
 */

import {
  Application,
  CreateFormModel,
  FormFieldGridModel,
  FormFieldModel,
  FormItemModel,
  FormSubmitActionModel,
  Plugin,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { APIClient } from '@nocobase/sdk';
import { Card, Space, Switch } from 'antd';
import React from 'react';
import { FilterManager } from '../../../../../client/src/flow/models/filter-blocks/filter-manager/FilterManager';

class DemoPlugin extends Plugin {
  form!: CreateFormModel;
  field!: FormItemModel;
  action!: FormSubmitActionModel;

  async load() {
    const api = new APIClient({
      baseURL: 'https://localhost:8000/api',
    });
    // 使用 enable，而非 forceEnable，确保页面开关可以关闭配置模式
    this.flowEngine.flowSettings.enable();
    this.flowEngine.context.defineProperty('api', { value: api });
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID' },
        { name: 'username', type: 'string', title: 'Username' },
      ],
    });

    this.flowEngine.registerModels({
      CreateFormModel,
      FormFieldGridModel,
      FormItemModel,
      FormFieldModel,
      FormSubmitActionModel,
    });

    this.form = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
      subModels: {
        grid: {
          use: 'FormFieldGridModel',
          subModels: {
            items: [
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'username' } },
                },
                subModels: {
                  field: {
                    use: 'FormFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'username' },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
        actions: [{ use: 'FormSubmitActionModel', stepParams: { buttonSettings: { general: { title: 'Submit' } } } }],
      },
    });

    this.field = this.form.subModels.grid.subModels.items[0] as unknown as FormItemModel;
    this.action = this.form.subModels.actions[0] as FormSubmitActionModel;

    // 简单提供 filterManager，避免刷新流程绑定时报错
    this.form.context.defineProperty('filterManager', { value: new FilterManager(this.form) });

    const Page = () => {
      const [cfg, setCfg] = React.useState(false);
      const [hideBlock, setHideBlock] = React.useState(false);
      const [hideField, setHideField] = React.useState(false);
      const [hideAction, setHideAction] = React.useState(false);
      return (
        <div style={{ padding: 16 }}>
          <div>
            <span>配置模式</span>
            <Switch
              checked={cfg}
              onChange={(v) => {
                setCfg(v);
                v ? this.flowEngine.flowSettings.enable() : this.flowEngine.flowSettings.disable();
              }}
            />
          </div>
          <Card style={{ marginTop: 12 }} title="表单区块（Block）">
            <div style={{ marginBottom: 8 }}>
              <span>隐藏区块</span>
              <Switch checked={hideBlock} onChange={(v) => (setHideBlock(v), this.form.setHidden(v))} />
            </div>
            <FlowModelRenderer model={this.form} showFlowSettings />
          </Card>
          <Card title="字段与动作（Field/Action）">
            <div style={{ marginBottom: 8 }}>
              <span>隐藏字段 username</span>
              <Switch checked={hideField} onChange={(v) => (setHideField(v), this.field.setHidden(v))} />
              <span>隐藏动作 Submit</span>
              <Switch checked={hideAction} onChange={(v) => (setHideAction(v), this.action.setHidden(v))} />
            </div>
            <FlowModelRenderer model={this.form} showFlowSettings />
          </Card>
        </div>
      );
    };

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <Page />
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
}).getRootComponent();
