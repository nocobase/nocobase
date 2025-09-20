/**
 * defaultShowCode: true
 * title: CreateForm + JSEditableFieldModel（远程搜索 + 虚拟滚动）
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

  // 生成较大的数据集，便于演示虚拟滚动
  const big = Array.from({ length: 1000 }).map((_, i) => ({ value: String(i + 1), label: 'Item ' + (i + 1) }));
  mock.onGet('biglist:search').reply((config) => {
    const q = String((config as any).params?.q || '').toLowerCase();
    const data = q ? big.filter((x) => x.label.toLowerCase().includes(q) || x.value.includes(q)) : big;
    return [200, { data }];
  });
};

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jseditable-remote-virtual:'));

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
        { name: 'itemId', type: 'string', interface: 'input', title: 'Item' },
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
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'itemId' } },
                  label: 'Item（虚拟滚动）',
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'itemId' } },
                      jsSettings: {
                        runJs: {
                          code: `
// 结构：输入框 + 可滚动容器（虚拟列表）
ctx.element.innerHTML =
  '<div style="display:flex;gap:8px;align-items:center;width:100%">' +
  '  <input class="js-keyword" placeholder="搜索 Item" style="flex:1;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px" />' +
  '</div>' +
  '<div class="js-viewport" style="margin-top:8px;position:relative;height:240px;overflow:auto;border:1px solid #eee;border-radius:6px">' +
  '  <div class="js-spacer" style="height:0"></div>' +
  '  <div class="js-list" style="position:absolute;left:0;right:0;top:0"></div>' +
  '</div>';

var inputEl = ctx.element.querySelector('.js-keyword');
var viewport = ctx.element.querySelector('.js-viewport');
var spacer = ctx.element.querySelector('.js-spacer');
var list = ctx.element.querySelector('.js-list');

var all = [];
var itemHeight = 32; // 每项高度（需与 render 一致）
var buffer = 5; // 预加载 Buffer

var debounce = function(fn, delay){ var timer=null; return function(){ var args=arguments,self=this; clearTimeout(timer); timer=setTimeout(function(){ fn.apply(self,args); }, delay); } };

var renderSlice = function(start){
  var viewportHeight = viewport.clientHeight || 240;
  var visibleCount = Math.ceil(viewportHeight / itemHeight) + buffer;
  var end = Math.min(start + visibleCount, all.length);
  // 偏移定位
  var offsetY = start * itemHeight;
  list.style.transform = 'translateY(' + offsetY + 'px)';
  // 构造 HTML 片段
  var html = '';
  for (var i = start; i < end; i++) {
    var it = all[i];
    var selected = String(ctx.getValue()==null?'':ctx.getValue()) === String(it.value);
    html += '<div class="js-row" data-value="' + it.value + '" style="height:' + itemHeight + 'px;line-height:' + itemHeight + 'px;padding:0 8px;cursor:pointer;' + (selected?'background:#e6f4ff;':'') + '">' + it.label + '</div>';
  }
  list.innerHTML = html;
};

var updateVirtual = function(){
  var scrollTop = viewport.scrollTop || 0;
  var start = Math.floor(scrollTop / itemHeight);
  renderSlice(start);
};

var renderData = function(items){
  all = Array.isArray(items) ? items : [];
  spacer.style.height = String(all.length * itemHeight) + 'px';
  viewport.scrollTop = 0;
  renderSlice(0);
};

var doSearch = async function(keyword){
  list.innerHTML = '<div style="padding:8px;color:#999;">加载中...</div>';
  try { var res = await ctx.api.request({ url: 'biglist:search', method: 'get', params: { q: keyword || '' } }); var items = (res && res.data) || []; renderData(Array.isArray(items) ? items : (items.data || [])); } catch(e) { renderData([]); }
};

// 事件绑定
inputEl && inputEl.addEventListener('input', debounce(function(e){ doSearch(e.target.value); }, 300));
viewport && viewport.addEventListener('scroll', function(){ updateVirtual(); });
list && list.addEventListener('click', function(e){
  var target = e.target || e.srcElement; if (!target) return; var row = target.closest ? target.closest('.js-row') : null; if (!row) return;
  var v = row.getAttribute('data-value'); ctx.setValue(v);
  updateVirtual(); // 重新渲染以体现选中态
});
ctx.element.addEventListener('js-field:value-change', function(){ updateVirtual(); });

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
            <Card title="CreateForm + JSEditableField（远程搜索 + 虚拟滚动）">
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
