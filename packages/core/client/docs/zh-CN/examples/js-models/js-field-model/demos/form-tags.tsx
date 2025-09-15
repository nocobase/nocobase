/**
 * moved to examples/js-field-model
 * defaultShowCode: true
 * title: 表单：标签输入（JSEditableFieldModel，数组值）
 */
import React from 'react';
import { Application, FilterManager, Plugin } from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { api } from './api';
import { Card } from 'antd';
import { registerJsFieldDemoModels } from './utils';

class DemoPlugin extends Plugin {
  form: any;
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    // 注入 APIClient，确保资源创建/请求走 mock 基地址
    this.flowEngine.context.defineProperty('api', { value: api });
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID' },
        { name: 'tags', type: 'json', title: 'Tags' },
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
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'tags' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'tags' } },
                      jsSettings: {
                        runJs: {
                          code: `
// 轻量标签：Enter 添加、点击删除，保存为数组
const arr = Array.isArray(ctx.getValue()) ? ctx.getValue() : [];
ctx.element.innerHTML = [
  '<div>',
  '  <div id="chips" style="margin-bottom:6px"></div>',
  '  <input id="ipt" style="width:100%;padding:4px 8px" placeholder="输入后回车添加" />',
  '</div>'
].join('');
const chips = ctx.element.querySelector('#chips');
const ipt = ctx.element.querySelector('#ipt');
function render(){ chips.innerHTML = (ctx.getValue()||[]).map((t,i)=> '<span data-i="'+i+'" style="display:inline-block;margin:2px;padding:2px 6px;background:#f5f5f5;border-radius:10px;cursor:pointer">'+t+' ✕</span>').join(''); Array.from(chips.children).forEach(el=> el.addEventListener('click',()=>{ const i = Number(el.getAttribute('data-i')); const a = (ctx.getValue()||[]).slice(); a.splice(i,1); ctx.setValue(a); render(); })); }
ctx.setValue(arr); render();
ipt?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); const v = ipt.value.trim(); if(v){ const a = (ctx.getValue()||[]).slice(); a.push(v); ctx.setValue(a); ipt.value=''; render(); } } });
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
          <Card style={{ margin: 12 }} title="Create User（JS 可编辑：标签输入）">
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
