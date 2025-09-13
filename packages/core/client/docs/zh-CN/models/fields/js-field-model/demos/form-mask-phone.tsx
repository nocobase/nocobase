/**
 * defaultShowCode: true
 * title: 表单：手机号掩码输入（JSEditableFieldModel）
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
        { name: 'phone', type: 'string', title: 'Phone', interface: 'phone' },
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
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'phone' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'phone' } },
                      jsSettings: {
                        runJs: {
                          code: String.raw`
// 掩码：只允许数字，格式 3-4-4，自动插入 '-'
const raw = String(ctx.getValue() ?? '');
function formatDigits(s){ return s.replace(/\D/g,'').slice(0,11); }
function mask(s){ const d = formatDigits(s); return d.replace(/(\d{3})(\d{0,4})(\d{0,4}).*/, (m,a,b,c)=> a + (b?'-'+b:'') + (c?'-'+c:'') ); }
ctx.element.innerHTML = '<input id="ph" style="width:100%;padding:4px 8px" value="'+ mask(raw).replace(/"/g,'&quot;') +'" />';
const inp = document.getElementById('ph');
inp?.addEventListener('input',()=>{ const m = mask(inp.value); if(m!==inp.value) inp.value = m; ctx.setValue(m); });
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
          <Card style={{ margin: 12 }} title="Create User（JS 可编辑：手机号掩码）">
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
