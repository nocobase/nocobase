---
title: "Разработка Component-компонентов"
description: "Разработка клиентских компонентов в NocoBase: использование React/Antd для разработки страниц плагинов, управление состоянием через observable, доступ к контексту NocoBase через useFlowContext()."
keywords: "Component,разработка компонентов,React,Antd,observable,observer,useFlowContext,ctx,NocoBase"
---

# Разработка Component-компонентов

В NocoBase компоненты страниц, монтируемые через маршруты, — это обычные React-компоненты. Их можно писать прямо на React + [Antd](https://5x.ant.design/), как при обычной фронтенд-разработке.

Дополнительно NocoBase предоставляет:

- **`observable` + `observer`** — рекомендуемый способ управления состоянием, лучше подходит для экосистемы NocoBase, чем `useState`
- **`useFlowContext()`** — получение возможностей контекста NocoBase (запросы, интернационализация, маршрутная навигация и т.д.)

## Базовый синтаксис

Простейший компонент страницы:

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

После написания зарегистрируйте его в `load()` плагина через `this.router.add()`. Подробности см. в [Router (Маршрутизация)](../router).

## Управление состоянием: observable

В NocoBase для управления состоянием компонентов рекомендуется использовать `observable` + `observer` вместо React-овского `useState`. Преимущества:

- Прямое изменение свойств объекта вызывает обновление, не нужен `setState`
- Автоматическое отслеживание зависимостей: компонент перерисовывается только при изменении используемых свойств
- Соответствует реактивному механизму нижележащего слоя NocoBase (FlowModel, FlowContext и т.д.)

Базовое использование: создаёте реактивный объект через `observable.deep()`, оборачиваете компонент в `observer()`. И `observable`, и `observer` импортируются из `@nocobase/flow-engine`:

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

Предварительный просмотр:

```tsx file="./_demos/observable-basic.tsx" preview
```

Больше способов использования см. в [Реактивный механизм Observable](../../../flow-engine/observable).

## Использование useFlowContext

`useFlowContext()` — это точка входа для подключения возможностей NocoBase. Импортируется из `@nocobase/flow-engine`, возвращает объект `ctx`:

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

Ниже приведены примеры распространённых возможностей.

### Отправка запросов

Через `ctx.api.request()` вызываются бэкенд-интерфейсы, использование совпадает с [Axios](https://axios-http.com/):

```tsx
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
console.log(response.data);
```

### Интернационализация

Через `ctx.t()` получаем переведённый текст:

```tsx
const label = ctx.t('Hello');
// 指定命名空间
const msg = ctx.t('Save success', { ns: '@my-project/plugin-hello' });
```

### Маршрутная навигация

Через `ctx.router.navigate()` выполняется переход между страницами:

```tsx
ctx.router.navigate('/some-page'); // -> /v2/some-page
```

Получение параметров текущего маршрута:

```tsx
// 比如路由定义为 /users/:id
const { id } = ctx.route.params; // 获取动态参数
```

Получение имени текущего маршрута:

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

Подробнее про уровни логирования и использование см. в [Context → Распространённые возможности](../ctx/common-capabilities).

## Полный пример

Объединим observable, useFlowContext и Antd — компонент страницы, который получает данные с бэкенда и отображает их:

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

## Что дальше

- Полные возможности, предоставляемые `useFlowContext` — см. [Context (Контекст)](../ctx/index.md)
- Стилизация компонентов и кастомизация темы — см. [Styles & Themes (Стили и темы)](./styles-themes)
- Если Ваш компонент должен появиться в меню «Добавить блок / поле / действие» NocoBase и поддерживать визуальную конфигурацию пользователем, нужно обернуть его в FlowModel — см. [FlowEngine](../flow-engine/index.md)
- Не уверены, использовать Component или FlowModel? — см. [Component vs FlowModel](../component-vs-flow-model)

## Связанные ссылки

- [Router (Маршрутизация)](../router) — регистрация маршрутов страниц, монтирование компонентов на URL
- [Context (Контекст)](../ctx/index.md) — полное описание возможностей useFlowContext
- [Styles & Themes (Стили и темы)](./styles-themes) — createStyles, токены темы и т.д.
- [FlowEngine](../flow-engine/index.md) — используется FlowModel, когда нужна визуальная конфигурация
- [Реактивный механизм Observable](../../../flow-engine/observable) — управление реактивным состоянием в FlowEngine
- [Context → Распространённые возможности](../ctx/common-capabilities) — встроенные возможности ctx.api, ctx.t и т.д.
- [Component vs FlowModel](../component-vs-flow-model) — выбор между компонентом и FlowModel
