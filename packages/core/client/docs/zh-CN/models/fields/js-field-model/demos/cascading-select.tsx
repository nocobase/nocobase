/**
 * defaultShowCode: true
 * title: CreateForm + JSEditableFieldModel（级联下拉：父子联动）
 */

import React from 'react';
import {
  Application,
  CreateFormModel,
  FormGridModel,
  FormItemModel,
  JSEditableFieldModel,
  MockFlowModelRepository,
  Plugin,
  FilterManager,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { PluginFlowEngine } from '@nocobase/client';
import { APIClient } from '@nocobase/sdk';
import { Card } from 'antd';
import MockAdapter from 'axios-mock-adapter';

const bootstrapMock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);
  mock
    .onGet('roles:check')
    .reply(200, { data: { allowAll: true, resources: [], actions: {}, actionAlias: {}, strategy: {} } });

  const parents = [
    { value: 'p1', label: '数码' },
    { value: 'p2', label: '图书' },
  ];
  const children: Record<string, { value: string; label: string }[]> = {
    p1: [
      { value: 'p1-1', label: '手机' },
      { value: 'p1-2', label: '电脑' },
      { value: 'p1-3', label: '相机' },
    ],
    p2: [
      { value: 'p2-1', label: '文学' },
      { value: 'p2-2', label: '科技' },
      { value: 'p2-3', label: '少儿' },
    ],
  };

  mock.onGet('categories:parents').reply(200, { data: parents });
  mock.onGet('categories:children').reply((config) => {
    const pid = String((config as any).params?.parentId || '');
    return [200, { data: children[pid] || [] }];
  });
};

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jseditable-cascade:'));

    const api = new APIClient({ baseURL: 'https://localhost:8000/api' });
    bootstrapMock(api);
    this.flowEngine.context.defineProperty('api', { value: api });

    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'orders',
      title: 'Orders',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', interface: 'id', title: 'ID' },
        { name: 'parentId', type: 'string', interface: 'input', title: 'Parent Category' },
        { name: 'subId', type: 'string', interface: 'input', title: 'Sub Category' },
      ],
    });

    const form = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } } },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              // 父类选择（远程拉取）
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'parentId' } },
                  editItemSettings: {
                    initialValue: { defaultValue: 'p1' },
                  },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'parentId' },
                      },
                      jsSettings: {
                        runJs: {
                          code: `
ctx.element.innerHTML = '<select class="js-parent" style="width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px"></select>';
var el = ctx.element.querySelector('.js-parent');
var renderOptions = function(items) {
  var current = String(ctx.getValue() == null ? '' : ctx.getValue());
  var list = Array.isArray(items) ? items : [];
  el.innerHTML = list.map(function(it){ return '<option value="' + it.value + '">' + it.label + '</option>'; }).join('');
  if (current) {
    el.value = current;
  } else if (list.length) {
    var first = String(list[0].value);
    el.value = first;
    ctx.setValue(first);
  }
};
var loadParents = async function(){
  el.innerHTML = '<option>加载中...</option>';
  try { var res = await ctx.api.request({ url: 'categories:parents', method: 'get', params: {} }); var items = (res && res.data) || []; renderOptions(Array.isArray(items) ? items : (items.data || [])); } catch(e) { renderOptions([]); }
};
el && el.addEventListener('change', function(e){ ctx.setValue(e.target.value); });
ctx.element.addEventListener('js-field:value-change', function(ev){ if (el) el.value = String(ev.detail == null ? '' : ev.detail); });
loadParents();
                          `.trim(),
                        },
                      },
                    },
                  },
                },
              },
              // 子类选择（根据 parentId 联动）
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'subId' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'subId' } },
                      jsSettings: {
                        runJs: {
                          code: `
ctx.element.innerHTML = '<select class="js-sub" style="width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px"></select>';
var el = ctx.element.querySelector('.js-sub');
var renderOptions = function(items) {
  var current = String(ctx.getValue() == null ? '' : ctx.getValue());
  el.innerHTML = (Array.isArray(items) ? items : []).map(function(it){ return '<option value="' + it.value + '">' + it.label + '</option>'; }).join('');
  if (current) el.value = current;
};
var loadChildren = async function(parentId){
  el.innerHTML = '<option>加载中...</option>';
  try { var res = await ctx.api.request({ url: 'categories:children', method: 'get', params: { parentId: parentId || '' } }); var items = (res && res.data) || []; renderOptions(Array.isArray(items) ? items : (items.data || [])); } catch(e) { renderOptions([]); }
};
var getParent = function(){ try { return ctx.form && ctx.form.getFieldValue ? ctx.form.getFieldValue('parentId') : undefined; } catch(e) { return undefined; } };
el && el.addEventListener('change', function(e){ ctx.setValue(e.target.value); });
ctx.element.addEventListener('js-field:value-change', function(ev){ if (el) el.value = String(ev.detail == null ? '' : ev.detail); });
// 通过实例 Flow 监听表单变更并联动加载子类
var registerCascadeFlow = function(){
  if (!ctx.blockModel || !ctx.model) return;
  var flowKey = 'js-cascade-sub-' + ctx.model.uid;
  try {
    ctx.blockModel.registerFlow(flowKey, {
      title: '子类联动监听',
      on: 'formValuesChange',
      steps: {
        reload: {
          async handler(flowCtx) {
            var form = flowCtx.form;
            var parentValue;
            try {
              parentValue = form && form.getFieldValue ? form.getFieldValue('parentId') : undefined;
            } catch (err) {
              parentValue = undefined;
            }
            await loadChildren(parentValue);
          },
        },
      },
    });
  } catch (err) {
    // 忽略注册异常
  }
};
registerCascadeFlow();
// 初次加载
loadChildren(getParent());
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
      },
    });

    const filterMgr: any = (() => {
      try {
        return new FilterManager(form);
      } catch (e) {
        return { bindToTarget() {} } as any;
      }
    })();
    form.context.defineProperty('filterManager', { value: filterMgr });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="CreateForm + JSEditableField（级联下拉）">
              <FlowModelRenderer model={form} showFlowSettings />
            </Card>
          </div>
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginFlowEngine, DemoPlugin],
}).getRootComponent();
