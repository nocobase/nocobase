import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button, Space, Card, Modal, App, Typography, Divider, Spin } from 'antd';
import { DeleteOutlined, RedoOutlined, SettingOutlined } from '@ant-design/icons';
import {
  EventBus,
  EventFlowActionOptions,
  EventFlowManager,
  FilterFlowManager,
  EventContext,
  FilterHandlerContext,
  IFilter,
  useTabulatorBuiltinStyles,
  useTabulatorStyles,
  useApplyFilters,
} from '@nocobase/client';
import { configureAction } from './actions/open-configure-dialog';
import { useCompile } from '@nocobase/client';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import ReactDOM from 'react-dom/client';

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
    // 通过 ctx.payload?.hooks.setState 更新 React 组件的状态
    ctx.payload?.hooks.setState([...initialData]);
    ctx.payload?.hooks.message.success(params.messageOnSuccess || '数据已刷新');
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
      ctx.payload?.hooks.message.warn('请先选择要删除的行');
      return;
    }
    Modal.confirm({
      title: params.confirmTitle || '确认删除',
      content: params.confirmContent || '确定要删除选中的记录吗？',
      onOk: () => {
        const idsToDelete = selectedData.map((item) => item.id);
        console.log('Deleting IDs:', idsToDelete);
        // 更新 React 状态
        ctx.payload?.hooks.setState((currentData) => currentData.filter((item) => !idsToDelete.includes(item.id)));
        ctx.payload?.hooks.message.success(`成功删除 ${idsToDelete.length} 条记录`);
      },
    });
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
      ctx.payload?.hooks.message.error('未找到记录');
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
const showInitialColumnsFilter: IFilter = {
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
      { title: '年龄', field: 'age', hozAlign: 'left', headerFilter: 'input' },
      { title: '邮箱', field: 'email', headerFilter: 'input' },
    ];
    if (columns.length > 0) {
      result.columns = result.columns.filter((column) => columns.includes(column.field));
    }
    result.columns = [
      {
        formatter: 'rowSelection',
        titleFormatter: 'rowSelection',
        hozAlign: 'center',
        headerSort: false,
        width: 40,
      },
      ...result.columns,
    ];
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

const addActionColumnFilter: IFilter = {
  name: 'addActionColumn',
  title: '添加操作列',
  group: 'columns',
  handler: (currentValue, params, ctx) => {
    if (params?.show !== true) {
      return currentValue; // If parameter configures not to show, don't add
    }
    const result = currentValue || {};
    result.columns = result.columns || [];

    const actionColumn: ColumnDefinition = {
      title: '操作',
      field: '__actions', // Virtual field
      hozAlign: 'center',
      headerSort: false,
      width: 100,
      formatter: (cell, formatterParams, onRendered) => {
        // formatter需要返回原始DOM，否则会报错，这里返回undefined, 然后利用onRendered来渲染React组件
        onRendered(() => {
          const cellEl = cell.getElement(); // Get the cell's DOM element
          const rowData = cell.getRow().getData();
          const root = ReactDOM.createRoot(cellEl);
          const handleClick = (e) => {
            e.stopPropagation(); // 防止触发行点击事件
            console.log('React Button Clicked for row:', rowData);
            // 使用事件总线分发事件
            eventBus.dispatchEvent('viewRecord', { payload: { record: rowData, hooks: ctx.payload.hooks } });
          };

          root.render(
            <Button type="link" size="small" onClick={handleClick}>
              查看
            </Button>,
          );

          return () => {
            setTimeout(() => {
              try {
                root.unmount();
              } catch (error) {
                console.error('Error unmounting React root from Tabulator cell:', error);
              }
            }, 0);
          };
        });
        return null;
      },
    };
    result.columns.push(actionColumn);
    return result;
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
// 配置
eventFlowManager.addEventGroup({
  name: 'configure',
  title: '配置',
});

eventFlowManager.addEvent({
  name: 'configure:click',
  title: '配置按钮点击',
  group: 'configure',
  uiSchema: {},
});

eventFlowManager.addFlow({
  key: 'configure-flow',
  title: '配置流程',
  on: {
    event: 'configure:click',
    title: '当配置按钮被点击时',
  },
  steps: [
    {
      key: 'configure-step',
      title: '配置消息参数',
      action: 'configureAction',
      isAwait: true,
    },
  ],
});

eventFlowManager.addEventGroup({
  name: 'data',
  title: '数据',
});

eventFlowManager.addEvent({
  name: 'tabulator:refresh',
  title: '刷新表格数据',
  group: 'data',
  uiSchema: {},
});

eventFlowManager.addFlow({
  key: 'refreshFlow',
  title: '刷新表格数据',
  on: { event: 'tabulator:refresh' },
  steps: [
    {
      key: 'step1',
      action: 'fetchData',
      title: '获取最新数据',
    },
  ],
});

eventFlowManager.addEvent({
  name: 'deleteSelected',
  title: '删除选中行',
  group: 'data',
  uiSchema: {},
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
    },
  ],
});

