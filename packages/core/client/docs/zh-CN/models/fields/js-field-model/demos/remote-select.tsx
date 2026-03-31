/**
 * defaultShowCode: true
 * title: CreateForm + JSEditableFieldModel（远程下拉选项-Mock）
 */

import React from 'react';
import {
  Application,
  CreateFormModel,
  FormGridModel,
  FormItemModel,
  InputFieldModel,
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

// 启动 mock 接口（仅示例用）
const bootstrapMock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);
  // ACL：允许全部，避免 aclCheck 触发真实请求
  mock.onGet('roles:check').reply(200, {
    data: { allowAll: true, resources: [], actions: {}, actionAlias: {}, strategy: {} },
  });
  // 模拟分类选项接口
  const base = [
    { value: '1', label: '电子产品' },
    { value: '2', label: '图书音像' },
    { value: '3', label: '家居家装' },
    { value: '4', label: '运动户外' },
  ];
  let requestCount = 0;
  mock.onGet('categories:list').reply(() => {
    requestCount += 1;
    // 每次请求随机洗牌并标记批次，模拟“刷新”后列表发生变化
    const shuffled = base.slice().sort(() => Math.random() - 0.5);
    const data = shuffled.map((item) => ({
      ...item,
      label: `${item.label}（批次${requestCount}）`,
    }));
    return [200, { data }];
  });
};

class DemoPlugin extends Plugin {
  async load() {
    // 强制开启 Flow 设置模式，便于查看“JavaScript settings”
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jseditable-remote-select:'));

    // 提供 API 与 mock
    const api = new APIClient({ baseURL: 'https://localhost:8000/api' });
    bootstrapMock(api);
    this.flowEngine.context.defineProperty('api', { value: api });

    // 数据源与集合定义（仅用于演示表单字段）
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'orders',
      title: 'Orders',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', interface: 'id', title: 'ID' },
        { name: 'title', type: 'string', interface: 'input', title: 'Title' },
        { name: 'categoryId', type: 'string', interface: 'input', title: 'Category' },
      ],
    });

    // 构建 CreateForm，包含一个可编辑 JS 字段（远程加载下拉）
    const form = this.flowEngine.createModel({
      use: 'CreateFormModel',
      stepParams: {
        resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } },
      },
      subModels: {
        grid: {
          use: 'FormGridModel',
          subModels: {
            items: [
              // 标题（普通输入，用于凑表单结构）
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'title' },
                  },
                },
                subModels: {
                  field: {
                    use: 'InputFieldModel',
                    stepParams: {
                      fieldSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'title' },
                      },
                    },
                  },
                },
              },
              // 分类（JSEditableField：通过 API 加载 options）
              {
                use: 'FormItemModel',
                stepParams: {
                  fieldSettings: {
                    init: { dataSourceKey: 'main', collectionName: 'orders', fieldPath: 'categoryId' },
                  },
                  editItemSettings: {
                    initialValue: { defaultValue: '2' }, // 默认选中“图书音像”
                  },
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
                          // 说明：
                          // - 通过 ctx.api.request 拉取选项
                          // - 绑定 change 事件 -> ctx.setValue 同步表单
                          // - 监听 js-field:value-change 事件，反向更新 UI
                          code: `
// 初始化容器结构（使用字符串拼接避免模板字符串嵌套）
ctx.element.innerHTML =
  '<div style="display:flex;gap:8px;align-items:center;width:100%">' +
  '  <select class="js-select" style="flex:1;padding:4px 8px;border:1px solid #d9d9d9;border-radius:6px;height:32px"></select>' +
  '  <button type="button" class="js-refresh" style="height:32px;padding:0 10px;border:1px solid #1677ff;background:#1677ff;color:#fff;border-radius:6px;cursor:pointer;">刷新</button>' +
  '</div>';

var selectEl = ctx.element.querySelector('.js-select');
var refreshBtn = ctx.element.querySelector('.js-refresh');

// 渲染下拉选项（避免使用反引号与模板占位符嵌套）
var renderOptions = function(items) {
  var current = String(ctx.getValue() == null ? '' : ctx.getValue());
  selectEl.innerHTML = (Array.isArray(items) ? items : []).map(function(it) {
    return '<option value="' + it.value + '">' + it.label + '</option>';
  }).join('');
  // 恢复当前已选值（如仍存在）
  if (current) {
    var exists = items.some(function(it) { return String(it.value) === current; });
    if (exists) selectEl.value = current;
  }
};

// 远程加载 options（可扩展为携带 keyword 等参数）
var loadOptions = async function() {
  // 简单的加载态
  selectEl.innerHTML = '<option>加载中...</option>';
  try {
    var res = await ctx.api.request({ url: 'categories:list', method: 'get', params: {} });
    var items = (res && res.data) || [];
    renderOptions(Array.isArray(items) ? items : (items.data || []));
  } catch (e) {
    // 失败兜底
    renderOptions([]);
  }
};

// 绑定交互：变更时写回表单；外部值变化时更新选中
selectEl && selectEl.addEventListener('change', function(e) { ctx.setValue(e.target.value); });
ctx.element.addEventListener('js-field:value-change', function(ev) {
  if (!selectEl) return;
  var v = ev.detail == null ? '' : String(ev.detail);
  selectEl.value = v;
});
refreshBtn && refreshBtn.addEventListener('click', function() { loadOptions(); });

// 初次加载
loadOptions();
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

    // 提供 filterManager，避免 refreshSettings 绑定时报错（兜底避免上下文缺失）
    const filterMgr: any = (() => {
      try {
        return new FilterManager(form);
      } catch (e) {
        return { bindToTarget() {} } as any;
      }
    })();
    form.context.defineProperty('filterManager', { value: filterMgr });

    // 路由挂载示例页面
    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="CreateForm + JSEditableField（远程下拉选项）">
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
