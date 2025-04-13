import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button, Space, Card, Modal, Form, Input, App, Typography, Checkbox, Divider, Popover, Spin } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, RedoOutlined, SettingOutlined } from '@ant-design/icons';
import { EventBus, defaultListenerCondition } from './libs/event-bus';
import { EventFlowActionOptions, EventFlowManager } from './libs/eventflow-manager';
import { FilterFlowManager } from './libs/filterflow-manager';
import { EventContext, EventListener, EventListenerOptions, FilterContext, Filter, Unsubscriber } from './libs/types';
import { configureAction } from './actions/open-configure-dialog';
import { openSimpleDialogAction } from './actions/open-simple-dialog';
import { openNotificationAction } from './actions/open-notification';
import { useAddEventListener, useDispatchEvent, useTabulatorBuiltinStyles, useTabulatorStyles } from './libs/hooks';
import { SchemaComponent, useAPIClient, useActionContext, useCompile, useRequest } from '@nocobase/client';
import { ISchema } from '@formily/react';
import { createForm } from '@formily/core';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';

const eventBus = new EventBus();
const eventFlowManager = new EventFlowManager(eventBus);
const filterFlowManager = new FilterFlowManager();

// --- Mock 数据 ---
const initialData = [
  { id: 1, name: '张三', age: 30, email: 'zhangsan@example.com' },
  { id: 2, name: '李四', age: 25, email: 'lisi@example.com' },
  { id: 3, name: '王五', age: 35, email: 'wangwu@example.com' },
];

// --- Action 定义 ---
const fetchDataAction: EventFlowActionOptions = {
  name: 'fetchData',
  title: '获取数据',
  group: 'data',
  handler: async (params, ctx) => {
    console.log('Executing fetchData action with params:', params);
    // 实际应用中这里会发起 API 请求
    await new Promise((resolve) => setTimeout(resolve, 300)); // 模拟网络延迟
    // 通过 ctx.hooks.setState 更新 React 组件的状态
    ctx.hooks.setState(initialData);
    ctx.hooks.message.success('数据已刷新');
    return initialData; // 返回数据用于后续步骤
  },
  uiSchema: {
    messageOnSuccess: { type: 'string', title: '成功提示信息', 'x-component': 'Input' },
  },
};

const deleteDataAction: EventFlowActionOptions = {
  name: 'deleteData',
  title: '删除数据',
  group: 'data',
  handler: async (params, ctx) => {
    console.log('Executing deleteData action with params:', params, 'context:', ctx);
    const selectedData = ctx.payload.selectedData || [];
    if (!selectedData.length) {
      ctx.hooks.message.warn('请先选择要删除的行');
      return;
    }
    const idsToDelete = selectedData.map((item) => item.id);
    console.log('Deleting IDs:', idsToDelete);
    // 更新 React 状态
    ctx.hooks.setState((currentData) => currentData.filter((item) => !idsToDelete.includes(item.id)));
    ctx.hooks.message.success(`成功删除 ${idsToDelete.length} 条记录`);
  },
  uiSchema: {
    confirmTitle: { type: 'string', title: '确认弹窗标题', 'x-component': 'Input' },
    confirmContent: { type: 'string', title: '确认弹窗内容', 'x-component': 'Input' },
  },
};

const openViewDialogAction: EventFlowActionOptions = {
  name: 'openViewDialog',
  title: '打开查看弹窗',
  group: 'ui',
  handler: async (params, ctx) => {
    console.log('Executing openViewDialog action with params:', params, 'context:', ctx);
    const record = ctx.payload.record;
    if (!record) {
      ctx.hooks.message.error('未找到记录');
      return;
    }
    // 使用 Antd Modal 显示详情
    Modal.info({
      title: `查看详情 (ID: ${record.id})`,
      content: (
        <div>
          <p>
            <strong>姓名:</strong> {record.name}
          </p>
          <p>
            <strong>年龄:</strong> {record.age}
          </p>
          <p>
            <strong>邮箱:</strong> {record.email}
          </p>
        </div>
      ),
      onOk() {},
    });
  },
  uiSchema: {
    modalTitle: { type: 'string', title: '弹窗标题', 'x-component': 'Input' },
  },
};

