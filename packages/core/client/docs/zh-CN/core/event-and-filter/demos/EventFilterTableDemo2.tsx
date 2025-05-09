import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Space, Card, App, Spin } from 'antd';
import { RedoOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import {
    EventBus,
    EventFlowManager,
    FilterFlowManager,
    EventContext,
    FilterHandlerContext,
    IFilter,
    useApplyFilters,
    BlockConfigsProvider
} from '@nocobase/client';
import _ from 'lodash';

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
                'block:common:title': {
                    title: '用户表格',
                    description: '这是一个使用event和filter的简单表格demo'
                },
                'block:common:fields': {
                    fields: [
                        { name: 'id', title: 'ID', type: 'number', visible: true },
                        { name: 'name', title: '姓名', type: 'string', visible: true },
                        { name: 'age', title: '年龄', type: 'number', visible: true },
                        { name: 'email', title: '邮箱', type: 'string', visible: true }
                    ]
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
        console.log('执行 refreshData action，参数:', params);
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
    uiSchema: {},
    handler: (input, params, context) => {
        const result = input || {};
        const compile = context.payload?.compile;
        if (compile(params.linkages)) {
            result.$break = true;
        }
        return result;
    },
};

// 标题过滤器
const titleFilter: IFilter = {
    name: 'block:common:title',
    group: 'block',
    title: '获取标题信息',
    uiSchema: {},
    handler: (input, params, context) => {
        const result = input || {};
        result.title = params?.title || '';
        result.description = params?.description || '';
        return result;
    },
};

// 获取字段配置
const fieldsFilter: IFilter = {
    name: 'block:common:fields',
    group: 'block',
    title: '获取字段配置',
    uiSchema: {},
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
    uiSchema: {},
    handler: async (input, params, context) => {
        const result = input || {};
        const { apiClient } = context.payload;
        const { collectionName, page = 1, pageSize = 10 } = params as { collectionName: string; page?: number; pageSize?: number };

        if (!collectionName) {
            result.data = { data: [], meta: { count: 0, page, pageSize } };
            return result;
        }

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
            title: field.title,
            dataIndex: field.name,
            key: field.name,
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
filterFlowManager.addFilter(titleFilter);
filterFlowManager.addFilter(fieldsFilter);
filterFlowManager.addFilter(actionsFilter);
filterFlowManager.addFilter(dataFilter);
filterFlowManager.addFilter(tableColumnsFilter);
filterFlowManager.addFilter(tableActionsFilter);

// 注册过滤流程
filterFlowManager.addFlow({
    key: 'block:demo:table',
    title: '表格区块过滤流',
    steps: [
        {
            key: 'block:common:linkages',
            filterName: 'block:common:linkages'
        },
        {
            key: 'block:common:configData',
            filterName: 'block:common:configData'
        },
        {
            key: 'block:common:title',
            filterName: 'block:common:title'
        },
        {
            key: 'block:common:fields',
            filterName: 'block:common:fields'
        },
        {
            key: 'block:common:actions',
            filterName: 'block:common:actions'
        },
        {
            key: 'block:common:data',
            filterName: 'block:common:data'
        },
        {
            key: 'block:demo:columns',
            filterName: 'block:demo:columns'
        },
        {
            key: 'block:demo:actions',
            filterName: 'block:demo:actions'
        }
    ]
});

// 主表格组件
const DemoTable: React.FC<{ configKey: string }> = ({ configKey }) => {
    const filterContext = {
        payload: {
            configKey: configKey,
            apiClient: mockApiClient,
        }
    };

    // 应用过滤器
    const {
        data: filterResult,
        reApplyFilters
    } = useApplyFilters(
        filterFlowManager,
        'block:demo:table',
        null,
        filterContext
    );

    const {
        title,
        description,
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
                    <Card
                        title={title}
                        extra={
                            <Space>
                                {tableActions.toolbar?.map((action, index) => (
                                    <Button
                                        key={action.key || index}
                                        type={action.key === 'create' ? 'primary' : 'default'}
                                        icon={action.icon}
                                        onClick={action.onClick}
                                    >
                                        {action.title}
                                    </Button>
                                ))}
                            </Space>
                        }
                    >
                        <div>
                            {description && <p>{description}</p>}
                            <Table
                                dataSource={data?.data}
                                columns={columns}
                                rowKey="id"
                                pagination={{
                                    current: page,
                                    pageSize: pageSize,
                                    total: data?.meta?.count || 0,
                                }}
                            />
                        </div>
                    </Card>
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
                <DemoTable configKey={mockBlockConfigs.key} />
            </BlockConfigsProvider>
        </App>
    );
};

export default EventFilterTableDemo2;
