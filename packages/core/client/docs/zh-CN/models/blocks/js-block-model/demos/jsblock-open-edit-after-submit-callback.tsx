/**
 * defaultShowCode: true
 * title: JSBlock + openView（编辑后自动关闭并回调）
 */

import {
  Application,
  BlockGridModel,
  EditFormModel,
  FormGridModel,
  FormItemModel,
  InputFieldModel,
  JSBlockModel,
  MockFlowModelRepository,
  Plugin,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { APIClient } from '@nocobase/sdk';
import { Card } from 'antd';
import React from 'react';
import MockAdapter from 'axios-mock-adapter';
import { PluginFlowEngine, CollectionPlugin } from '@nocobase/client';

// 简易模拟数据源（内存）
const bootstrapMock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);

  // 允许所有权限，避免 ACL 请求命中真实接口
  mock.onGet('roles:check').reply(200, {
    data: { allowAll: true, resources: [], actions: {}, actionAlias: {}, strategy: {} },
  });

  // 线索数据（简化示例）
  let idSeq = 10;
  const leads: any[] = [
    {
      id: 1,
      name: '张三',
      company: '甲公司',
      email: 'zhangsan@example.com',
      phone: '13800000001',
      status: 'Initial Contact',
      rating: 'Warm',
    },
    {
      id: 2,
      name: '李四',
      company: '乙公司',
      email: 'lisi@example.com',
      phone: '13800000002',
      status: 'Deep Follow-up',
      rating: 'Hot',
    },
    {
      id: 3,
      name: '王五',
      company: '丙公司',
      email: 'wangwu@example.com',
      phone: '13800000003',
      status: 'Success',
      rating: 'Warm',
    },
  ];

  // 列表
  mock.onGet('lead:list').reply((config) => {
    const page = Number(config.params?.page || 1);
    const pageSize = Number(config.params?.pageSize || 100);
    const start = (page - 1) * pageSize;
    const items = leads.slice(start, start + pageSize);
    return [
      200,
      { data: items, meta: { page, pageSize, count: leads.length, totalPage: Math.ceil(leads.length / pageSize) } },
    ];
  });

  // 获取单条
  mock.onGet('lead:get').reply((config) => {
    const filterByTk = Number(config.params?.filterByTk);
    const record = leads.find((r) => r.id === filterByTk) || null;
    return [200, { data: record }];
  });

  // 创建
  mock.onPost('lead:create').reply((config) => {
    const body = JSON.parse(config.data || '{}');
    const rec = { id: ++idSeq, ...body };
    leads.unshift(rec);
    return [200, { data: rec }];
  });

  // 更新
  mock.onPost('lead:update').reply((config) => {
    const filterByTk = Number(config.params?.filterByTk);
    const body = JSON.parse(config.data || '{}');
    const idx = leads.findIndex((r) => r.id === filterByTk);
    if (idx >= 0) {
      leads[idx] = { ...leads[idx], ...body };
      return [200, { data: leads[idx] }];
    }
    return [404, { message: 'Not found' }];
  });

  // 删除
  mock.onPost('lead:destroy').reply((config) => {
    const ids = (config.params?.filterByTk || []).map((n: any) => Number(n));
    ids.forEach((id: number) => {
      const idx = leads.findIndex((r) => r.id === id);
      if (idx >= 0) leads.splice(idx, 1);
    });
    return [200, { data: true }];
  });
};

