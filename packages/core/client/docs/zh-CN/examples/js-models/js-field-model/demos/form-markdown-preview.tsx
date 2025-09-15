/**
 * moved to examples/js-field-model
 * defaultShowCode: true
 * title: 表单：Markdown 实时预览（JSEditableFieldModel）
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
        { name: 'bio', type: 'string', title: 'Bio', interface: 'markdown' },
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
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'bio' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'bio' } },
                      jsSettings: {
                        runJs: {
                          code: String.raw`
// 简易 Markdown 预览（支持 **、__、标题、\n）用于演示
const src = String(ctx.getValue() ?? '');
function md(s){
  // 基础转义，避免 XSS
  const esc = String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  // 极简语法：标题（#~######）、加粗、斜体、换行
  return esc
    // 标题，按从长到短匹配，确保优先级
    .replace(/^######\s+(.*)$/gm,'<h6>$1</h6>')
    .replace(/^#####\s+(.*)$/gm,'<h5>$1</h5>')
    .replace(/^####\s+(.*)$/gm,'<h4>$1</h4>')
    .replace(/^###\s+(.*)$/gm,'<h3>$1</h3>')
    .replace(/^##\s+(.*)$/gm,'<h2>$1</h2>')
    .replace(/^#\s+(.*)$/gm,'<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
    .replace(/__(.*?)__/g,'<i>$1</i>')
    .replace(/\n/g,'<br/>');
}
ctx.element.innerHTML = [
  '<div style="display:flex;gap:12px">',
  '  <textarea id="mk" style="width:50%;height:120px">'+ src.replace(/</g,'&lt;').replace(/>/g,'&gt;') +'</textarea>',
  '  <div id="pv" style="width:50%;padding:8px;border:1px solid #eee;border-radius:6px;min-height:120px"></div>',
  '</div>'
].join('');
const mk = ctx.element.querySelector('#mk');
const pv = ctx.element.querySelector('#pv');
pv.innerHTML = md(src);
mk?.addEventListener('input', ()=> { ctx.setValue(mk.value); pv.innerHTML = md(mk.value); });
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
          <Card style={{ margin: 12 }} title="Create User（JS 可编辑：Markdown 预览）">
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
