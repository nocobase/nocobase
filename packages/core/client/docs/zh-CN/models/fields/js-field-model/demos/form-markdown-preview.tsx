/**
 * defaultShowCode: true
 * title: 表单：Markdown 实时预览（JSEditableFieldModel）
 */
import React from 'react';
import {
  Application,
  CreateFormModel,
  FilterManager,
  FormGridModel,
  FormItemModel,
  FormSubmitActionModel,
  JSEditableFieldModel,
  Plugin,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import {
  InputFieldModel,
  NumberFieldModel,
  SelectFieldModel,
  DateTimeFieldModel,
  JsonFieldModel,
  TextareaFieldModel,
  PasswordFieldModel,
  ColorFieldModel,
  TimeFieldModel,
  UploadFieldModel,
  FormCustomItemModel,
  MarkdownItemModel,
  DividerItemModel,
  FormJavaScriptFieldEntryModel,
} from '@nocobase/client';
import { Card } from 'antd';

// 安全注册模型：过滤掉 undefined，避免 registerModels 因无效值报错
function registerModelsSafe(engine: any, models: Record<string, any>) {
  const filtered = Object.fromEntries(Object.entries(models).filter(([, v]) => !!v));
  engine.registerModels(filtered);
}

class DemoPlugin extends Plugin {
  form: CreateFormModel;
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

    registerModelsSafe(this.flowEngine, {
      CreateFormModel,
      FormGridModel,
      FormItemModel,
      JSEditableFieldModel,
      FormSubmitActionModel,
      InputFieldModel,
      NumberFieldModel,
      SelectFieldModel,
      DateTimeFieldModel,
      JsonFieldModel,
      TextareaFieldModel,
      PasswordFieldModel,
      ColorFieldModel,
      TimeFieldModel,
      UploadFieldModel,
      FormCustomItemModel,
      MarkdownItemModel,
      DividerItemModel,
      FormJavaScriptFieldEntryModel,
    });

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
// 简易 Markdown 预览（**、__、\n），用于演示
const src = String(ctx.getValue() ?? '');
function md(s){
  return s
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
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
const mk = document.getElementById('mk');
const pv = document.getElementById('pv');
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
    }) as CreateFormModel;

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
