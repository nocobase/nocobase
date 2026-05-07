---
title: "Desenvolvimento de Component"
description: "Desenvolvimento de componentes do cliente NocoBase: usar React/Antd para desenvolver componentes de página de plugin, gerenciamento de estado com observable e obter as capacidades do contexto NocoBase via useFlowContext()."
keywords: "Component,desenvolvimento de componentes,React,Antd,observable,observer,useFlowContext,ctx,NocoBase"
---

# Desenvolvimento de Component

No NocoBase, os componentes de página montados nas rotas são componentes React comuns. Você pode escrevê-los diretamente com React + [Antd](https://5x.ant.design/), sem diferença em relação ao desenvolvimento front-end comum.

Adicionalmente, o NocoBase fornece:

- **`observable` + `observer`** — forma recomendada de gerenciar estado, mais adequada ao ecossistema NocoBase do que `useState`
- **`useFlowContext()`** — obtém as capacidades do contexto NocoBase (envio de requisições, internacionalização, navegação por rotas etc.)

## Forma básica

Um componente de página simples:

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Após escrevê-lo, registre-o no `load()` do plugin com `this.router.add()`. Veja [Router de rotas](../router) para mais detalhes.

## Gerenciamento de estado: observable

O NocoBase recomenda usar `observable` + `observer` para gerenciar o estado dos componentes em vez do `useState` do React. As vantagens são:

- Modificar diretamente as propriedades do objeto já dispara a atualização, sem precisar de `setState`
- Coleta de dependências automática; o componente só renderiza novamente quando uma propriedade utilizada muda
- É consistente com o mecanismo reativo da camada base do NocoBase (FlowModel, FlowContext etc.)

Uso básico: crie um objeto reativo com `observable.deep()` e envolva o componente com `observer()`. Tanto `observable` quanto `observer` são importados de `@nocobase/flow-engine`:

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

Pré-visualização do resultado:

```tsx file="./_demos/observable-basic.tsx" preview
```

Para mais detalhes, veja [Mecanismo reativo Observable](../../../flow-engine/observable).

## Usando useFlowContext

`useFlowContext()` é o ponto de entrada para conectar com as capacidades do NocoBase. Importe-o de `@nocobase/flow-engine`. Ele retorna um objeto `ctx`:

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

A seguir, exemplos das capacidades mais comuns.

### Envio de requisições

Use `ctx.api.request()` para chamar APIs do backend, com uso semelhante ao do [Axios](https://axios-http.com/):

```tsx
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
console.log(response.data);
```

### Internacionalização

Use `ctx.t()` para obter o texto traduzido:

```tsx
const label = ctx.t('Hello');
// 指定命名空间
const msg = ctx.t('Save success', { ns: '@my-project/plugin-hello' });
```

### Navegação por rotas

Use `ctx.router.navigate()` para navegar entre páginas:

```tsx
ctx.router.navigate('/some-page'); // -> /v2/some-page
```

Obter os parâmetros da rota atual:

```tsx
// 比如路由定义为 /users/:id
const { id } = ctx.route.params; // 获取动态参数
```

Obter o nome da rota atual:

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

Para mais níveis de log e formas de uso, veja [Context → Capacidades comuns](../ctx/common-capabilities).

## Exemplo completo

Combinando observable, useFlowContext e Antd, um componente de página que busca e exibe dados do backend:

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

## Próximos passos

- Capacidades completas oferecidas por `useFlowContext` — veja [Context (contexto)](../ctx/index.md)
- Personalização de estilos e temas — veja [Styles & Themes (estilos e temas)](./styles-themes)
- Se o seu componente precisa aparecer no menu "Adicionar bloco / campo / ação" do NocoBase e suportar configuração visual pelo usuário, envolva-o com FlowModel — veja [FlowEngine](../flow-engine/index.md)
- Não tem certeza se deve usar Component ou FlowModel? — veja [Component vs FlowModel](../component-vs-flow-model)

## Links relacionados

- [Router de rotas](../router) — registrar rotas de página, montando componentes em URLs
- [Context (contexto)](../ctx/index.md) — apresentação completa das capacidades de useFlowContext
- [Styles & Themes (estilos e temas)](./styles-themes) — createStyles, theme tokens etc.
- [FlowEngine](../flow-engine/index.md) — usar FlowModel quando precisar de configuração visual
- [Mecanismo reativo Observable](../../../flow-engine/observable) — gerenciamento de estado reativo do FlowEngine
- [Context → Capacidades comuns](../ctx/common-capabilities) — capacidades integradas como ctx.api, ctx.t etc.
- [Component vs FlowModel](../component-vs-flow-model) — escolha entre componente ou FlowModel
