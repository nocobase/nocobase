/**
 * defaultShowCode: true
 * title: 表单：异步校验（JSEditableFieldModel + mock REST）
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
import { api } from './api';

// 安全注册模型：过滤掉 undefined，避免 registerModels 因无效值报错
function registerModelsSafe(engine: any, models: Record<string, any>) {
  const filtered = Object.fromEntries(Object.entries(models).filter(([, v]) => !!v));
  engine.registerModels(filtered);
}

class DemoPlugin extends Plugin {
  form: CreateFormModel;
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
        { name: 'code', type: 'string', title: 'Code', interface: 'input' },
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
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'code' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'code' } },
                      jsSettings: {
                        runJs: {
                          code: String.raw`
// 失焦后调用 /validate-code 校验
const val = String(ctx.getValue() ?? '');
ctx.element.innerHTML = [
  '<div>',
  '  <input id="code" style="width:100%;padding:4px 8px" value="' + val.replace(/"/g, '&quot;') + '" />',
  '  <div id="msg" style="font-size:12px;margin-top:6px;color:#999">仅允许大写字母与数字，长度 4-8</div>',
  '</div>'
].join('');
const input = document.getElementById('code');
const msg = document.getElementById('msg');
input?.addEventListener('input', (e) => ctx.setValue(String(e.target.value || '')));
input?.addEventListener('blur', async () => {
  try{
    const { data } = await ctx.api.axios.post('/validate-code', { value: input.value });
    if(data.valid){ msg.style.color = '#52c41a'; msg.textContent = '可用'; }
    else{ msg.style.color = '#ff4d4f'; msg.textContent = data.message || '不可用'; }
  }catch(e){ msg.style.color = '#ff4d4f'; msg.textContent = '校验失败'; }
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
    }) as CreateFormModel;

    this.form.context.defineProperty('filterManager', { value: new FilterManager(this.form) });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <Card style={{ margin: 12 }} title="Create User（JS 可编辑：异步校验）">
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
