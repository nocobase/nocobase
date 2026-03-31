/**
 * defaultShowCode: true
 * title: 多区块联动（两个表单块同步值）
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
  PluginFlowEngine,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { APIClient } from '@nocobase/sdk';
import { Card, Space } from 'antd';
import MockAdapter from 'axios-mock-adapter';

const LEFT_BLOCK_UID = 'jsfield-cross-block-left';
const RIGHT_BLOCK_UID = 'jsfield-cross-block-right';

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
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jsfield-cross-block:'));

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

    const leftBlock = this.flowEngine.createModel({
      use: 'CreateFormModel',
      uid: LEFT_BLOCK_UID,
      stepParams: {
        resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } },
      },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              {
                use: 'FormItemModel',
                stepParams: {
                  label: '父类（区块 A）',
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'orders',
                      fieldPath: 'parentId',
                    },
                  },
                  editItemSettings: {
                    initialValue: { defaultValue: 'p1' },
                  },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: {
                          dataSourceKey: 'main',
                          collectionName: 'orders',
                          fieldPath: 'parentId',
                        },
                      },
                      jsSettings: {
                        runJs: {
                          code: `
// 渲染父类选择框
ctx.element.innerHTML = '<select class="js-parent" style="width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px"></select>';
var selectEl = ctx.element.querySelector('.js-parent');
var peerUid = '${RIGHT_BLOCK_UID}';

// 通知子区块刷新子类列表
var notifyPeer = function(parentId){
  var peerBlock = ctx.engine.getModel(peerUid);
  if (!peerBlock.getFlow('syncFromParent')) {
    setTimeout(function(){ notifyPeer(parentId); }, 0);
    return;
  }
  peerBlock.applyFlow('syncFromParent', { parentId: parentId });
};

// 渲染父类选项并同步表单/子区块
var renderOptions = function(items){
  var list = Array.isArray(items) ? items : [];
  var current = String(ctx.getValue() == null ? '' : ctx.getValue());
  selectEl.innerHTML = list.map(function(it){ return '<option value="' + it.value + '">' + it.label + '</option>'; }).join('');
  if (current && list.some(function(it){ return String(it.value) === current; })) {
    selectEl.value = current;
  } else if (list.length) {
    var first = String(list[0].value);
    selectEl.value = first;
    ctx.setValue(first);
    notifyPeer(first);
    return;
  } else {
    selectEl.value = '';
    ctx.setValue('');
    notifyPeer('');
  }
  notifyPeer(selectEl.value);
};

// 加载父类列表
var loadParents = async function(){
  selectEl.innerHTML = '<option>加载中...</option>';
  try {
    var res = await ctx.api.request({ url: 'categories:parents', method: 'get', params: {} });
    var items = (res && res.data) || [];
    renderOptions(Array.isArray(items) ? items : (items.data || []));
  } catch (err) {
    renderOptions([]);
  }
};

if (selectEl) {
  selectEl.addEventListener('change', function(e){
    var value = e.target.value;
    ctx.setValue(value);
    notifyPeer(value);
  });
}

ctx.element.addEventListener('js-field:value-change', function(ev){
  var next = ev.detail == null ? '' : String(ev.detail);
  if (selectEl) {
    var prev = selectEl.value;
    if (prev !== next) {
      selectEl.value = next;
      notifyPeer(next);
    }
  }
});

loadParents();
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

    const rightBlock = this.flowEngine.createModel({
      use: 'CreateFormModel',
      uid: RIGHT_BLOCK_UID,
      stepParams: {
        resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } },
      },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              {
                use: 'FormItemModel',
                stepParams: {
                  label: '子类（区块 B）',
                  fieldSettings: {
                    init: {
                      dataSourceKey: 'main',
                      collectionName: 'orders',
                      fieldPath: 'subId',
                    },
                  },
                },
                subModels: {
                  field: {
                    use: 'JSEditableFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: {
                          dataSourceKey: 'main',
                          collectionName: 'orders',
                          fieldPath: 'subId',
                        },
                      },
                      jsSettings: {
                        runJs: {
                          code: `
ctx.element.innerHTML = '<select class="js-sub" style="width:100%;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px"></select>';
var selectEl = ctx.element.querySelector('.js-sub');
var peerUid = '${LEFT_BLOCK_UID}';

// 根据子类数据渲染下拉选项
var renderOptions = function(items){
  var list = Array.isArray(items) ? items : [];
  var current = String(ctx.getValue() == null ? '' : ctx.getValue());
  selectEl.innerHTML = list.map(function(it){ return '<option value="' + it.value + '">' + it.label + '</option>'; }).join('');
  if (current && list.some(function(it){ return String(it.value) === current; })) {
    selectEl.value = current;
  } else if (list.length) {
    var first = String(list[0].value);
    selectEl.value = first;
    ctx.setValue(first);
  } else {
    selectEl.value = '';
    ctx.setValue('');
  }
};

// 根据父类异步加载子类
var loadChildren = async function(parentId){
  if (!parentId) {
    renderOptions([]);
    return;
  }
  selectEl.innerHTML = '<option>加载中...</option>';
  try {
    var res = await ctx.api.request({ url: 'categories:children', method: 'get', params: { parentId: parentId } });
    var items = (res && res.data) || [];
    renderOptions(Array.isArray(items) ? items : (items.data || []));
  } catch (err) {
    renderOptions([]);
  }
};

if (selectEl) {
  selectEl.addEventListener('change', function(e){ ctx.setValue(e.target.value); });
}
ctx.element.addEventListener('js-field:value-change', function(ev){ if (selectEl) selectEl.value = String(ev.detail == null ? '' : ev.detail); });

// 注册实例流供父区块调用
var ensureFlow = function(){
  var key = 'syncFromParent';
  if (ctx.blockModel.getFlow(key)) return;
  ctx.blockModel.registerFlow(key, {
    title: '父类变更同步',
    manual: true,
    steps: {
      reload: {
        async handler(flowCtx, params){
          var pid = params && params.parentId;
          if (pid == null && flowCtx && flowCtx.inputArgs) pid = flowCtx.inputArgs.parentId;
          await loadChildren(pid);
        },
      },
    },
  });
};

ensureFlow();

// 初次渲染时尝试读取父区块当前值
var initWithPeer = function(){
  var peerBlock = ctx.engine.getModel(peerUid);
  var form = peerBlock.context && peerBlock.context.form ? peerBlock.context.form : null;
  var pid = form && form.getFieldValue ? form.getFieldValue('parentId') : undefined;
  loadChildren(pid);
};

initWithPeer();
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

    const leftFilterMgr: any = (() => {
      try {
        return new FilterManager(leftBlock);
      } catch (err) {
        return { bindToTarget() {} } as any;
      }
    })();
    leftBlock.context.defineProperty('filterManager', { value: leftFilterMgr });

    const rightFilterMgr: any = (() => {
      try {
        return new FilterManager(rightBlock);
      } catch (err) {
        return { bindToTarget() {} } as any;
      }
    })();
    rightBlock.context.defineProperty('filterManager', { value: rightFilterMgr });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="两个表单区块之间的联动" bordered={false}>
              <Space align="start" size={16} style={{ width: '100%' }}>
                <Card title="区块 A：主类选择" style={{ flex: 1 }}>
                  <FlowModelRenderer model={leftBlock} showFlowSettings />
                </Card>
                <Card title="区块 B：子类自动联动" style={{ flex: 1 }}>
                  <FlowModelRenderer model={rightBlock} showFlowSettings />
                </Card>
              </Space>
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
