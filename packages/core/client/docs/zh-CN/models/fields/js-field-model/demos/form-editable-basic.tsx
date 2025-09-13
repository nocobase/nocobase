/**
 * defaultShowCode: true
 * title: 表单：自定义可编辑输入（JSEditableFieldModel）
 */
import React from 'react';
import { Application, FilterManager, Plugin } from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import { registerJsFieldDemoModels } from './utils';

class DemoPlugin extends Plugin {
  form: any;
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID', interface: 'id' },
        { name: 'name', type: 'string', title: 'Name', interface: 'input' },
        { name: 'code', type: 'string', title: 'Code', interface: 'input' },
      ],
    });

    await registerJsFieldDemoModels(this.flowEngine);

    this.form = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              // Name：不写 JS → 默认 Input
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'name' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'name' } },
                      // 未提供 jsSettings → 默认渲染 Input
                    },
                  },
                },
              },
              // Code：JS 自定义输入（大写掩码 + 长度限制 + 提示）
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'code' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'code' } },
                      jsSettings: {
                        runJs: {
                          code: `
// 自定义输入：自动大写 + 长度限制 8 + 实时提示
const v = String(ctx.getValue() ?? '');
ctx.element.innerHTML = [
  '<div>',
  '  <input id="js-code" style="width:100%;padding:4px 8px" value="' + v.replace(/"/g, '&quot;') + '" />',
  '  <div style="color:#999;font-size:12px;margin-top:6px">长度 ≤ 8，自动大写</div>',
  '</div>'
].join('');
const el = document.getElementById('js-code');
el?.addEventListener('input', (e) => {
  const next = String(e.target.value || '').toUpperCase().slice(0, 8);
  if (next !== e.target.value) e.target.value = next;
  ctx.setValue(next);
});
                          `.trim(),
                        },
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

    this.form.context.defineProperty('filterManager', { value: new FilterManager(this.form) });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <Card style={{ margin: 12 }} title="Create User（JS 可编辑字段：Code）">
            <FlowModelRenderer model={this.form} showFlowSettings />
          </Card>
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
}).getRootComponent();
