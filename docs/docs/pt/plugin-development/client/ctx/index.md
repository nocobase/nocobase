---
title: "Context (contexto)"
description: "Mecanismo de contexto do cliente NocoBase: this.context no Plugin e useFlowContext() em componentes referenciam o mesmo objeto, com pontos de acesso diferentes."
keywords: "Context,contexto,useFlowContext,this.context,FlowEngineContext,NocoBase"
---

# Context (contexto)

No NocoBase, o **contexto (Context)** é a ponte que conecta o código do plugin com as capacidades do NocoBase. Por meio do contexto, você pode enviar requisições, fazer internacionalização, escrever logs, navegar entre páginas etc.

O contexto tem dois pontos de acesso:

- **No Plugin**: `this.context`
- **Em componentes React**: `useFlowContext()` (importado de `@nocobase/flow-engine`)

Os dois retornam o **mesmo objeto** (instância de `FlowEngineContext`); apenas os cenários de uso são diferentes.

## Uso no Plugin

Nos métodos de ciclo de vida do plugin, como `load()`, acesse via `this.context`:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 通过 this.context 访问上下文能力
    const { api, logger } = this.context;

    const response = await api.request({ url: 'app:getInfo' });
    logger.info('应用信息', response.data);

    // 国际化：this.t() 会自动注入插件包名作为 namespace
    console.log(this.t('Hello'));
  }
}
```

## Uso em componentes

Em componentes React, obtenha o mesmo objeto de contexto via `useFlowContext()`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleClick = async () => {
    const response = await ctx.api.request({ url: 'users:list', method: 'get' });
    console.log(response.data);
  };

  return <button onClick={handleClick}>{ctx.t('Load data')}</button>;
}
```

## Atalhos do Plugin vs propriedades do ctx

A classe Plugin oferece alguns atalhos para facilitar o uso dentro de `load()`. No entanto, atenção: **alguns atalhos da classe Plugin e propriedades do mesmo nome no ctx apontam para coisas diferentes**:

| Atalho do Plugin              | Aponta para           | Uso                                 |
| ----------------------------- | --------------------- | ----------------------------------- |
| `this.router`                 | RouterManager         | Registrar rotas, com `.add()`       |
| `this.pluginSettingsManager`  | PluginSettingsManager | Registrar página de configurações do plugin (`addMenuItem` + `addPageTabItem`) |
| `this.flowEngine`             | Instância de FlowEngine | Registrar FlowModel               |
| `this.t()`                    | i18n.t() + ns automático | Internacionalização, injeta automaticamente o nome do pacote do plugin |
| `this.context`                | FlowEngineContext     | Objeto de contexto, igual ao retornado por useFlowContext() |

Os pontos mais fáceis de confundir são `this.router` e `ctx.router`:

- **`this.router`** (atalho do Plugin) → RouterManager, usado para **registrar rotas** (`.add()`)
- **`ctx.router`** (propriedade do contexto) → instância do React Router, usada para **navegar entre páginas** (`.navigate()`)

```ts
// Plugin 里：注册路由
async load() {
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });
}
```

```tsx
// 组件里：页面导航
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

## Capacidades comuns oferecidas pelo contexto

A seguir estão as capacidades de contexto mais comuns. Algumas só estão disponíveis no Plugin, outras só em componentes, e algumas existem nos dois lados, mas com formas de uso diferentes.

| Capacidade  | Plugin (`this.xxx`)           | Component (`ctx.xxx`)        | Descrição                              |
| ----------- | ----------------------------- | ---------------------------- | -------------------------------------- |
| Requisição API | `this.context.api`         | `ctx.api`                    | Uso idêntico                           |
| Internacionalização | `this.t()` / `this.context.t` | `ctx.t`              | `this.t()` injeta automaticamente o namespace do plugin |
| Logs        | `this.context.logger`         | `ctx.logger`                 | Uso idêntico                           |
| Registro de rotas | `this.router.add()`     | -                            | Apenas no Plugin                       |
| Navegação de páginas | -                  | `ctx.router.navigate()`      | Apenas em componentes                  |
| Informações de rota | `this.context.location` | `ctx.route` / `ctx.location` | Recomendado usar em componentes        |
| Gerenciamento de visualizações | `this.context.viewer` | `ctx.viewer`     | Abrir modais, drawers etc.             |
| FlowEngine  | `this.flowEngine`             | -                            | Apenas no Plugin                       |

Para uso detalhado de cada capacidade e exemplos de código, veja [Capacidades comuns](./common-capabilities).

## Links relacionados

- [Capacidades comuns](./common-capabilities) — uso detalhado de ctx.api, ctx.t, ctx.logger etc.
- [Plugin](../plugin) — entrada do plugin e atalhos
- [Desenvolvimento de Component](../component/index.md) — uso básico de useFlowContext em componentes