class DemoPlugin extends Plugin {
  async load() {
    // 打开设置态（便于在文档里查看配置）并使用内存仓库
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jsblock-edit-callback:'));

    // API Client + Mock
    const api = new APIClient({ baseURL: 'https://localhost:8000/api' });
    bootstrapMock(api);
    this.flowEngine.context.defineProperty('api', { value: api });

    // 数据源/集合元信息
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'lead',
      title: 'Lead',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', interface: 'id', title: 'ID' },
        { name: 'name', type: 'string', interface: 'input', title: 'Name' },
        { name: 'company', type: 'string', interface: 'input', title: 'Company' },
        { name: 'email', type: 'string', interface: 'email', title: 'Email' },
        { name: 'phone', type: 'string', interface: 'input', title: 'Phone' },
        { name: 'status', type: 'string', interface: 'input', title: 'Status' },
        { name: 'rating', type: 'string', interface: 'input', title: 'Rating' },
      ],
    });

    // 容器：一行一个 JSBlock
    const page = this.flowEngine.createModel({
      use: 'BlockGridModel',
      subModels: {
        items: [
          {
            use: 'JSBlockModel',
            stepParams: {
              jsSettings: {
                runJs: {
                  code: `
// 资源初始化
console.log('[JSBlock] init start');
ctx.useResource('MultiRecordResource');
ctx.resource.setResourceName('lead');
ctx.resource.setDataSourceKey('main');
ctx.resource.setPageSize(100);
ctx.resource.setFields(['id','name','company','email','phone','status','rating']);

// 监听资源刷新事件，统一触发重渲染（辅助调试）
ctx.resource.on && ctx.resource.on('refresh', () => {
  console.log('[JSBlock] resource refresh event');
  try { render(); } catch (e) { console.error('[JSBlock] render error after refresh:', e); }
});

// 回调：编辑保存成功后触发（刷新并重渲染）
// 注意：方法挂在“模型上下文”上，确保在 openView 的子页面中也能通过 currentFlow 访问到
const handleLeadSaved = async (payload) => {
  console.log('[JSBlock] onLeadSaved called with:', payload);
  try {
    const before = ctx.resource.getData();
    console.log('[JSBlock] onLeadSaved refresh start, current rows:', Array.isArray(before) ? before.length : 0);
    await ctx.resource.refresh();
    const after = ctx.resource.getData();
    console.log('[JSBlock] onLeadSaved refresh done, rows:', Array.isArray(after) ? after.length : 0);
    ctx.message.success('保存成功，已刷新列表');
    render();
  } catch (e) {
    console.error('[JSBlock] onLeadSaved refresh error:', e);
    // 忽略错误，避免影响关闭
  }
};

if (ctx.defineMethod) {
  ctx.defineMethod('onLeadSaved', handleLeadSaved);
  console.log('[JSBlock] onLeadSaved bound on runtime ctx');
}

if (ctx.model && ctx.model.context && ctx.model.context.defineMethod) {
  ctx.model.context.defineMethod('onLeadSaved', handleLeadSaved);
  console.log('[JSBlock] onLeadSaved bound on model ctx');
}

const hasCtxMethod = typeof ctx?.onLeadSaved === 'function';
const hasModelMethod = typeof ctx?.model?.context?.onLeadSaved === 'function';
console.log('[JSBlock] onLeadSaved registered, runtime ctx?', hasCtxMethod, 'model ctx?', hasModelMethod);

await ctx.resource.refresh();
console.log('[JSBlock] initial refresh done');

function render() {
  const list = ctx.resource.getData() || [];
  console.log('[JSBlock] render, rows:', Array.isArray(list) ? list.length : 0);
  const rows = list
    .map(function (r) {
      return (
        '<tr>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (r.id ?? '') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (r.name || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (r.company || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (r.status || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (r.rating || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right">' +
        '<button class="btn-edit" data-id="' + (r.id ?? '') + '" style="padding:4px 8px;border:1px solid #d9d9d9;border-radius:4px;background:#fff;cursor:pointer;">编辑</button>' +
        '<button class="btn-del" data-id="' + (r.id ?? '') + '" style="margin-left:8px;padding:4px 8px;border:1px solid #ffccc7;border-radius:4px;background:#fff;color:#ff4d4f;cursor:pointer;">删除</button>' +
        '</td>' +
        '</tr>'
      );
    })
    .join('');

  ctx.element.innerHTML =
    '<div style="padding:12px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
    '<h3 style="margin:0;font-size:16px;">线索管理（示例）</h3>' +
    '<button id="btnAdd" style="padding:6px 10px;border:1px solid #91d5ff;border-radius:4px;background:#e6f7ff;color:#1677ff;cursor:pointer;">新增线索</button>' +
    '</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
    '<thead>' +
    '<tr style="background:#fafafa;">' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;">ID</th>' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;">姓名</th>' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;">公司</th>' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;">状态</th>' +
    '<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #f0f0f0;">评级</th>' +
    '<th style="text-align:right;padding:6px 8px;border-bottom:1px solid #f0f0f0;">操作</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' + rows + '</tbody>' +
    '</table>' +
    '</div>';

  // 新增
  const btnAdd = ctx.element.querySelector('#btnAdd');
  btnAdd?.addEventListener('click', async () => {
    const now = new Date().toLocaleString('zh-CN');
    console.log('[JSBlock] add lead clicked');
    await ctx.resource.create({ name: '新线索 ' + now, company: '示例公司', status: 'Initial Contact', rating: 'Warm' });
    render();
  });

  // 编辑、删除（事件委托）
  ctx.element.querySelector('tbody')?.addEventListener('click', async (e) => {
    const t = e && e.target;
    const btn = t && typeof t.closest === 'function' ? t.closest('button') : null;
    if (!btn) return;
    const id = Number(btn.getAttribute('data-id'));

    if (btn.classList.contains('btn-edit')) {
      // 打开系统内部编辑弹窗（抽屉），并在子页面中即时创建 EditFormModel
      console.log('[JSBlock] openView to edit id =', id);
      await ctx.runAction('openView', {
        navigation: false,
        mode: 'drawer',
        collectionName: 'lead',
        dataSourceKey: 'main',
        filterByTk: id,
        // 使用 afterModelInit 在子页面里创建一个 EditFormModel + 提交按钮
        afterModelInit: async (pageModel) => {
          try {
            console.log('[JSBlock] afterModelInit: pageModel uid', pageModel?.uid, 'tabs:', pageModel?.subModels?.tabs?.length);
            const tab = pageModel.subModels?.tabs?.[0];
            const grid = await pageModel.flowEngine.loadOrCreateModel({
              parentId: tab.uid,
              subKey: 'grid',
              subType: 'object',
              use: 'BlockGridModel',
              async: true,
            });

            const form = (await pageModel.flowEngine.loadOrCreateModel({
              parentId: grid.uid,
              subKey: 'items',
              subType: 'array',
              use: 'EditFormModel',
              stepParams: {
                resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'lead', filterByTk: id } },
              },
              subModels: {
                grid: {
                  use: 'FormGridModel',
                  subModels: {
                    items: [
                      { use: 'FormItemModel', stepParams: { fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'lead', fieldPath: 'name' } } }, subModels: { field: { use: 'InputFieldModel' } } },
                      { use: 'FormItemModel', stepParams: { fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'lead', fieldPath: 'company' } } }, subModels: { field: { use: 'InputFieldModel' } } },
                      { use: 'FormItemModel', stepParams: { fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'lead', fieldPath: 'email' } } }, subModels: { field: { use: 'InputFieldModel' } } },
                      { use: 'FormItemModel', stepParams: { fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'lead', fieldPath: 'phone' } } }, subModels: { field: { use: 'InputFieldModel' } } },
                      { use: 'FormItemModel', stepParams: { fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'lead', fieldPath: 'status' } } }, subModels: { field: { use: 'InputFieldModel' } } },
                      { use: 'FormItemModel', stepParams: { fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'lead', fieldPath: 'rating' } } }, subModels: { field: { use: 'InputFieldModel' } } },
                    ],
                  },
                },
                actions: [
                  { use: 'FormSubmitActionModel' },
                ],
              },
            }));

            // 在提交步骤后追加一个后置动作，用于回调父区块（保留原有 saveResource 等步骤）
            const submit = form.subModels?.actions?.[0];
            const actionInfos = (form.subModels?.actions || []).map((action) => ({
              uid: action?.uid,
              modelName: action?.constructor?.name,
              hasFlows: typeof action?.flowRegistry?.getFlows === 'function' ? action.flowRegistry.getFlows().size : 'unknown',
            }));
            console.log('[JSBlock] form actions:', actionInfos);
            if (pageModel?.context?.defineMethod) {
              pageModel.context.defineMethod('onLeadSaved', handleLeadSaved);
              console.log('[JSBlock] onLeadSaved bound on child page context');
            }
            const flow = submit?.flowRegistry.getFlow('submitSettings');
            console.log('[JSBlock] submit action located?', !!submit, 'flow available?', !!flow);
            if (flow) {
              try {
                const sortedBefore = flow.getSortedSteps?.().map?.(([key, step]) => {
                  const data = step.serialize ? step.serialize() : {};
                  return { key, sort: data.sort, use: data.use };
                });
                console.log('[JSBlock] submitSettings flow steps before add:', sortedBefore);
              } catch (infoErr) {
                console.warn('[JSBlock] unable to inspect flow steps before add:', infoErr);
              }
              flow.addStep('afterSaved', {
                sort: 9999,
                async handler(actCtx) {
                  try {
                    console.log('[JSBlock] afterSaved fired');
                    const snapshot = {
                      hasCurrentFlow: !!actCtx?.currentFlow,
                      flowModelType: actCtx?.currentFlow?.model?.constructor?.name,
                      flowModelUid: actCtx?.currentFlow?.model?.uid,
                      parentModelType: actCtx?.currentFlow?.model?.parent?.constructor?.name,
                      onLeadSavedType: typeof actCtx?.currentFlow?.onLeadSaved,
                      parentCtxHasMethod: typeof actCtx?.model?.parent?.context?.onLeadSaved === 'function',
                      actionCtxHasMethod: typeof actCtx?.model?.context?.onLeadSaved === 'function',
                    };
                    console.log('[JSBlock] afterSaved context snapshot:', snapshot);
                    let targetCtx = null;
                    if (actCtx?.currentFlow && typeof actCtx.currentFlow.onLeadSaved === 'function') {
                      targetCtx = actCtx.currentFlow;
                      console.log('[JSBlock] afterSaved: using currentFlow.onLeadSaved');
                    } else if (actCtx?.model?.context && typeof actCtx.model.context.onLeadSaved === 'function') {
                      targetCtx = actCtx.model.context;
                      console.log('[JSBlock] afterSaved: using action model context');
                    } else if (actCtx?.model?.parent?.context && typeof actCtx.model.parent.context.onLeadSaved === 'function') {
                      targetCtx = actCtx.model.parent.context;
                      console.log('[JSBlock] afterSaved: fallback to parent model context');
                    }
                    if (!targetCtx) {
                      console.warn('[JSBlock] afterSaved: no valid callback target');
                      actCtx.message?.info && actCtx.message.info('回调未注册');
                      return;
                    }
                    actCtx.message?.info && actCtx.message.info('保存完成，触发回调');
                    targetCtx.onLeadSaved({
                      id,
                      values: (form.form && form.form.getFieldsValue && form.form.getFieldsValue()) || {},
                    });
                  } catch (err) {
                    console.error('[JSBlock] afterSaved error:', err);
                  }
                },
              });
              try {
                await flow.save();
                console.log('[JSBlock] afterSaved step added and saved');
                try {
                  const sortedAfter = flow.getSortedSteps?.().map?.(([key, step]) => {
                    const data = step.serialize ? step.serialize() : {};
                    return { key, sort: data.sort, use: data.use };
                  });
                  console.log('[JSBlock] submitSettings flow steps after add:', sortedAfter);
                } catch (infoErr) {
                  console.warn('[JSBlock] unable to inspect flow steps after add:', infoErr);
                }
              } catch (e) {
                console.warn('[JSBlock] flow.save error (non-fatal):', e);
              }
            } else {
              console.warn('[JSBlock] submitSettings flow not found on submit action');
            }
          } catch (err) {
            console.error('afterModelInit error:', err);
          }
        },
      });
    }

    if (btn.classList.contains('btn-del')) {
      await ctx.resource.destroy(id);
      render();
    }
  });
}

// 初次渲染
render();
                  `.trim(),
                },
              },
            },
          },
        ],
      },
    }) as BlockGridModel;

    // 将示例加入路由
    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="JSBlock + openView（编辑后自动关闭并回调）">
              <FlowModelRenderer model={page} showFlowSettings />
            </Card>
          </div>
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [
    PluginFlowEngine,
    // 注册内置字段接口等集合相关能力，关闭远程数据源以避免示例环境发起网络请求
    [CollectionPlugin, { name: 'builtin-collection', config: { enableRemoteDataSource: false } }],
    DemoPlugin,
  ],
}).getRootComponent();
