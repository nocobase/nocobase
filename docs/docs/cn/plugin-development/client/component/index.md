---
title: "Component 组件开发"
description: "NocoBase 客户端组件开发：使用 React/Antd 开发插件页面组件，observable 状态管理，通过 useFlowContext() 获取 NocoBase 上下文能力。"
keywords: "Component,组件开发,React,Antd,observable,observer,useFlowContext,ctx,NocoBase"
---

# Component 组件开发

在 NocoBase 中，路由挂载的页面组件就是普通的 React 组件。你可以直接用 React + [Antd](https://5x.ant.design/) 来写，跟普通前端开发没有区别。

NocoBase 额外提供了：

- **`observable` + `observer`** — 推荐的状态管理方式，比 `useState` 更适合 NocoBase 生态
- **`useFlowContext()`** — 获取 NocoBase 的上下文能力（发请求、国际化、路由导航等）

## 基本写法

一个最简单的页面组件：

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

写好之后，在插件的 `load()` 里用 `this.router.add()` 注册即可，详见 [Router 路由](../router)。

## 状态管理：observable

NocoBase 推荐使用 `observable` + `observer` 来管理组件状态，而不是 React 的 `useState`。它的好处是：

- 直接修改对象属性就能触发更新，不需要 `setState`
- 自动依赖收集，组件只在用到的属性变化时才重新渲染
- 和 NocoBase 底层（FlowModel、FlowContext 等）的响应式机制一致

基本用法：用 `observable.deep()` 创建响应式对象，用 `observer()` 包裹组件。`observable` 和 `observer` 都从 `@nocobase/flow-engine` 导入：

```tsx
import React from 'react';
import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// 创建一个响应式状态对象
const state = observable.deep({
  text: '',
});

// 用 observer 包裹组件，状态变化时自动更新
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="输入点什么..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>你输入了：{state.text}</div>}
    </div>
  );
});

export default DemoPage;
```

效果预览：

```tsx file="./_demos/observable-basic.tsx" preview
```

更多用法见 [Observable 响应式机制](../../../flow-engine/observable)。

## 使用 useFlowContext

`useFlowContext()` 是连接 NocoBase 能力的入口。从 `@nocobase/flow-engine` 导入，返回一个 `ctx` 对象：

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();
  // ctx.api — 发请求
  // ctx.t — 国际化
  // ctx.router — 路由导航
  // ctx.logger — 日志
  // ...
}
```

以下是常用能力的示例。

### 发请求

通过 `ctx.api.request()` 调用后端接口，用法跟 [Axios](https://axios-http.com/) 一致：

```tsx
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
console.log(response.data);
```

### 国际化

通过 `ctx.t()` 获取翻译文本：

```tsx
const label = ctx.t('Hello');
// 指定命名空间
const msg = ctx.t('Save success', { ns: '@my-project/plugin-hello' });
```

### 路由导航

通过 `ctx.router.navigate()` 进行页面跳转：

```tsx
ctx.router.navigate('/some-page'); // -> /v2/some-page
```

获取当前路由参数：

```tsx
// 比如路由定义为 /users/:id
const { id } = ctx.route.params; // 获取动态参数
```

获取当前路由名字：

```tsx
const { name } = ctx.route; // 获取路由名字
```

<!-- ### 消息提示、弹窗、通知

NocoBase 通过 ctx 封装了 Antd 的反馈组件，可以直接在逻辑代码里调用：

```tsx
// 消息提示（轻量，自动消失）
ctx.message.success('保存成功');

// 弹窗确认（阻塞式，等待用户操作）
const confirmed = await ctx.modal.confirm({
  title: '确认删除？',
  content: '删除后无法恢复',
});

// 通知（右侧弹出，适合较长的提示）
ctx.notification.open({
  message: '导入完成',
  description: '共导入 42 条记录',
});
```

### 日志

通过 `ctx.logger` 输出结构化日志：

```tsx
ctx.logger.info('页面加载完成', { page: 'UserList' });
ctx.logger.error('数据加载失败', { error });
``` -->

更多日志级别和用法见 [Context → 常用能力](../ctx/common-capabilities)。

## 完整示例

把 observable、useFlowContext 和 Antd 组合起来，一个从后端获取数据并展示的页面组件：

```tsx
// pages/PostListPage.tsx
import React, { useEffect } from 'react';
import { Button, Card, List, Spin } from 'antd';
import { observable, observer, FlowContext, useFlowContext } from '@nocobase/flow-engine';

interface Post {
  id: number;
  title: string;
}

// 用 observable 管理页面状态
const state = observable.deep({
  posts: [] as Post[],
  loading: true,
});

const PostListPage = observer(() => {
  const ctx = useFlowContext();

  useEffect(() => {
    loadPosts(ctx);
  }, []);

  return (
    <Card title={ctx.t('Post list')}>
      <Spin spinning={state.loading}>
        <List
          dataSource={state.posts}
          renderItem={(post: Post) => (
            <List.Item
              actions={[
                <Button danger onClick={() => handleDelete(ctx, post.id)}>
                  {ctx.t('Delete')}
                </Button>,
              ]}
            >
              {post.title}
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
});

async function loadPosts(ctx: FlowContext) {
  state.loading = true;
  try {
    const response = await ctx.api.request({
      url: 'posts:list',
      method: 'get',
    });
    state.posts = response.data?.data || [];
  } catch (error) {
    ctx.logger.error('加载文章列表失败', { error });
  } finally {
    state.loading = false;
  }
}

async function handleDelete(ctx: FlowContext, id: number) {
  await ctx.api.request({
    url: `posts:destroy/${id}`,
    method: 'post',
  });
  loadPosts(ctx); // 刷新列表
}

export default PostListPage;
```

## 接下来

- `useFlowContext` 提供的完整能力——见 [Context 上下文](../ctx/index.md)
- 组件样式和主题定制——见 [Styles & Themes 样式与主题](./styles-themes)
- 如果你的组件需要出现在 NocoBase 的「添加区块 / 字段 / 操作」菜单里、支持用户可视化配置，需要用 FlowModel 来包装——见 [FlowEngine](../flow-engine/index.md)
- 不确定该用 Component 还是 FlowModel？——见 [Component vs FlowModel](../component-vs-flow-model)

## 相关链接

- [Router 路由](../router) — 注册页面路由，把组件挂载到 URL
- [Context 上下文](../ctx/index.md) — useFlowContext 的完整能力介绍
- [Styles & Themes 样式与主题](./styles-themes) — createStyles、主题 token 等
- [FlowEngine](../flow-engine/index.md) — 需要可视化配置时使用 FlowModel
- [Observable 响应式机制](../../../flow-engine/observable) — FlowEngine 的响应式状态管理
- [Context → 常用能力](../ctx/common-capabilities) — ctx.api、ctx.t 等内置能力
- [Component vs FlowModel](../component-vs-flow-model) — 选择组件还是 FlowModel
