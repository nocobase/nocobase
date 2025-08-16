import { uid } from '@formily/shared';
import { Application, Plugin } from '@nocobase/client';
import { FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Button, Cascader } from 'antd';
import React from 'react';

class HelloModel extends FlowModel {
  onInit() {
    this.context.defineProperty('user', {
      get: () => ({
        id: 1,
        username: 'admin',
        nickName: 'Super Admin',
        email: 'admin@nocobase.com',
        roles: [
          {
            name: 'root',
            title: '超级管理员',
          },
          {
            name: 'admin',
            title: '管理员',
          },
        ],
      }),
      meta: {
        type: 'object',
        title: '用户',
        properties: {
          id: { type: 'number', title: 'ID' },
          username: { type: 'string', title: '用户名' },
          nickName: { type: 'string', title: '昵称' },
          email: { type: 'string', title: '邮箱' },
          roles: {
            type: 'array',
            title: '角色',
            properties: {
              name: { type: 'string', title: '名称' },
              title: { type: 'string', title: '标题' },
            },
          },
        },
      },
    });
    this.context.defineProperty('record', {
      get: () => ({
        id: 1,
        title: 'Hello World',
        content: 'This is a record',
      }),
      meta: {
        type: 'object',
        title: 'Record',
        properties: {
          id: { type: 'number', title: 'ID' },
          title: { type: 'string', title: 'Title' },
          content: { type: 'string', title: 'Content' },
        },
      },
    });
  }
  render() {
    return (
      <div>
        <Cascader
          style={{ marginTop: 8 }}
          fieldNames={{ label: 'title', value: 'name', children: 'children' }}
          options={this.context.getPropertyMetaTree() as any}
        />
      </div>
    );
  }
}

class PluginHelloModel extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();
    this.flowEngine.registerModels({ HelloModel });
    const model = this.flowEngine.createModel({ use: 'HelloModel' });
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginHelloModel],
});

export default app.getRootComponent();
