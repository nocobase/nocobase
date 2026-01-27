/**
 * defaultShowCode: true
 * title: JSBlock + openView（外置表单配置）
 */

import {
  Application,
  BlockGridModel,
  MockFlowModelRepository,
  Plugin,
  ChildPageModel,
  ChildPageTabModel,
  EditFormModel,
  FormGridModel,
  FormItemModel,
  InputFieldModel,
  FormSubmitActionModel,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { APIClient } from '@nocobase/sdk';
import { Card } from 'antd';
import React from 'react';
import MockAdapter from 'axios-mock-adapter';
import { PluginFlowEngine, CollectionPlugin } from '@nocobase/client';

const bootstrapMock = (api: APIClient) => {
  const mock = new MockAdapter(api.axios);

  mock.onGet('roles:check').reply(200, {
    data: { allowAll: true, resources: [], actions: {}, actionAlias: {}, strategy: {} },
  });

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

  mock.onGet('lead:list').reply(() => {
    return [200, { data: leads, meta: { page: 1, pageSize: leads.length, count: leads.length, totalPage: 1 } }];
  });

  mock.onGet('lead:get').reply((config) => {
    const filterByTk = Number(config.params?.filterByTk);
    const record = leads.find((item) => item.id === filterByTk) || null;
    return [200, { data: record }];
  });

  mock.onPost('lead:create').reply((config) => {
    const body = JSON.parse(config.data || '{}');
    const record = { id: ++idSeq, ...body };
    leads.unshift(record);
    return [200, { data: record }];
  });

  mock.onPost('lead:update').reply((config) => {
    const filterByTk = Number(config.params?.filterByTk);
    const body = JSON.parse(config.data || '{}');
    const index = leads.findIndex((item) => item.id === filterByTk);
    if (index >= 0) {
      leads[index] = { ...leads[index], ...body };
      return [200, { data: leads[index] }];
    }
    return [404, { message: 'not found' }];
  });

  mock.onPost('lead:destroy').reply((config) => {
    const ids = (config.params?.filterByTk || []).map((value: any) => Number(value));
    ids.forEach((id: number) => {
      const index = leads.findIndex((item) => item.id === id);
      if (index >= 0) {
        leads.splice(index, 1);
      }
    });
    return [200, { data: true }];
  });
};

class DemoPlugin extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.setModelRepository(new MockFlowModelRepository('demo-jsblock-edit-external:'));

    const api = new APIClient({ baseURL: 'https://localhost:8000/api' });
    bootstrapMock(api);
    this.flowEngine.context.defineProperty('api', { value: api });

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

    const submitActionUid = 'jsblock-external-submit';

    const page = this.flowEngine.createModel({
      use: 'BlockGridModel',
      subModels: {
        items: [
          {
            use: 'JSBlockModel',
            subModels: {
              page: {
                use: 'ChildPageModel',
                subModels: {
                  tabs: [
                    {
                      use: 'ChildPageTabModel',
                      subModels: {
                        grid: {
                          use: 'BlockGridModel',
                          subModels: {
                            items: [
                              {
                                use: 'EditFormModel',
                                stepParams: {
                                  resourceSettings: {
                                    init: {
                                      dataSourceKey: 'main',
                                      collectionName: 'lead',
                                      filterByTk: '{{ ctx.view.inputArgs.filterByTk }}',
                                    },
                                  },
                                },
                                subModels: {
                                  grid: {
                                    use: 'FormGridModel',
                                    subModels: {
                                      items: [
                                        {
                                          use: 'FormItemModel',
                                          stepParams: {
                                            fieldSettings: {
                                              init: {
                                                dataSourceKey: 'main',
                                                collectionName: 'lead',
                                                fieldPath: 'name',
                                              },
                                            },
                                          },
                                          subModels: { field: { use: 'InputFieldModel' } },
                                        },
                                        {
                                          use: 'FormItemModel',
                                          stepParams: {
                                            fieldSettings: {
                                              init: {
                                                dataSourceKey: 'main',
                                                collectionName: 'lead',
                                                fieldPath: 'company',
                                              },
                                            },
                                          },
                                          subModels: { field: { use: 'InputFieldModel' } },
                                        },
                                        {
                                          use: 'FormItemModel',
                                          stepParams: {
                                            fieldSettings: {
                                              init: {
                                                dataSourceKey: 'main',
                                                collectionName: 'lead',
                                                fieldPath: 'email',
                                              },
                                            },
                                          },
                                          subModels: { field: { use: 'InputFieldModel' } },
                                        },
                                        {
                                          use: 'FormItemModel',
                                          stepParams: {
                                            fieldSettings: {
                                              init: {
                                                dataSourceKey: 'main',
                                                collectionName: 'lead',
                                                fieldPath: 'phone',
                                              },
                                            },
                                          },
                                          subModels: { field: { use: 'InputFieldModel' } },
                                        },
                                        {
                                          use: 'FormItemModel',
                                          stepParams: {
                                            fieldSettings: {
                                              init: {
                                                dataSourceKey: 'main',
                                                collectionName: 'lead',
                                                fieldPath: 'status',
                                              },
                                            },
                                          },
                                          subModels: { field: { use: 'InputFieldModel' } },
                                        },
                                        {
                                          use: 'FormItemModel',
                                          stepParams: {
                                            fieldSettings: {
                                              init: {
                                                dataSourceKey: 'main',
                                                collectionName: 'lead',
                                                fieldPath: 'rating',
                                              },
                                            },
                                          },
                                          subModels: { field: { use: 'InputFieldModel' } },
                                        },
                                      ],
                                    },
                                  },
                                  actions: [{ use: 'FormSubmitActionModel', uid: submitActionUid }],
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
                stepParams: {
                  pageSettings: {
                    general: { displayTitle: false, enableTabs: true },
                  },
                },
              },
            },
            stepParams: {
              jsSettings: {
                runJs: {
                  code: `
const submitActionUid = 'jsblock-external-submit';

ctx.useResource('MultiRecordResource');
ctx.resource.setResourceName('lead');
ctx.resource.setDataSourceKey('main');
ctx.resource.setPageSize(100);
ctx.resource.setFields(['id','name','company','email','phone','status','rating']);

ctx.resource.on('refresh', render);

const handleLeadSaved = async () => {
  await ctx.resource.refresh();
  ctx.message.success('保存成功，已刷新列表');
  render();
};

// 确保在外部已创建的提交按钮上追加 afterSaved 回调步骤
async function ensureAfterSavedStep() {
  try {
    var submitAction = ctx.engine.getModel(submitActionUid);
    if (!submitAction) return;
    var flow = submitAction.flowRegistry && submitAction.flowRegistry.getFlow ? submitAction.flowRegistry.getFlow('submitSettings') : null;
    if (!flow) {
      var base = submitAction.getFlow && submitAction.getFlow('submitSettings');
      if (base && submitAction.flowRegistry && submitAction.flowRegistry.addFlow) {
        var opts = base.serialize ? base.serialize() : {};
        delete opts.key;
        flow = submitAction.flowRegistry.addFlow('submitSettings', opts);
      }
    }
    if (!flow) return;
    if (flow.hasStep && flow.hasStep('jsBlockAfterSaved')) {
      try { flow.removeStep('jsBlockAfterSaved'); } catch (e) {}
    }
    flow.addStep && flow.addStep('jsBlockAfterSaved', {
      sort: 9999,
      async handler() { await handleLeadSaved(); },
    });
    if (flow.save) { try { await flow.save(); } catch(e) {} }
  } catch (e) {}
}

await ensureAfterSavedStep();
await ctx.resource.refresh();

function render() {
  const list = ctx.resource.getData() || [];
  const rows = list
    .map(function (record) {
      return (
        '<tr>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (record.id || '') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (record.name || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (record.company || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (record.status || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">' + (record.rating || '-') + '</td>' +
        '<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right">' +
        '<button class="btn-edit" data-id="' + (record.id || '') + '" style="padding:4px 8px;border:1px solid #d9d9d9;border-radius:4px;background:#fff;cursor:pointer;">编辑</button>' +
        '<button class="btn-del" data-id="' + (record.id || '') + '" style="margin-left:8px;padding:4px 8px;border:1px solid #ffccc7;border-radius:4px;background:#fff;color:#ff4d4f;cursor:pointer;">删除</button>' +
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

  const btnAdd = ctx.element.querySelector('#btnAdd');
  btnAdd.addEventListener('click', async () => {
    const now = new Date().toLocaleString('zh-CN');
    await ctx.resource.create({ name: '新线索 ' + now, company: '示例公司', status: 'Initial Contact', rating: 'Warm' });
    render();
  });

  const tbody = ctx.element.querySelector('tbody');
  tbody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = Number(button.getAttribute('data-id'));

    if (button.classList.contains('btn-edit')) {
      await ctx.runAction('openView', {
        navigation: false,
        mode: 'drawer',
        collectionName: 'lead',
        dataSourceKey: 'main',
        filterByTk: id,
      });
    }

    if (button.classList.contains('btn-del')) {
      await ctx.resource.destroy(id);
      render();
    }
  });
}

render();
                  `.trim(),
                },
              },
            },
          },
        ],
      },
    }) as BlockGridModel;

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="JSBlock + openView（外置表单配置）">
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
    [CollectionPlugin, { name: 'builtin-collection', config: { enableRemoteDataSource: false } }],
    DemoPlugin,
  ],
}).getRootComponent();
