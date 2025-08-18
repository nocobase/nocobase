import { Application, Plugin, CollectionBlockModel } from '@nocobase/client';
import { AddSubModelButton, FlowModel, FlowModelRenderer, FlowModelContext, Collection } from '@nocobase/flow-engine';
import { Button, Space } from 'antd';
import React from 'react';

// 主容器模型，用于添加和管理子模型
class ContainerModel extends FlowModel {
  render() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {this.mapSubModels('items', (item) => {
          return <FlowModelRenderer key={item.uid} model={item} showFlowSettings={{ showBorder: true }} />;
        })}
        <AddSubModelButton
          model={this}
          subModelKey={'items'}
          // 使用 items 来展示 defineChildren 功能
          items={async (ctx) => {
            const items = [];

            // 调用 CommentsBlockModel 的 defineChildren 方法
            const commentsChildren = await CommentsBlockModel.defineChildren(ctx);
            if (commentsChildren && commentsChildren.length > 0) {
              items.push({
                key: 'comments-group',
                label: '评论相关区块',
                children: commentsChildren.map((child) => ({
                  ...child,
                  // 修改 createModelOptions 以使用 CommentsBlockModel
                  createModelOptions: {
                    use: 'CommentsBlockModel',
                    stepParams: child.createModelOptions?.stepParams || {},
                  },
                })),
              });
            }

            // 调用 UsersBlockModel 的 defineChildren 方法
            const usersChildren = await UsersBlockModel.defineChildren(ctx);
            if (usersChildren && usersChildren.length > 0) {
              items.push({
                key: 'users-group',
                label: '用户相关区块',
                children: usersChildren.map((child) => ({
                  ...child,
                  // 修改 createModelOptions 以使用 UsersBlockModel
                  createModelOptions: {
                    use: 'UsersBlockModel',
                    stepParams: child.createModelOptions?.stepParams || {},
                  },
                })),
              });
            }

            return items;
          }}
        >
          <Button>添加区块</Button>
        </AddSubModelButton>
      </Space>
    );
  }
}

// Comments 区块模型，只能使用 comments collection
class CommentsBlockModel extends CollectionBlockModel {
  // 重写 getChildrenFilters 方法，限制只能使用 comments collection
  static getChildrenFilters(ctx: FlowModelContext) {
    return {
      currentCollection: false, // 不显示当前集合
      currentRecord: false, // 不显示当前记录
      otherCollections: true, // 显示其他集合
      otherRecords: false, // 不显示其他记录
      // 通过 collections 字段限制只能使用 comments collection
      collections: (ctx: FlowModelContext) => {
        const dsm = ctx.dataSourceManager;
        const mainDS = dsm.getDataSource('main');
        const allCollections = mainDS.getCollections() as Collection[];
        // 只返回 comments collection
        return allCollections.filter((col) => col.name === 'comments');
      },
    };
  }

  renderComponent() {
    const collection = this.collection;
    return (
      <div style={{ padding: 16, border: '1px solid #d9d9d9', borderRadius: 4 }}>
        <h3>评论区块</h3>
        <p>当前集合: {collection?.title || collection?.name || '未选择'}</p>
        <p style={{ color: '#888', fontSize: 12 }}>此区块只能使用 comments 集合</p>
      </div>
    );
  }

  createResource(ctx, params) {
    // 简单的资源创建示例
    return {
      setAPIClient: () => {},
      setDataSourceKey: () => {},
      setResourceName: () => {},
      on: () => {},
      refresh: async () => {},
    } as any;
  }
}

// Users 区块模型，只能使用 users collection
class UsersBlockModel extends CollectionBlockModel {
  // 重写 getChildrenFilters 方法，限制只能使用 users collection
  static getChildrenFilters(ctx: FlowModelContext) {
    return {
      currentCollection: false,
      currentRecord: false,
      otherCollections: true,
      otherRecords: false,
      // 通过 collections 字段限制只能使用 users collection
      collections: async (ctx: FlowModelContext) => {
        const dsm = ctx.dataSourceManager;
        const mainDS = dsm.getDataSource('main');
        const allCollections = mainDS.getCollections() as Collection[];
        // 只返回 users collection
        return allCollections.filter((col) => col.name === 'users');
      },
    };
  }

  renderComponent() {
    const collection = this.collection;
    return (
      <div style={{ padding: 16, border: '1px solid #d9d9d9', borderRadius: 4 }}>
        <h3>用户区块</h3>
        <p>当前集合: {collection?.title || collection?.name || '未选择'}</p>
        <p style={{ color: '#888', fontSize: 12 }}>此区块只能使用 users 集合</p>
      </div>
    );
  }

  createResource(ctx, params) {
    // 简单的资源创建示例
    return {
      setAPIClient: () => {},
      setDataSourceKey: () => {},
      setResourceName: () => {},
      on: () => {},
      refresh: async () => {},
    } as any;
  }
}

// 定义模型元数据
CommentsBlockModel.define({
  label: '评论区块',
  icon: 'MessageOutlined',
});

UsersBlockModel.define({
  label: '用户区块',
  icon: 'UserOutlined',
});

class PluginDefineChildrenDemo extends Plugin {
  async load() {
    this.flowEngine.flowSettings.forceEnable();

    // 注册模型
    this.flowEngine.registerModels({
      ContainerModel,
      CommentsBlockModel,
      UsersBlockModel,
    });

    // 模拟数据：创建多个 collection
    const mainDataSource = this.flowEngine.context.dataSourceManager.getDataSource('main');

    // 添加 comments collection
    mainDataSource.addCollection({
      name: 'comments',
      title: '评论',
      fields: [
        { name: 'id', type: 'integer', primaryKey: true },
        { name: 'content', type: 'text', title: '内容' },
        { name: 'author', type: 'string', title: '作者' },
        { name: 'createdAt', type: 'date', title: '创建时间' },
      ],
    });

    // 添加 users collection
    mainDataSource.addCollection({
      name: 'users',
      title: '用户',
      fields: [
        { name: 'id', type: 'integer', primaryKey: true },
        { name: 'name', type: 'string', title: '姓名' },
        { name: 'email', type: 'string', title: '邮箱' },
      ],
    });

    // 添加 posts collection（这个不会在 Comments 或 Users 区块中显示）
    mainDataSource.addCollection({
      name: 'posts',
      title: '文章',
      fields: [
        { name: 'id', type: 'integer', primaryKey: true },
        { name: 'title', type: 'string', title: '标题' },
        { name: 'content', type: 'text', title: '内容' },
      ],
    });

    // 添加 products collection（这个也不会在 Comments 或 Users 区块中显示）
    mainDataSource.addCollection({
      name: 'products',
      title: '产品',
      fields: [
        { name: 'id', type: 'integer', primaryKey: true },
        { name: 'name', type: 'string', title: '名称' },
        { name: 'price', type: 'number', title: '价格' },
      ],
    });

    // 创建主模型
    const model = this.flowEngine.createModel({
      uid: 'container-model',
      use: 'ContainerModel',
    });

    // 注册路由，渲染模型
    this.router.add('root', {
      path: '/',
      element: <FlowModelRenderer model={model} />,
    });
  }
}

// 创建应用实例，注册插件
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginDefineChildrenDemo],
});

export default app.getRootComponent();
