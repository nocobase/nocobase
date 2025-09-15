/**
 * moved to examples/js-field-model
 * defaultShowCode: true
 * title: 表单：远程建议（JSEditableFieldModel + mock REST）
 */
import React from 'react';
import { Application, FilterManager, Plugin } from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import { api } from './api';
import { registerJsFieldDemoModels } from './utils';

class DemoPlugin extends Plugin {
  form: any;
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.context.defineProperty('api', { value: api });
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID', interface: 'id' },
        { name: 'name', type: 'string', title: 'Name', interface: 'input' },
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
                      jsSettings: {
                        runJs: {
                          code: String.raw`
// 输入时调用 /suggest，渲染下拉建议列表
const v = String(ctx.getValue() ?? '');
ctx.element.innerHTML = [
  '<div>',
  '  <input id="ipt" style="width:100%;padding:4px 8px" value="' + v.replace(/"/g, '&quot;') + '" />',
  '  <ul id="suggest" style="list-style:none;padding-left:0;margin:6px 0 0"></ul>',
  '</div>'
].join('');
const ipt = ctx.element.querySelector('#ipt');
const ul = ctx.element.querySelector('#suggest');
ipt?.addEventListener('input', async () => {
  ctx.setValue(String(ipt.value || ''));
  try{
    const { data } = await ctx.api.axios.get('/suggest', { params: { keyword: ipt.value } });
    const items = (data?.items || []).slice(0,6);
    ul.innerHTML = items.map(x => '<li style="padding:2px 4px;cursor:pointer;">'+x+'</li>').join('');
    Array.from(ul.children).forEach((li) => li.addEventListener('click', () => { ipt.value = li.textContent; ctx.setValue(li.textContent); ul.innerHTML=''; }));
  }catch(e){ ul.innerHTML=''; }
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
          <Card style={{ margin: 12 }} title="Create User（JS 可编辑：远程建议）">
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
