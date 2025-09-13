/**
 * defaultShowCode: true
 * title: 表单：开始/结束日期互相约束（两个 JS 字段联动）
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
      name: 'events',
      title: 'Events',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID', interface: 'id' },
        { name: 'start', type: 'string', title: 'Start', interface: 'date' },
        { name: 'end', type: 'string', title: 'End', interface: 'date' },
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
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'events' } } },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              // 开始日期：若结束 < 开始，则强制把结束设为开始
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'events', fieldPath: 'start' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'events', fieldPath: 'start' } },
                      jsSettings: {
                        runJs: {
                          code: `
const v = String(ctx.getValue() ?? '');
ctx.element.innerHTML = '<input id="s" type="date" value="'+v+'" />';
const s = document.getElementById('s');
s?.addEventListener('change', ()=>{
  ctx.setValue(s.value);
  const end = String(ctx.form?.getFieldValue?.(['end']) || '');
  if(end && s.value && end < s.value){ ctx.form?.setFieldValue?.(['end'], s.value); }
});
                          `.trim(),
                        },
                      },
                    },
                  },
                },
              },
              // 结束日期：强制 end >= start
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'events', fieldPath: 'end' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'events', fieldPath: 'end' } },
                      jsSettings: {
                        runJs: {
                          code: `
const v = String(ctx.getValue() ?? '');
ctx.element.innerHTML = '<input id="e" type="date" value="'+v+'" />';
const e = document.getElementById('e');
e?.addEventListener('change', ()=>{
  const start = String(ctx.form?.getFieldValue?.(['start']) || '');
  if(e.value && start && e.value < start){ e.value = start; }
  ctx.setValue(e.value);
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
          <Card style={{ margin: 12 }} title="Event（JS：开始/结束日期联动）">
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