// 注册 Actions
eventFlowManager.addActionGroup({ name: 'data', title: '数据操作' });
eventFlowManager.addActionGroup({ name: 'ui', title: '界面交互' });
eventFlowManager.addAction(fetchDataAction);
eventFlowManager.addAction(deleteDataAction);
eventFlowManager.addAction(openViewDialogAction);
eventFlowManager.addAction(configureAction); // 配置Action

// --- Filter 定义 ---
const showInitialColumnsFilter: Filter = {
  name: 'showInitialColumns',
  title: '显示初始列',
  group: 'columns',
  sort: 1,
  handler: (currentValue, params, ctx) => {
    const result = currentValue || {};
    const columns = params?.columns || [];
    result.columns = [
      { title: 'ID', field: 'id', width: 80, headerFilter: 'input' },
      { title: '姓名', field: 'name', headerFilter: 'input' },
      { title: '年龄', field: 'age', hozAlign: 'left', formatter: 'progress', headerFilter: 'input' },
      { title: '邮箱', field: 'email', headerFilter: 'input' },
    ];
    if (columns.length > 0) {
      result.columns = result.columns.filter((column) => columns.includes(column.field));
    }
    return result;
  },
  uiSchema: {
    columns: {
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
};

const addActionColumnFilter: Filter = {
  name: 'addActionColumn',
  title: '添加操作列',
  group: 'columns',
  sort: 2,
  handler: (currentValue, params, ctx) => {
    if (params?.show !== true) {
      return currentValue; // 如果参数配置不显示，则不添加
    }
    const actionColumn = {
      title: '操作',
      field: '__actions', // 虚拟字段
      hozAlign: 'center',
      headerSort: false,
      // Tabulator 的 formatter 返回 HTML 或 DOM 节点
      formatter: (cell, formatterParams, onRendered) => {
        const button = document.createElement('button');
        button.innerText = '查看';
        button.style.padding = '2px 5px';
        button.style.cursor = 'pointer';
        button.onclick = (e) => {
          e.stopPropagation(); // 阻止事件冒泡，避免触发行点击等
          const rowData = cell.getRow().getData();
          eventBus.dispatchEvent('viewRecord', { payload: { record: rowData, hooks: ctx.payload.hooks } });
        };
        return button;
      },
    };
    return [...currentValue, actionColumn];
  },
  uiSchema: {
    show: {
      type: 'boolean',
      title: '是否显示操作列',
      'x-decorator': 'FormItem',
      'x-component': 'Switch',
      default: true,
    },
  },
};

// 注册 Filters
filterFlowManager.addFilterGroup({ name: 'columns', title: '列配置' });
filterFlowManager.addFilter(showInitialColumnsFilter);
filterFlowManager.addFilter(addActionColumnFilter);

// --- EventFlow 定义 ---
eventFlowManager.addFlow({
  key: 'refreshFlow',
  title: '刷新表格数据',
  on: { event: 'refreshTable' },
  steps: [{ key: 'step1', action: 'fetchData', title: '获取最新数据', params: { messageOnSuccess: '刷新成功！' } }],
});

eventFlowManager.addFlow({
  key: 'deleteFlow',
  title: '删除选中行数据',
  on: { event: 'deleteSelected' },
  steps: [
    {
      key: 'step1',
      action: 'deleteData',
      title: '执行删除',
      params: { confirmTitle: '确认删除', confirmContent: '确定要删除选中的记录吗？' },
    },
  ],
});

eventFlowManager.addFlow({
  key: 'viewFlow',
  title: '查看行详情',
  on: { event: 'viewRecord' },
  steps: [{ key: 'step1', action: 'openViewDialog', title: '打开弹窗' }],
});

// --- FilterFlow 定义 ---
filterFlowManager.addFlow({
  name: 'tabulator:columns',
  title: '表格列展示流程',
  steps: [
    { key: 'step1', filterName: 'showInitialColumns', title: '显示基础列' },
    { key: 'step2', filterName: 'addActionColumn', title: '添加操作列', params: { show: true } }, // 默认显示操作列
  ],
});

// --- React 组件 ---
const EventFilterTableDemo: React.FC = () => {
  useTabulatorBuiltinStyles();
  const [tableData, setTableData] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // 注意：Tabulator 的 rowSelectionChanged 回调会提供选中的数据，
  // 但我们主要通过实例的 getSelectedData 获取，所以这里可以不用 state 存储
  // const [selectedRows, setSelectedRows] = useState([]);
  const tableContainerRef = useRef(null); // Ref for the div container
  const tabulatorInstanceRef = useRef<Tabulator | null>(null); // Ref for the Tabulator instance
  const compile = useCompile();
  const { message: messageApi } = App.useApp();
  const { styles } = useTabulatorStyles();
  const hooks = useMemo(() => ({ compile, message: messageApi, setState: setTableData }), [compile, messageApi]);

  const tableOptions = useMemo(
    () => ({
      selectable: true,
      layout: 'fitColumns',
      responsiveLayout: 'hide',
      pagination: true,
      paginationSizeSelector: [10, 20, 50, 100],
      movableColumns: true,
      placeholder: '暂无数据',
      paginationButtonCount: 5,
      paginationCounter: 'rows',
      // columns: generateColumnsFromData(tableData),
      // data: tableData
    }),
    [],
  );

  // 应用 FilterFlow 获取列配置
  const applyColumnFilter = useCallback(async () => {
    const context: FilterContext = {
      props: {},
      payload: {
        hooks: hooks,
      },
    };
    try {
      const finalColumns = await filterFlowManager.applyFilters('tabulator:columns', [], context);
      console.log('Applying filter flow result:', finalColumns);
      setTableColumns(finalColumns);
    } catch (error) {
      console.error('Error applying filter flow:', error);
      hooks.message.error('应用列配置失败');
    }
  }, [hooks]);

  // 初始化和刷新数据
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const context: EventContext = {
      payload: {
        hooks: hooks,
      },
    };
    try {
      await eventFlowManager.dispatchEvent('refreshTable', context);
    } catch (error) {
      console.error('Error dispatching refreshTable event:', error);
      hooks.message.error('刷新数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [hooks]);

  // 删除选中行
  const deleteSelectedRows = useCallback(() => {
    if (!tabulatorInstanceRef.current) {
      hooks.message.error('表格尚未初始化');
      return;
    }
    // 从 Tabulator 实例获取选中行数据
    const selectedData = tabulatorInstanceRef.current.getSelectedData();

    if (!selectedData.length) {
      hooks.message.warning('请先选择要删除的行');
      return;
    }

    const context: EventContext = {
      payload: {
        selectedData: selectedData,
        hooks,
      },
    };
    eventBus.dispatchEvent('deleteSelected', context);
  }, [hooks]);

  // 配置指定步骤的参数
  const configureStep = (flowKey: string, stepKey: string) => {
    const context: EventContext = {
      payload: {
        flowKey,
        stepKey,
        hooks: { message: messageApi, compile, applyColumnFilter, refreshData },
      },
    };
    eventBus.dispatchEvent('openConfigureDialog', context);
  };

  const configureFilterStep = (flowName: string, stepKey: string) => {
    const step = filterFlowManager.getFlow(flowName).getStep(stepKey);
    const context: EventContext = {
      payload: {
        step,
        onChange: (value) => {
          step.set('params', value);
        },
      },
    };
    eventBus.dispatchEvent('openConfigureDialog', context);
  };

  const configureActionStep = (flowName: string, stepKey: string) => {
    const step = eventFlowManager.getFlow(flowName).getStep(stepKey);
    const context: EventContext = {
      payload: {
        step,
        onChange: (value) => {
          step.set('params', value);
        },
      },
    };
    eventBus.dispatchEvent('openConfigureDialog', context);
  };

  // 初始化 Tabulator
  // 注意：修复了 "Cannot read properties of null (reading 'firstChild')" 错误
  // 1. 使用 tableBuilt 事件确保 DOM 完全就绪后再操作 Tabulator
  // 2. 移除单独的列更新 effect，避免初始化后重复调用 setColumns 导致的竞态问题
  // 3. 每次列配置变更时创建全新的 Tabulator 实例，而不是尝试更新已有实例的列
  useEffect(() => {
    if (tableContainerRef.current && tableColumns.length > 0) {
      console.log('Initializing Tabulator...');

      // 如果已经有实例，先销毁它
      if (tabulatorInstanceRef.current) {
        console.log('Destroying previous Tabulator instance...');
        tabulatorInstanceRef.current.destroy();
        tabulatorInstanceRef.current = null;
      }

      try {
        const tabulator = new Tabulator(tableContainerRef.current, {
          ...tableOptions,
          columns: tableColumns, // 使用从 FilterFlow 获取的列
          data: tableData, // 使用 React 状态管理的数据
        });

        // 使用 tableBuilt 事件确保表格完全构建好后再存储引用
        tabulator.on('tableBuilt', function () {
          console.log('Table built completed, Tabulator instance is ready');
          tabulatorInstanceRef.current = tabulator;
        });
      } catch (error) {
        console.error('Error initializing Tabulator:', error);
        hooks.message.error('表格初始化失败');
      }
    }

    // 清理函数
    return () => {
      if (tabulatorInstanceRef.current) {
        console.log('Destroying Tabulator instance...');
        tabulatorInstanceRef.current.destroy();
        tabulatorInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableOptions, tableColumns]); // 依赖列配置，确保列配置加载后再初始化

  // 监听数据变化，更新 Tabulator
  useEffect(() => {
    if (tabulatorInstanceRef.current) {
      console.log('Updating Tabulator data...');
      try {
        // 确保表格实例已经完全准备好
        if (tabulatorInstanceRef.current.initialized) {
          tabulatorInstanceRef.current.setData(tableData);
        } else {
          console.log('Skip updating data, table not fully initialized yet');
        }
      } catch (error) {
        console.error('Error updating Tabulator data:', error);
      }
    }
  }, [tableData]);

  // 组件加载时应用列配置和加载数据
  useEffect(() => {
    setIsLoading(true);
    applyColumnFilter()
      .then(() => {
        refreshData(); // 在列配置完成后加载数据
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组确保只在挂载时执行一次

  return (
    <Card title="Event & Filter 结合示例 (Tabulator)">
      <Spin spinning={isLoading}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Title level={5}>配置区域</Typography.Title>
          <Space wrap>
            <Button icon={<SettingOutlined />} onClick={() => configureFilterStep('tabulator:columns', 'step2')}>
              配置操作列Filter
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => configureFilterStep('tabulator:columns', 'step1')}>
              配置显示列Filter
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => configureActionStep('refreshFlow', 'step1')}>
              配置刷新数据Action
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => configureActionStep('deleteFlow', 'step1')}>
              配置删除数据Action
            </Button>
          </Space>
          <Divider />

          <Typography.Title level={5}>全局操作</Typography.Title>
          <Space>
            <Button icon={<RedoOutlined />} onClick={refreshData}>
              刷新
            </Button>
            <Button icon={<DeleteOutlined />} danger onClick={deleteSelectedRows}>
              删除选中
            </Button>
          </Space>
          <Divider />

          <Typography.Title level={5}>表格区域</Typography.Title>
          {/* Tabulator 表格容器 */}
          <div className={styles.tabulatorWrapper}>
            <div ref={tableContainerRef} className={styles.container}></div>
          </div>
        </Space>
      </Spin>
    </Card>
  );
};

// 为了让 Antd 的 message API 可用，需要包裹 App 组件
const AppWrapper = () => (
  <App>
    <EventFilterTableDemo />
  </App>
);

export default AppWrapper;
