/**
 * defaultShowCode: true
 * title: 自定义列模型（并排对比）
 */

import React from 'react';
import { APIClient } from '@nocobase/sdk';
import { Application, Plugin, TableBlockModel, TableColumnModel } from '@nocobase/client';
import {
  FlowEngineProvider,
  FlowModel,
  FlowModelRenderer,
  defineFlow,
  resolveExpressions,
} from '@nocobase/flow-engine';
import { Card, Descriptions, Space, Typography } from 'antd';

// 自定义字段模型：根据 ctx.record.id 的奇偶动态设置颜色
class ColorTextFieldModel extends FlowModel {
  render() {
    const color = this.props.color || '#333';
    const text = this.props.text || '';
    return <span style={{ color }}>{text}</span>;
  }
}

ColorTextFieldModel.registerFlow(
  defineFlow({
    key: 'colorize',
    steps: {
      init: {
        defaultParams: { id: '{{ctx.record.id}}', username: '{{ctx.record.username}}' },
        async handler(ctx, params) {
          const id = Number(params.id);
          const username = String(params.username ?? '');
          const color = Number.isFinite(id) ? (id % 2 === 0 ? 'green' : 'tomato') : '#555';
          ctx.model.setProps({ color, text: `#${id} - ${username}` });
        },
      },
    },
  }),
);

const makeUsers = (count = 12) =>
  Array.from({ length: count }).map((_, i) => ({ id: i + 1, username: `user_${i + 1}`, email: `u${i + 1}@aa.com` }));

