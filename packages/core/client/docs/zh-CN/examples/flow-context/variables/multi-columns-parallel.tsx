/**
 * defaultShowCode: true
 * title: 多列（并排对比）
 */

import React from 'react';
import { APIClient } from '@nocobase/sdk';
import { Application, Plugin, TableBlockModel, TableColumnModel, ReadPrettyFieldModel } from '@nocobase/client';
import {
  FlowEngineProvider,
  FlowModel,
  FlowModelRenderer,
  defineFlow,
  resolveExpressions,
} from '@nocobase/flow-engine';
import { Card, Descriptions, Space, Typography } from 'antd';

// 字段模型：根据不同 flow 渲染不同文本
class DemoFieldModel extends FlowModel {
  render() {
    return <span>{this.props.text || ''}</span>;
  }
}

// username 列
DemoFieldModel.registerFlow(
  defineFlow({
    key: 'textByUsername',
    steps: {
      text: {
        defaultParams: { text: '用户名：{{ctx.record.username}}' },
        async handler(ctx, params) {
          ctx.model.setProps({ text: params.text });
        },
      },
    },
  }),
);

// email 列
DemoFieldModel.registerFlow(
  defineFlow({
    key: 'textByEmail',
    steps: {
      text: {
        defaultParams: { text: '邮箱：{{ctx.record.email}}' },
        async handler(ctx, params) {
          ctx.model.setProps({ text: params.text });
        },
      },
    },
  }),
);

// id 列
DemoFieldModel.registerFlow(
  defineFlow({
    key: 'textById',
    steps: {
      text: {
        defaultParams: { text: 'ID：{{ctx.record.id}}' },
        async handler(ctx, params) {
          ctx.model.setProps({ text: params.text });
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

    // 两套 API（通过覆盖 axios.request 实现本地 mock）
    const baselineApi = new APIClient({ baseURL: 'https://demo.local/api' });
    const optimizedApi = new APIClient({ baseURL: 'https://demo.local/api' });

    // 计数：原始次数 + 去重次数
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
        // users:list（GET）
        if (url === 'users:list' && method === 'get') {
          bump(mode, 'usersList');
          const page = Number(config?.params?.page || 1);
          const pageSize = Number(config?.params?.pageSize || 20);
          const start = (page - 1) * pageSize;
          const data = records.slice(start, start + pageSize);
          return Promise.resolve({ data: { data, meta: { page, pageSize, count: records.length } } } as any);
        }
        // variables:resolve（POST）
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
        // 兜底：不应命中真实网络
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

    this.flowEngine.registerModels({ TableBlockModel, TableColumnModel, ReadPrettyFieldModel, DemoFieldModel });

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
              subModels: { field: { use: 'DemoFieldModel', stepParams: { textByUsername: {} } } },
              props: { title: '用户名' },
            },
            {
              use: 'TableColumnModel',
              stepParams: {
                fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'email' } },
              },
              subModels: { field: { use: 'DemoFieldModel', stepParams: { textByEmail: {} } } },
              props: { title: '邮箱' },
            },
            {
              use: 'TableColumnModel',
              stepParams: {
                fieldSettings: { init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'id' } },
              },
              subModels: { field: { use: 'DemoFieldModel', stepParams: { textById: {} } } },
              props: { title: 'ID' },
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
            多列并排对比：左侧 Baseline（统一上行解析），右侧 Optimized（当前实现）。
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