eventFlowManager.addEvent({
  name: 'viewRecord',
  title: '查看行详情',
  group: 'data',
  uiSchema: {},
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
    {
      key: 'step1',
      filterName: 'showInitialColumns',
      title: '显示基础列',
    },
    {
      key: 'step2',
      filterName: 'addActionColumn',
      title: '添加操作列',
    },
  ],
});

const EventFilterTableDemo: React.FC = (props) => {
  useTabulatorBuiltinStyles();
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const tableContainerRef = useRef(null); // Ref for the div container
  const tabulatorInstanceRef = useRef<Tabulator | null>(null); // Ref for the Tabulator instance
  const compile = useCompile();
  const { message: messageApi } = App.useApp();
  const { styles } = useTabulatorStyles();
  const hooks = useMemo(() => ({ compile, message: messageApi, setState: setTableData }), [compile, messageApi]);
  const [eventFlowParams, setEventFlowParams] = useState({
    actionParams: [
      {
        flow: 'deleteFlow',
        event: 'deleteSelected',
        params: {
          step1: {
            confirmTitle: '确认删除',
            confirmContent: '确定要删除选中的记录吗？',
          },
        },
      },
      {
        flow: 'refreshFlow',
        event: 'tabulator:refresh',
        params: {
          step1: {
            messageOnSuccess: '刷新成功！',
          },
        },
      },
    ],
  });
  const [filterFlowParams, setFilterFlowParams] = useState({
    step1: {
      show: true,
    },
    step2: {
      show: true,
    },
  });

  const tableOptions = useMemo(
    () => ({
      selectable: true,
      layout: 'fitDataFill' as const,
      responsiveLayout: 'hide' as const,
      pagination: true,
      paginationSizeSelector: [10, 20, 50, 100],
      movableColumns: true,
      placeholder: '暂无数据',
      paginationButtonCount: 5,
      paginationCounter: 'rows' as const,
      paginationSize: 10,
      // columns: generateColumnsFromData(tableData),
      // data: tableData
    }),
    [],
  );

  const filterContext: FilterHandlerContext = useMemo(
    () => ({
      payload: {
        hooks: hooks,
      },
      meta: {
        flowKey: 'tabulator:columns',
        params: filterFlowParams,
      },
    }),
    [hooks, filterFlowParams],
  );

  const tableColumns = useApplyFilters(filterFlowManager, 'tabulator:columns', {}, filterContext);

  // 初始化和刷新数据
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const context: EventContext = {
      payload: {
        hooks: hooks,
      },
      meta: eventFlowParams,
    };
    try {
      await eventFlowManager.dispatchEvent('tabulator:refresh', context);
    } catch (error) {
      console.error('Error dispatching tabulator:refresh event:', error);
      hooks.message.error('刷新数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [hooks, eventFlowParams]);

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
      meta: eventFlowParams,
    };
    eventBus.dispatchEvent('deleteSelected', context);
  }, [hooks, eventFlowParams]);

  const configureFilterStep = (flowName: string, stepKey: string) => {
    const step = filterFlowManager.getFlow(flowName).getStep(stepKey);
    const context: EventContext = {
      payload: {
        step,
        onChange: (value) => {
          setFilterFlowParams((prev) => ({
            ...prev,
            [stepKey]: value,
          }));
        },
      },
    };
    eventBus.dispatchEvent('configure:click', context);
  };

  const configureActionStep = (flowName: string, stepKey: string) => {
    const step = eventFlowManager.getFlow(flowName).getStep(stepKey);
    const context: EventContext = {
      payload: {
        step,
        onChange: (value) => {
          // step.set('params', value);
          setEventFlowParams((prev) => {
            const newParams = {
              ...prev,
              actionParams: [...prev.actionParams],
            };
            const stepsParams = newParams.actionParams.find((item) => item.flow === flowName)?.params;
            if (stepsParams) {
              stepsParams[stepKey] = value;
            }
            return newParams;
          });
        },
      },
    };
    eventBus.dispatchEvent('configure:click', context);
  };

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
          columns: tableColumns,
          data: tableData,
        });

        tabulator.on('tableBuilt', function () {
          console.log('Table built completed, Tabulator instance is ready');
          tabulatorInstanceRef.current = tabulator;
          tabulatorInstanceRef.current['_initialized'] = true;
        });
      } catch (error) {
        console.error('Error initializing Tabulator:', error);
        hooks.message.error('表格初始化失败');
      }
    }

    // 清理函数
    return () => {
      if (tabulatorInstanceRef.current) {
        tabulatorInstanceRef.current.destroy();
        tabulatorInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableOptions, tableColumns, tableData]); // 依赖列配置，确保列配置加载后再初始化

  // 监听数据变化，更新 Tabulator
  useEffect(() => {
    if (tabulatorInstanceRef.current) {
      console.log('Updating Tabulator data...');
      try {
        // 确保表格实例已经完全准备好
        if (tabulatorInstanceRef.current['_initialized']) {
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
    refreshData();
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