class DemoPlugin extends Plugin {
  async load() {
    const records = makeUsers(12);
    const baselineApi = new APIClient({ baseURL: 'https://demo.local/api' });
    const optimizedApi = new APIClient({ baseURL: 'https://demo.local/api' });

    // 计数（raw + unique）
    let setBase: React.Dispatch<React.SetStateAction<any>> | null = null;
    let setOpt: React.Dispatch<React.SetStateAction<any>> | null = null;
    const baseBuf: any = { total: 0, variablesResolve: 0, variablesUnique: 0, usersList: 0 };
    const optBuf: any = { total: 0, variablesResolve: 0, variablesUnique: 0, usersList: 0 };
    const baseSigs = new Set<string>();
    const optSigs = new Set<string>();
    const bump = (mode: 'baseline' | 'optimized', key: string) => {
      const buf = mode === 'baseline' ? baseBuf : optBuf;
      buf[key] = (buf[key] || 0) + 1;
      (mode === 'baseline' ? setBase : setOpt)?.((prev: any) => ({ ...prev, [key]: (prev?.[key] || 0) + 1 }));
    };

    const attachCounters = (mode: 'baseline' | 'optimized', api: APIClient) => {
      const origRequest = api.axios.request.bind(api.axios);
      api.axios.request = async (config: any) => {
        if (config?.url) bump(mode, 'total');
        const method = String(config?.method || 'get').toLowerCase();
        const url = String(config?.url || '');
        if (url === 'users:list' && method === 'get') {
          bump(mode, 'usersList');
          const page = Number(config?.params?.page || 1);
          const pageSize = Number(config?.params?.pageSize || 20);
          const start = (page - 1) * pageSize;
          const data = records.slice(start, start + pageSize);
          return Promise.resolve({ data: { data, meta: { page, pageSize, count: records.length } } } as any);
        }
        if (url === 'variables:resolve' && method === 'post') {
          bump(mode, 'variablesResolve');
          try {
            const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
            const template = body?.values?.template ?? body?.template ?? body;
            const sig = JSON.stringify(template);
            const sigs = mode === 'baseline' ? baseSigs : optSigs;
            if (!sigs.has(sig)) {
              sigs.add(sig);
              bump(mode, 'variablesUnique');
            }
            return Promise.resolve({ data: { data: template } } as any);
          } catch {
            return Promise.resolve({ data: { data: {} } } as any);
          }
        }
        return origRequest(config);
      };
    };
    attachCounters('baseline', baselineApi);
    attachCounters('optimized', optimizedApi);

    // 数据源/集合
    const dsm = this.flowEngine.context.dataSourceManager;
    dsm.getDataSource('main') || dsm.addDataSource({ key: 'main', displayName: 'Main' });
    dsm.getDataSource('main')!.addCollection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'bigInt', title: 'ID' },
        { name: 'username', type: 'string', title: 'Username' },
        { name: 'email', type: 'string', title: 'Email' },
      ],
    });

    this.flowEngine.registerModels({ TableBlockModel, TableColumnModel, ColorTextFieldModel });

    const makeTable = () =>
      this.flowEngine.createModel({
        use: 'TableBlockModel',
        stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'users' } } },
        subModels: {
          columns: [
            {
              use: 'TableColumnModel',
              stepParams: {
                fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'username' } },
              },
              subModels: { field: { use: 'ColorTextFieldModel', stepParams: { colorize: {} } } },
              props: { title: '彩色用户名' },
            },
            {
              use: 'TableColumnModel',
              stepParams: {
                fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'email' } },
              },
              subModels: { field: { use: 'ColorTextFieldModel', stepParams: { colorize: {} } } },
              props: { title: '彩色邮箱（同规则）' },
            },
          ],
        },
      }) as TableBlockModel;

    const baselineTable = makeTable();
    const optimizedTable = makeTable();
    baselineTable.context.defineProperty('api', { value: baselineApi });
    optimizedTable.context.defineProperty('api', { value: optimizedApi });
    const fmStub = { bindToTarget: (_: string) => {}, unbindFromTarget: (_: string) => {} };
    baselineTable.context.defineProperty('filterManager', { value: fmStub });
    optimizedTable.context.defineProperty('filterManager', { value: fmStub });
    // 强制为两侧表格都提供一个需要服务端解析的探针变量（不影响显示，只用于触发一次 variables:resolve）
    baselineTable.context.defineProperty('forceServer', { get: () => '1', resolveOnServer: true });
    optimizedTable.context.defineProperty('forceServer', { get: () => '1', resolveOnServer: true });
    // Baseline：统一上行 + 前端补齐解析
    baselineTable.context.defineMethod('resolveJsonTemplate', async function (template: any) {
      try {
        const { data } = await this.api.request({
          method: 'POST',
          url: 'variables:resolve',
          data: { values: { template } },
        });
        const serverResolved = data?.data ?? template;
        return resolveExpressions(serverResolved, this);
      } catch {
        return template;
      }
    });

    // 给两侧的列字段追加一个“探针参数”，在 colorize 的 init 步中引用 {{ctx.forceServer}}，用于验证优化侧的上行请求
    const injectProbe = (table: TableBlockModel) => {
      const cols = (table.subModels as any)?.columns as any[];
      if (Array.isArray(cols)) {
        cols.forEach((col) => {
          const field = col?.subModels?.field as FlowModel;
          if (field && typeof field.setStepParams === 'function') {
            field.setStepParams('colorize', 'init', { probe: '{{ctx.forceServer}}' });
          }
        });
      }
    };
    injectProbe(baselineTable);
    injectProbe(optimizedTable);

    const BaselineStat = () => {
      const [stat, setStat] = React.useState({
        total: baseBuf.total,
        variablesResolve: baseBuf.variablesResolve,
        variablesUnique: baseBuf.variablesUnique,
        usersList: baseBuf.usersList,
      });
      React.useEffect(() => {
        setBase = (updater: any) => setStat((prev) => (typeof updater === 'function' ? updater(prev) : updater));
        return () => {
          setBase = null;
        };
      }, []);
      return (
        <Descriptions size="small" bordered column={1} title="Baseline（模拟优化前）">
          <Descriptions.Item label="总请求数">{stat.total}</Descriptions.Item>
          <Descriptions.Item label="variables:resolve">{stat.variablesResolve}</Descriptions.Item>
          <Descriptions.Item label="variables:resolve（去重）">{stat.variablesUnique}</Descriptions.Item>
          <Descriptions.Item label="users:list">{stat.usersList}</Descriptions.Item>
        </Descriptions>
      );
    };
    const OptimizedStat = () => {
      const [stat, setStat] = React.useState({
        total: optBuf.total,
        variablesResolve: optBuf.variablesResolve,
        variablesUnique: optBuf.variablesUnique,
        usersList: optBuf.usersList,
      });
      React.useEffect(() => {
        setOpt = (updater: any) => setStat((prev) => (typeof updater === 'function' ? updater(prev) : updater));
        return () => {
          setOpt = null;
        };
      }, []);
      return (
        <Descriptions size="small" bordered column={1} title="Optimized（当前实现）">
          <Descriptions.Item label="总请求数">{stat.total}</Descriptions.Item>
          <Descriptions.Item label="variables:resolve">{stat.variablesResolve}</Descriptions.Item>
          <Descriptions.Item label="variables:resolve（去重）">{stat.variablesUnique}</Descriptions.Item>
          <Descriptions.Item label="users:list">{stat.usersList}</Descriptions.Item>
        </Descriptions>
      );
    };

    const Page = () => (
      <div style={{ padding: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Typography.Paragraph type="secondary">
            自定义列并排对比：左侧 Baseline（统一上行解析），右侧 Optimized（当前实现）。
          </Typography.Paragraph>
          <Space size={16} wrap>
            <Card title="Baseline 表格">
              <BaselineStat />
              <FlowModelRenderer model={baselineTable} />
            </Card>
            <Card title="Optimized 表格">
              <OptimizedStat />
              <FlowModelRenderer model={optimizedTable} />
            </Card>
          </Space>
        </Space>
      </div>
    );

    this.router.add('root', {
      path: '/',
      element: (
        <FlowEngineProvider engine={this.flowEngine}>
          <Page />
        </FlowEngineProvider>
      ),
    });
  }
}

export default new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [DemoPlugin],
}).getRootComponent();
