/**
 * defaultShowCode: true
 * title: 表单：国家与手机号交互（两个 JS 字段联动）
 */
import React from 'react';
import { Application, FilterManager, Plugin } from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import { registerJsFieldDemoModels } from './utils';

class DemoPlugin extends Plugin {
  form: any;
  async load() {
    this.flowEngine.flowSettings.enable();
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'profiles',
      title: 'Profiles',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID', interface: 'id' },
        { name: 'country', type: 'string', title: 'Country', interface: 'select' },
        { name: 'phone', type: 'string', title: 'Phone', interface: 'phone' },
      ],
    });

    await registerJsFieldDemoModels(this.flowEngine);

    this.form = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'profiles' } } },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              // 国家：选择 +86/+1/+49，变更时自动改写 phone 前缀
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'profiles', fieldPath: 'country' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'profiles', fieldPath: 'country' },
                      },
                      jsSettings: {
                        runJs: {
                          code: String.raw`
// 选择国家后自动设置手机号前缀
const map = { CN: '+86', US: '+1', DE: '+49' };
const current = String(ctx.getValue() ?? 'CN');
ctx.element.innerHTML = [
  '<select id="country" style="width:100%;padding:4px 8px">',
  '  <option value="CN" '+(current==='CN'?'selected':'')+'>中国 (+86)</option>',
  '  <option value="US" '+(current==='US'?'selected':'')+'>美国 (+1)</option>',
  '  <option value="DE" '+(current==='DE'?'selected':'')+'>德国 (+49)</option>',
  '</select>'
].join('');
const sel = document.getElementById('country');
sel?.addEventListener('change', ()=>{
  const c = sel.value; ctx.setValue(c);
  const prefix = map[c];
  const ph = String(ctx.form?.getFieldValue?.(['phone']) ?? '');
  // 去掉已有前缀并替换（仅空格，不匹配其它空白，避免转义）
  const norm = ph.replace(/^[+][0-9]+ */, '');
  ctx.form?.setFieldValue?.(['phone'], prefix + ' ' + norm);
});
                          `.trim(),
                        },
                      },
                    },
                  },
                },
              },
              // 手机号：受控输入，不做掩码，依赖国家选项自动改写前缀
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'profiles', fieldPath: 'phone' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'profiles', fieldPath: 'phone' },
                      },
                      jsSettings: {
                        runJs: {
                          code: `
const v = String(ctx.getValue() ?? '');
ctx.element.innerHTML = '<input id="ph" style="width:100%;padding:4px 8px" value="'+v.replace(/"/g,'&quot;')+'" />';
document.getElementById('ph')?.addEventListener('input', (e)=> ctx.setValue(String(e.target.value||'')) );
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
          <Card style={{ margin: 12 }} title="Profile（JS：国家与手机号联动）">
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
