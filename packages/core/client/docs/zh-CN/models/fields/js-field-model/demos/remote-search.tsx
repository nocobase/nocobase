/**
 * defaultShowCode: true
 * title: CreateForm + JSEditableFieldModel（远程搜索-防抖）
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

  const all = [
    { value: '1', label: '电子产品' },
    { value: '2', label: '图书音像' },
    { value: '3', label: '家居家装' },
    { value: '4', label: '运动户外' },
    { value: '5', label: '美妆个护' },
    { value: '6', label: '食品生鲜' },
  ];
  mock.onGet('categories:search').reply((config) => {
    const q = String((config as any).params?.q || '').toLowerCase();
    const data = q ? all.filter((x) => x.label.toLowerCase().includes(q) || String(x.value).includes(q)) : all;
    return [200, { data }];
  });
};

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jseditable-remote-search:'));

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
        { name: 'categoryId', type: 'string', interface: 'input', title: 'Category' },
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
              // 远程搜索 + 选择结果（最终写入 categoryId）
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'categoryId' } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'categoryId' },
                      },
                      jsSettings: {
                        runJs: {
                          code: `
// 结构：输入关键词 -> 防抖搜索 -> 渲染下方下拉框 -> 选择写回值
ctx.element.innerHTML =
  '<div style="display:flex;gap:8px;align-items:center;width:100%">' +
  '  <input class="js-keyword" placeholder="输入关键词搜索" style="flex:1;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px" />' +
  '</div>' +
  '<div style="margin-top:8px">' +
  '  <select class="js-results" style="width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px"></select>' +
  '</div>';

var inputEl = ctx.element.querySelector('.js-keyword');
var selectEl = ctx.element.querySelector('.js-results');

// 简单防抖
var debounce = function(fn, delay) {
  var timer = null; return function() { var args = arguments, self = this; clearTimeout(timer); timer = setTimeout(function(){ fn.apply(self, args); }, delay); };
};

var renderOptions = function(items) {
  var current = String(ctx.getValue() == null ? '' : ctx.getValue());
  selectEl.innerHTML = (Array.isArray(items) ? items : []).map(function(it){
    return '<option value="' + it.value + '">' + it.label + '</option>';
  }).join('');
  if (current) selectEl.value = current;
};

var doSearch = async function(keyword) {
  selectEl.innerHTML = '<option>搜索中...</option>';
  try {
    var res = await ctx.api.request({ url: 'categories:search', method: 'get', params: { q: keyword || '' } });
    var items = (res && res.data) || [];
    renderOptions(Array.isArray(items) ? items : (items.data || []));
  } catch (e) {
    renderOptions([]);
  }
};

// 交互绑定
inputEl && inputEl.addEventListener('input', debounce(function(e){ doSearch(e.target.value); }, 300));
selectEl && selectEl.addEventListener('change', function(e){ ctx.setValue(e.target.value); });
ctx.element.addEventListener('js-field:value-change', function(ev){ if (selectEl) selectEl.value = String(ev.detail == null ? '' : ev.detail); });

// 初次加载
doSearch('');
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
            <Card title="CreateForm + JSEditableField（远程搜索-防抖）">
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
