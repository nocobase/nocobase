import React, { useState } from 'react';
import { Table, Button, Space, Card, App } from 'antd';
import { RedoOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import {
    EventBus,
    EventFlowManager,
    FilterFlowManager,
    IFilter,
    useApplyFilters,
    BlockConfigsProvider,
    SchemaComponent,
    SchemaComponentProvider,
    SchemaSettings,
    useCompile,
    useBlockConfigs
} from '@nocobase/client';
import _ from 'lodash';
import { configureAction } from './actions/open-configure-dialog';

// 创建事件总线和事件/过滤流管理器
const eventBus = new EventBus();
const eventFlowManager = new EventFlowManager(eventBus);
const filterFlowManager = new FilterFlowManager();

// --- Mock 数据 ---
const mockData = [
    { id: 1, name: '张三', age: 30, email: 'zhangsan@example.com' },
    { id: 2, name: '李四', age: 25, email: 'lisi@example.com' },
    { id: 3, name: '王五', age: 35, email: 'wangwu@example.com' },
    { id: 4, name: '赵六', age: 28, email: 'zhaoliu@example.com' },
    { id: 5, name: '钱七', age: 22, email: 'qianqi@example.com' },
    { id: 6, name: '孙八', age: 23, email: 'sunba@example.com' },
    { id: 7, name: '周九', age: 24, email: 'zhoujiu@example.com' },
    { id: 8, name: '吴十', age: 25, email: 'wushi@example.com' },
    { id: 9, name: '郑十一', age: 26, email: 'zhengshi@example.com' },
    { id: 10, name: '王十二', age: 27, email: 'wangshi@example.com' },
    { id: 11, name: '冯十三', age: 28, email: 'fengshi@example.com' },
    { id: 12, name: '陈十四', age: 29, email: 'chenshi@example.com' },
    { id: 13, name: '褚十五', age: 30, email: 'chushi@example.com' },
    { id: 14, name: '卫十六', age: 31, email: 'weishi@example.com' },
    { id: 15, name: '蒋十七', age: 32, email: 'jiangshi@example.com' },
    { id: 16, name: '沈十八', age: 33, email: 'shenshi@example.com' },
];

// --- Mock blockConfigs ---
const mockBlockConfigs = {
    key: 'demo-block-id',
    blockType: 'demoTable',
    configData: {
        filterSteps: {
            'block:demo:table': {
                'block:common:linkages': {
                    rule: ''
                },
                'block:common:fields': {
                    fields: ['id', 'name', 'age', 'email']
                },
                'block:common:actions': {
                    actions: {
                        toolbar: [
                            { key: 'create', title: '新增', event: 'block:demo:create', icon: 'PlusOutlined' },
                            { key: 'refresh', title: '刷新', event: 'block:demo:refresh', icon: 'RedoOutlined' }
                        ],
                        row: [
                            { key: 'view', title: '查看', event: 'block:demo:view', icon: 'EyeOutlined' }
                        ]
                    }
                },
                'block:common:data': {
                    collectionName: 'users',
                    pageSize: 5,
                    page: 1
                }
            }
        },
        eventSteps: {
            'refreshFlow': {
                'step-refresh': {
                    messageOnSuccess: '数据已成功刷新！'
                }
            },
            'viewFlow': {
                'step-view': {
                    messageOnSuccess: '查看记录详情'
                }
            },
            'createFlow': {
                'step-create': {
                    messageOnSuccess: '新建记录'
                }
            }
        }
    }
};

// 模拟API请求
const mockApiClient = {
    resource: (resourceName) => ({
        get: async ({ filterByTk }) => {
            // 模拟获取区块配置
            if (resourceName === 'blockConfigs') {
                await new Promise(resolve => setTimeout(resolve, 100)); // 模拟网络延迟
                return {
                    data: {
                        data: mockBlockConfigs
                    }
                };
            }
            return { data: null };
        },
        list: async (params = {}) => {
            // 模拟获取数据列表
            if (resourceName === 'users') {
                await new Promise(resolve => setTimeout(resolve, 300)); // 模拟网络延迟
                const { page = 1, pageSize = 10 } = params as { page?: number; pageSize?: number };
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const data = mockData.slice(startIndex, endIndex);

                return {
                    data: {
                        data,
                        meta: {
                            count: mockData.length,
                            page,
                            pageSize
                        }
                    }
                };
            }
            return { data: null };
        }
    })
};

// --- 定义事件 ---
// 刷新表格事件
eventFlowManager.addEvent({
    name: 'block:demo:refresh',
    title: '刷新表格数据',
    group: 'data',
    uiSchema: {},
});

// 查看记录事件
eventFlowManager.addEvent({
    name: 'block:demo:view',
    title: '查看记录详情',
    group: 'data',
    uiSchema: {},
});

// 新增记录事件
eventFlowManager.addEvent({
    name: 'block:demo:create',
    title: '新增记录',
    group: 'data',
    uiSchema: {},
});

// --- 定义事件流 ---
eventFlowManager.addFlow({
    key: 'refreshFlow',
    title: '刷新数据流程',
    on: {
        event: 'block:demo:refresh',
        title: '当刷新按钮被点击时',
    },
    steps: [
        {
            key: 'step-refresh',
            action: 'refreshData',
            title: '刷新数据',
        },
    ],
});

eventFlowManager.addFlow({
    key: 'viewFlow',
    title: '查看记录流程',
    on: {
        event: 'block:demo:view',
        title: '当查看按钮被点击时',
    },
    steps: [
        {
            key: 'step-view',
            action: 'viewRecord',
            title: '查看记录',
        },
    ],
});

eventFlowManager.addFlow({
    key: 'createFlow',
    title: '新增记录流程',
    on: {
        event: 'block:demo:create',
        title: '当新增按钮被点击时',
    },
    steps: [
        {
            key: 'step-create',
            action: 'createRecord',
            title: '新增记录',
        },
    ],
});

// --- 定义 Action ---
eventFlowManager.addAction({
    name: 'refreshData',
    title: '获取数据',
    group: 'data',
    handler: async (params, ctx) => {
        if (ctx.payload?.refresh) {
            await ctx.payload.refresh();
            ctx.payload?.hooks.message.success(params.messageOnSuccess || '数据已刷新');
        }
    },
    uiSchema: {
        messageOnSuccess: { type: 'string', title: '成功提示信息', default: '刷新成功' },
    },
});

eventFlowManager.addAction({
    name: 'viewRecord',
    title: '查看记录',
    group: 'data',
    handler: async (params, ctx) => {
        console.log('查看记录:', ctx.payload?.record);
        ctx.payload?.hooks.message.info(`查看记录 ID: ${ctx.payload?.record.id}`);
    },
    uiSchema: {},
});

eventFlowManager.addAction({
    name: 'createRecord',
    title: '新增记录',
    group: 'data',
    handler: async (params, ctx) => {
        console.log('新增记录');
    },
    uiSchema: {},
});

// 定义配置相关事件
// 配置
eventFlowManager.addEvent({
    name: 'block:configure:click',
    title: '配置参数',
    group: 'configure',
    uiSchema: {},
});

eventFlowManager.addFlow({
    key: 'block:demo:configure',
    title: '配置流程',
    on: {
        event: 'block:configure:click',
        title: '当配置按钮被点击时',
    },
    steps: [
        {
            key: 'step-configure',
            title: '配置消息参数',
            action: 'configureAction',
            isAwait: true,
        },
    ],
});

eventFlowManager.addAction(configureAction);

// --- 定义过滤器 ---
// 加载配置数据
const configDataFilter: IFilter = {
    name: 'block:common:configData',
    group: 'block',
    title: '加载配置数据',
    uiSchema: {},
    handler: async (input, params, context) => {
        const result = input || {};
        const { apiClient, configKey } = context.payload;

        if (!configKey) {
            result.blockConfig = null;
            return result;
        }

        const { data } = await apiClient.resource('blockConfigs').get({
            filterByTk: configKey
        });

        context.meta.params = context.meta.params || {};
        _.merge(context.meta.params, data?.data?.configData?.filterSteps || {});

        result.blockConfig = data?.data || null;

        return result;
    },
};

// linkages过滤器
const linkagesFilter: IFilter = {
    name: 'block:common:linkages',
    group: 'block',
    title: '联动规则',
    uiSchema: {
        rule: {
            type: 'string',
            title: '联动规则',
            'x-component': 'Input',
            'x-component-props': {
                placeholder: '值设置为{{true}}时，表格将隐藏'
            }
        }
    },
    handler: (input, params, context) => {
        const result = input || {};
        const compile = context.payload?.compile;
        if (compile(params?.rule) === true) {
            result.$break = true;
        }
        return result;
    },
};

// 获取字段配置
const fieldsFilter: IFilter = {
    name: 'block:common:fields',
    group: 'block',
    title: '获取字段配置',
    uiSchema: {
        fields: {
          type: 'array',
          title: '显示列',
          'x-component': 'Select',
          'x-component-props': {
            mode: 'multiple',
            options: [
              { label: 'ID', value: 'id' },
              { label: '姓名', value: 'name' },
              { label: '年龄', value: 'age' },
              { label: '邮箱', value: 'email' },
            ],
          },
        },
      },
    handler: (input, params, context) => {
        const result = input || {};
        result.fields = params?.fields || [];
        return result;
    },
};

// 获取操作配置
const actionsFilter: IFilter = {
    name: 'block:common:actions',
    group: 'block',
    title: '获取操作配置',
    uiSchema: {},
    handler: (input, params, context) => {
        const result = input || {};
        result.actions = params?.actions || { toolbar: [], row: [] };
        return result;
    },
};

// 获取数据
const dataFilter: IFilter = {
    name: 'block:common:data',
    group: 'block',
    title: '获取数据',
    uiSchema: {
        pageSize: {
            type: 'number',
            title: '默认每页条数',
            enum: [5, 10, 20, 30, 40, 50],
            'x-component': 'Select',
            'x-component-props': {
                placeholder: '请选择默认每页条数',
                options: [
                    { label: '5', value: 5 },
                    { label: '10', value: 10 },
                    { label: '20', value: 20 },
                    { label: '30', value: 30 },
                    { label: '40', value: 40 },
                    { label: '50', value: 50 },
                ]
            }
        }
    },
    handler: async (input, params, context) => {
        const result = input || {};
        const { apiClient } = context.payload;
        const { collectionName, page = 1, pageSize = 10 } = params;
        const response = await apiClient.resource(collectionName).list({
            page,
            pageSize,
        });
        result.data = response?.data || {};
        result.page = response?.data?.meta?.page || 1;
        result.pageSize = response?.data?.meta?.pageSize || 10;

        return result;
    },
};

// 转换为表格列
const tableColumnsFilter: IFilter = {
    name: 'block:demo:columns',
    group: 'demo',
    title: '转换表格列',
    uiSchema: {},
    handler: (input, params, context) => {
        const result = input || {};
        const fields = result.fields || [];

        // 将字段转换为表格列配置
        result.columns = fields.filter(field => field.visible !== false).map(field => ({
            title: field,
            dataIndex: field,
            key: field,
        }));

        return result;
    }
};

// 转换为表格操作
const tableActionsFilter: IFilter = {
    name: 'block:demo:actions',
    group: 'demo',
    title: '转换表格操作',
    uiSchema: {},
    handler: (input, params, context) => {
        const result = input || {};
        const { actions, hooks } = result;

        if (!actions) {
            result.tableActions = { toolbar: [], row: [] };
            return result;
        }

        // 工具栏操作
        result.tableActions = {
            toolbar: actions.toolbar.map(action => ({
                ...action,
                icon: action.icon === 'PlusOutlined' ? <PlusOutlined /> :
                    action.icon === 'RedoOutlined' ? <RedoOutlined /> : null,
                onClick: () => {
                    eventBus.dispatchEvent(action.event, {
                        payload: {
                            refresh: context.payload.refresh,
                            hooks: hooks
                        },
                        meta: {
                            stepParams: result.configData?.eventSteps?.[action.event.split(':')[2] + 'Flow'] || {}
                        }
                    });
                }
            })),

            // 行操作
            row: actions.row.map(action => ({
                ...action,
                icon: action.icon === 'EyeOutlined' ? <EyeOutlined /> : null,
                render: (_, record) => (
                    <Button
                        type="link"
                        icon={action.icon === 'EyeOutlined' ? <EyeOutlined /> : null}
                        onClick={() => {
                            eventBus.dispatchEvent(action.event, {
                                payload: {
                                    record,
                                    refresh: context.payload.refresh,
                                    hooks: hooks
                                },
                                meta: {
                                    stepParams: result.configData?.eventSteps?.[action.event.split(':')[2] + 'Flow'] || {}
                                }
                            });
                        }}
                    >
                        {action.title}
                    </Button>
                )
            }))
        };

        // 如果有行操作，添加操作列
        if (result.tableActions.row.length > 0) {
            result.columns.push({
                title: '操作',
                key: 'action',
                render: (_, record) => (
                    <Space size="small">
                        {result.tableActions.row.map(action => action.render(_, record))}
                    </Space>
                ),
            });
        }

        return result;
    }
};

// 注册过滤器
filterFlowManager.addFilter(configDataFilter);
filterFlowManager.addFilter(linkagesFilter);
filterFlowManager.addFilter(fieldsFilter);
filterFlowManager.addFilter(actionsFilter);
filterFlowManager.addFilter(dataFilter);
filterFlowManager.addFilter(tableColumnsFilter);
filterFlowManager.addFilter(tableActionsFilter);

// 注册过滤流程
filterFlowManager.addFlow({
    key: 'block:demo:table',
    title: '表格区块filterflow',
    steps: [
        {
            key: 'block:common:configData',
            filterName: 'block:common:configData',
            title: '数据配置' //写死的，不放开配置
        },
        {
            key: 'block:common:linkages',
            filterName: 'block:common:linkages',
            title: '联动规则' // 配置规则，是否显示表格
        },
        {
            key: 'block:common:fields',
            filterName: 'block:common:fields',
            title: '字段配置', // 配置显示列
        },
        {
            key: 'block:common:actions',
            filterName: 'block:common:actions',
            title: '操作配置' // 配置操作
        },
        {
            key: 'block:common:data',
            filterName: 'block:common:data',
            title: '数据配置' // 数据加载
        },
        {
            key: 'block:demo:columns',
            filterName: 'block:demo:columns',
            title: '表格列配置' // 表格列转换，不放开配置
        },
        {
            key: 'block:demo:actions',
            filterName: 'block:demo:actions',
            title: '表格操作配置' // 表格操作转换，不放开配置
        }
    ]
});

const updateStepConfig = function(type: 'event' | 'filter', flowName: string, stepKey: string, setConfigs?) {
    const flow = type === 'event' ? eventFlowManager.getFlow(flowName) : filterFlowManager.getFlow(flowName);
    const step = flow.getStep(stepKey);

    eventBus.dispatchEvent('block:configure:click', {
        payload: {
            step,
            currentParams: mockBlockConfigs.configData[`${type}Steps`][flowName][stepKey],
            onChange: (value) => {
                _.set(mockBlockConfigs.configData[`${type}Steps`][flowName], stepKey, value);
                setConfigs?.(mockBlockConfigs, true);
            }
        }
    });
}

// 更改配置的按钮，真实场景中用x-settings
const ConfigureButtons = () => {
    const { setConfigs } = useBlockConfigs();
    
    return (
        <Space>
            <Button type="default" onClick={() => {
                updateStepConfig('filter', 'block:demo:table', 'block:common:fields', setConfigs);
            }}>配置显示列</Button>
            <Button type="default" onClick={() => {
                updateStepConfig('filter', 'block:demo:table', 'block:common:linkages', setConfigs);
            }}>联动规则</Button>
            <Button type="default" onClick={() => {
                updateStepConfig('filter', 'block:demo:table', 'block:common:data', setConfigs);
            }}>默认每页条数</Button>
        </Space>
    );
};

// 主表格组件
const DemoTable: React.FC<{ configKey: string }> = ({ configKey }) => {
    const compile = useCompile();
    const filterContext = {
        payload: {
            configKey,
            apiClient: mockApiClient,
            compile,
        }
    };

    const { data: filterResult } = useApplyFilters(filterFlowManager, 'block:demo:table', null, filterContext);

    const {
        columns = [],
        data = { data: [], meta: { count: 0 } },
        tableActions = { toolbar: [], row: [] },
        page = 1,
        pageSize = 10,
        $break = false
    } = filterResult || {};

    

    return (
        <>
            {
                $break ? null : (
                    <Table dataSource={data?.data} columns={columns} rowKey="id" pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: data?.meta?.count || 0,
                    }} />
                )
            }
        </>
    );
};

// 主组件
const EventFilterTableDemo2: React.FC = () => {
    return (
        <App>
            <BlockConfigsProvider value={mockBlockConfigs}>
                <SchemaComponentProvider>
                    <ConfigureButtons />
                    <SchemaComponent
                        schema={{
                            type: 'void',
                            name: 'demoTable',
                            'x-component': 'div',
                            properties: {
                                table: {
                                    type: 'void',
                                    'x-component': 'DemoTable',
                                    'x-component-props': {
                                        configKey: mockBlockConfigs.key
                                    }
                                }
                            }
                        }}
                        components={{
                            DemoTable
                        }}
                    />
                </SchemaComponentProvider>
            </BlockConfigsProvider>
        </App>
    );
};

export default EventFilterTableDemo2;
