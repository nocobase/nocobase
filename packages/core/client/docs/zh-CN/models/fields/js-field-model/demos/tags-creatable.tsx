/**
 * defaultShowCode: true
 * title: CreateForm + JSEditableFieldModel（多选标签，可创建）
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

  // 预设一些标签，可通过搜索建议
  const presets = ['热门', '新品', '特价', '限时', '活动', '清仓', '推荐', '预售'];
  mock.onGet('tags:search').reply((config) => {
    const q = String((config as any).params?.q || '').toLowerCase();
    const data = presets.filter((x) => x.toLowerCase().includes(q));
    return [200, { data }];
  });
};

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jseditable-tags-creatable:'));

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
        { name: 'tags', type: 'string', interface: 'input', title: 'Tags' },
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
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'tags' } },
                  label: '标签（可创建）',
                  editItemSettings: { initialValue: { defaultValue: [] } },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'tags' } },
                      jsSettings: {
                        runJs: {
                          code: `
// 结构：已选标签 + 输入框 + 建议面板
ctx.element.innerHTML =
  '<div class="js-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px"></div>' +
  '<div style="display:flex;gap:8px;align-items:center;width:100%">' +
  '  <input class="js-input" placeholder="输入后回车创建或选择" style="flex:1;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px" />' +
  '  <button type="button" class="js-add" style="height:32px;padding:0 10px;border:1px solid #1677ff;background:#1677ff;color:#fff;border-radius:6px;cursor:pointer;">添加</button>' +
  '</div>' +
  '<div class="js-suggest" style="margin-top:8px;border:1px solid #eee;border-radius:6px;display:none"></div>';

var tagsWrap = ctx.element.querySelector('.js-tags');
var inputEl = ctx.element.querySelector('.js-input');
var addBtn = ctx.element.querySelector('.js-add');
var suggest = ctx.element.querySelector('.js-suggest');

var debounce = function(fn, delay){ var timer=null; return function(){ var args=arguments,self=this; clearTimeout(timer); timer=setTimeout(function(){ fn.apply(self,args); }, delay); } };

var getValueArr = function(){ var v = ctx.getValue(); return Array.isArray(v) ? v.slice() : (v ? [v] : []); };
var setValueArr = function(arr){ ctx.setValue(arr); };

var renderTags = function(){
  var arr = getValueArr();
  if (!tagsWrap) return;
  var html = arr.map(function(t){
    return '<span class="js-tag" data-v="' + t + '" style="display:inline-flex;align-items:center;gap:6px;background:#f5f5f5;border:1px solid #d9d9d9;border-radius:999px;padding:0 8px;height:24px;line-height:24px;">' +
      '<span>' + t + '</span>' +
      '<i class="js-remove" style="cursor:pointer;color:#999">×</i>' +
    '</span>';
  }).join('');
  tagsWrap.innerHTML = html;
};

var addTag = function(t){
  var v = String(t || '').trim(); if (!v) return;
  var arr = getValueArr(); if (arr.indexOf(v) === -1) { arr.push(v); setValueArr(arr); renderTags(); }
  if (inputEl) inputEl.value=''; hideSuggest();
};

var removeTag = function(t){
  var arr = getValueArr().filter(function(x){ return x !== t; }); setValueArr(arr); renderTags();
};

var showSuggest = function(items){
  if (!suggest) return;
  var arr = Array.isArray(items) ? items : [];
  if (!arr.length) { hideSuggest(); return; }
  suggest.style.display = 'block';
  suggest.innerHTML = arr.map(function(x){ return '<div class="js-opt" data-v="' + x + '" style="padding:6px 8px;cursor:pointer">' + x + '</div>'; }).join('');
};
var hideSuggest = function(){ if (!suggest) return; suggest.style.display = 'none'; suggest.innerHTML = ''; };

var search = async function(q){
  if (!q) { hideSuggest(); return; }
  try { var res = await ctx.api.request({ url: 'tags:search', method: 'get', params: { q: q } }); var items = (res && res.data) || []; showSuggest(Array.isArray(items) ? items : (items.data || [])); } catch(e) { hideSuggest(); }
};

// 初始化标签
renderTags();

// 交互
tagsWrap && tagsWrap.addEventListener('click', function(e){ var t = e.target || e.srcElement; if (!t) return; var tag = t.closest ? t.closest('.js-tag') : null; if (!tag) return; if ((t.className||'').indexOf('js-remove')>-1){ removeTag(tag.getAttribute('data-v')); } });
addBtn && addBtn.addEventListener('click', function(){ addTag(inputEl ? inputEl.value : ''); });
inputEl && inputEl.addEventListener('keydown', function(e){ if (e.key === 'Enter') { e.preventDefault(); addTag(inputEl.value); } });
inputEl && inputEl.addEventListener('input', debounce(function(e){ search(e.target.value); }, 300));
suggest && suggest.addEventListener('click', function(e){ var t = e.target || e.srcElement; if (!t) return; var opt = t.closest ? t.closest('.js-opt') : null; if (!opt) return; addTag(opt.getAttribute('data-v')); });
ctx.element.addEventListener('js-field:value-change', function(){ renderTags(); });
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
            <Card title="CreateForm + JSEditableField（多选标签，可创建）">
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
