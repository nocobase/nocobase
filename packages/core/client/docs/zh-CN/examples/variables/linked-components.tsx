import React, { useState } from 'react';
import { Application, Plugin } from '@nocobase/client';
import { FlowContext, VariableInput } from '@nocobase/flow-engine';
import { Card, Space, Typography } from 'antd';

const { Text } = Typography;

class PluginInteractiveMetaExample extends Plugin {
  async load() {
    const InteractiveMetaExample = () => {
      const [collectionValue, setCollectionValue] = useState('');
      const [fieldValue, setFieldValue] = useState('');

      const flowContext = new FlowContext();
      flowContext.defineProperty('collections', {
        meta: {
          title: '数据集合',
          type: 'object',
          properties: {
            users: {
              title: '用户',
              type: 'object',
              properties: {
                id: { title: 'ID', type: 'string', interface: 'number' },
                name: { title: '姓名', type: 'string', interface: 'input' },
                email: { title: '邮箱', type: 'string', interface: 'email' },
              },
            },
            posts: {
              title: '文章',
              type: 'object',
              properties: {
                id: { title: 'ID', type: 'string', interface: 'number' },
                title: { title: '标题', type: 'string', interface: 'input' },
                content: { title: '内容', type: 'string', interface: 'textarea' },
              },
            },
          },
        },
      });

      return (
        <Card style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }}>
            <VariableInput
              value={collectionValue}
              onChange={(value) => {
                setCollectionValue(value);
              }}
              metaTree={() => {
                const subTree = flowContext.getPropertyMetaTree('{{ ctx.collections }}');
                const collectionsOnly = subTree.map((node) => ({
                  ...node,
                  children: undefined,
                  isLeaf: true,
                }));
                return collectionsOnly;
              }}
              style={{ width: 200 }}
            />
            <VariableInput
              value={fieldValue}
              onChange={(value) => {
                setFieldValue(value);
              }}
              metaTree={() => flowContext.getPropertyMetaTree(collectionValue)}
              style={{ width: 200 }}
              disabled={!collectionValue}
            />
          </Space>

          <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
            <div>
              集合: <code>{collectionValue || '未选择'}</code>
            </div>
            <div>
              字段: <code>{fieldValue || '未选择'}</code>
            </div>
          </div>
        </Card>
      );
    };

    this.router.add('root', {
      path: '/',
      element: <InteractiveMetaExample />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginInteractiveMetaExample],
});

export default app.getRootComponent();
