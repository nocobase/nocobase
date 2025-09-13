/**
 * defaultShowCode: true
 * title: 表单：日期区间（JSEditableFieldModel，JSON 值）
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
        { name: 'period', type: 'json', title: 'Period', interface: 'json' },
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
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'period' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'period' } },
                      jsSettings: {
                        runJs: {
                          code: `
// 两个日期输入，保存值 {start, end}
const val = ctx.getValue() || {}; const start = val.start || ''; const end = val.end || '';
ctx.element.innerHTML = [
  '<div style="display:flex;gap:8px;align-items:center">',
  '  <input id="d1" type="date" value="'+start+'" />',
  '  <span>~</span>',
  '  <input id="d2" type="date" value="'+end+'" />',
  '</div>'
].join('');
const d1 = document.getElementById('d1'); const d2 = document.getElementById('d2');
function sync(){ ctx.setValue({ start: d1.value || null, end: d2.value || null }); }
d1?.addEventListener('change', sync); d2?.addEventListener('change', sync);
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
          <Card style={{ margin: 12 }} title="Create User（JS 可编辑：日期区间）">
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
