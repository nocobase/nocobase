/**
 * defaultShowCode: true
 * title: 错误回退 - 表格列（RenderFunction）
 */

import React from 'react';
import {
  Application,
  Plugin,
  TableModel,
  TableColumnModel,
  TableActionsColumnModel,
  CollectionActionModel,
  RecordActionModel,
  ReadPrettyFieldModel,
} from '@nocobase/client';
import { FlowEngineProvider, FlowModelProvider, FlowModelRenderer } from '@nocobase/flow-engine';
import { Card } from 'antd';
import { ErrorBoundary } from 'react-error-boundary';
import { FilterManager } from '../../../../../../client/src/flow/models/filter-blocks/filter-manager/FilterManager';
import { api } from './api';

// 自定义列：在单元格渲染函数中抛出异常，并用局部 ErrorBoundary 兜底，保留表格/列设置外壳
class ThrowTableColumnModel extends TableColumnModel {
  // 极简回退组件：仅提示 Error，保留列设置外壳
  private MinimalCellErrorFallback = () => (
    <span title={this.translate?.('Column error') || 'Column error'} style={{ color: '#fa541c' }}>
      {this.translate?.('Error') || 'Error'}
    </span>
  );

  // 在 ErrorBoundary 包裹的子组件中抛错，确保被边界捕获
  private ThrowingCell: React.FC = () => {
    throw new Error('Demo: 列单元格渲染失败（RenderFunction）');
  };

  render(): any {
    return () => {
      return (
        <FlowModelProvider model={this}>
          <ErrorBoundary FallbackComponent={this.MinimalCellErrorFallback}>
            <this.ThrowingCell />
          </ErrorBoundary>
        </FlowModelProvider>
      );
    };
  }
}

class DemoPlugin extends Plugin {
  table!: TableModel;

  async load() {
    // 强制显示设置入口
    this.flowEngine.flowSettings.forceEnable();
    // 提供 mock API，避免实际网络请求
    this.flowEngine.context.defineProperty('api', { value: api });

    // 简单数据源/集合
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID' },
        { name: 'username', type: 'string', title: 'Username' },
      ],
    });

    // 注册所需模型 + 自定义抛错列模型
    this.flowEngine.registerModels({
      TableModel,
      TableColumnModel,
      TableActionsColumnModel,
      CollectionActionModel,
      RecordActionModel,
      ReadPrettyFieldModel,
      ThrowTableColumnModel,
    });

    // 创建 TableModel：包含一个正常字段列和一个抛错列
    this.table = this.flowEngine.createModel({
      use: 'TableModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
      subModels: {
        columns: [
          {
            use: 'TableColumnModel',
            stepParams: {
              fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'username' } },
            },
            subModels: {
              field: {
                use: 'ReadPrettyFieldModel',
                stepParams: {
                  fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'username' } },
                },
              },
            },
          },
          {
            use: 'ThrowTableColumnModel',
            stepParams: {
              // 列标题
              tableColumnSettings: {
                init: {},
              },
            },
          },
        ],
      },
    }) as TableModel;

    // 提供 filterManager，避免刷新流程绑定时报错
    this.table.context.defineProperty('filterManager', { value: new FilterManager(this.table) });

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <div style={{ padding: 16 }}>
            <Card title="表格列（RenderFunction）抛错演示">
              {/* 打开错误回退与设置入口，观察抛错列的单元格局部回退效果 */}
              <FlowModelRenderer model={this.table} showFlowSettings showErrorFallback />
            </Card>
          </div>
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
}).getRootComponent();
