---
title: "Capacidades comuns"
description: "Capacidades comuns do contexto do cliente NocoBase: requisições com ctx.api, internacionalização com ctx.t, logs com ctx.logger, rotas com ctx.router, gerenciamento de visualizações com ctx.viewer, controle de permissões com ctx.acl."
keywords: "ctx.api,ctx.t,ctx.i18n,ctx.logger,ctx.router,ctx.route,ctx.viewer,ctx.acl,NocoBase"
---

# Capacidades comuns

O objeto de contexto fornece as capacidades integradas do NocoBase. Algumas só estão disponíveis no Plugin, outras só em componentes, e algumas existem nos dois lados, mas com formas de uso diferentes. Veja primeiro a visão geral:

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

A seguir, cada capacidade é apresentada por namespace.

## Requisição API (ctx.api)

Use `ctx.api.request()` para chamar APIs do backend, com uso idêntico ao do [Axios](https://axios-http.com/).

### Uso no Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 在 load() 里直接发请求
    const response = await this.context.api.request({
      url: 'app:getInfo',
      method: 'get',
    });
    console.log('应用信息', response.data);
  }
}
```

### Uso em componentes

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    // GET 请求
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
    });
    console.log(response.data);

    // POST 请求
    await ctx.api.request({
      url: 'users:create',
      method: 'post',
      data: { name: 'Tao Tao' },
    });
  };

  return <button onClick={handleLoad}>加载数据</button>;
}
```

### Combinação com useRequest do ahooks

Em componentes, você pode usar o `useRequest` do [ahooks](https://ahooks.js.org/hooks/use-request/index) para simplificar o gerenciamento de estado das requisições:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

export default function PostList() {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>加载中...</div>;
  if (error) return <div>请求出错: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>刷新</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
}
```

### Interceptadores de requisição

Por meio de `ctx.api.axios`, é possível adicionar interceptadores de requisição/resposta, normalmente configurados no `load()` do Plugin:

```ts
async load() {
  // 请求拦截器：添加自定义请求头
  this.context.api.axios.interceptors.request.use((config) => {
    config.headers['X-Custom-Header'] = 'my-value';
    return config;
  });

  // 响应拦截器：统一错误处理
  this.context.api.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('请求出错', error);
      return Promise.reject(error);
    },
  );
}
```

### Cabeçalhos personalizados do NocoBase

O NocoBase Server suporta os cabeçalhos personalizados a seguir, normalmente injetados automaticamente pelos interceptadores, sem necessidade de configuração manual:

| Header            | Descrição                                |
| ----------------- | ---------------------------------------- |
| `X-App`           | Em cenários multi-app, indica o app atual em acesso |
| `X-Locale`        | Idioma atual (por exemplo, `zh-CN`, `en-US`) |
| `X-Hostname`      | Nome do host do cliente                  |
| `X-Timezone`      | Fuso horário do cliente (por exemplo, `+08:00`) |
| `X-Role`          | Papel atual                              |
| `X-Authenticator` | Forma de autenticação do usuário atual   |

## Internacionalização (ctx.t / ctx.i18n)

Os plugins do NocoBase gerenciam arquivos multilíngues através do diretório `src/locale/`, e usam `ctx.t()` para acessar traduções no código.

### Arquivos multilíngues

Em `src/locale/` do plugin, crie arquivos JSON por idioma:

```bash
plugin-hello/
└── src/
    └── locale/
        ├── zh-CN.json
        └── en-US.json
```

```json
// zh-CN.json
{
  "Hello": "你好",
  "Your name is {{name}}": "你的名字是 {{name}}"
}
```

```json
// en-US.json
{
  "Hello": "Hello",
  "Your name is {{name}}": "Your name is {{name}}"
}
```

:::warning Atenção

Adicionar um novo arquivo de idioma pela primeira vez requer reiniciar a aplicação para ter efeito.

:::

### ctx.t()

Em componentes, use `ctx.t()` para obter o texto traduzido:

```tsx
const ctx = useFlowContext();

// 基本用法
ctx.t('Hello');

// 带变量
ctx.t('Your name is {{name}}', { name: 'NocoBase' });

// 指定命名空间（默认命名空间是插件的包名）
ctx.t('Hello', { ns: '@my-project/plugin-hello' });
```

### this.t()

No Plugin, é mais conveniente usar `this.t()` — ele **injeta automaticamente o nome do pacote do plugin como namespace**, sem precisar passar `ns` manualmente:

```ts
class MyPlugin extends Plugin {
  async load() {
    // 自动使用当前插件的包名作为 ns
    console.log(this.t('Hello'));

    // 等同于
    console.log(this.context.t('Hello', { ns: '@my-project/plugin-hello' }));
  }
}
```

### ctx.i18n

`ctx.i18n` é a instância subjacente do [i18next](https://www.i18next.com/). Em geral, basta usar `ctx.t()`. No entanto, se precisar trocar o idioma dinamicamente, monitorar mudanças de idioma etc., use `ctx.i18n`:

```ts
// 获取当前语言
const currentLang = ctx.i18n.language; // 'zh-CN'

// 监听语言变化
ctx.i18n.on('languageChanged', (lng) => {
  console.log('语言切换为', lng);
});
```

### tExpr()

`tExpr()` gera uma string de expressão de tradução adiada, normalmente usada em `FlowModel.define()` — porque `define` é executado no momento de carregamento do módulo, quando ainda não existe a instância do i18n:

```ts
import { tExpr } from '@nocobase/flow-engine';

HelloBlockModel.define({
  label: tExpr('Hello block'), // 生成 '{{t("Hello block")}}'，运行时再翻译
});
```

Para uso completo de internacionalização (escrita de arquivos de tradução, hook useT, tExpr etc.), veja [i18n internacionalização](../component/i18n). A lista completa de códigos de idioma suportados pelo NocoBase está em [Lista de idiomas](../../languages).

## Logs (ctx.logger)

Use `ctx.logger` para emitir logs estruturados, baseado em [pino](https://github.com/pinojs/pino).

### Uso no Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.context.logger.info('插件加载完成', { plugin: 'my-plugin' });
    this.context.logger.error('初始化失败', { error });
  }
}
```

### Uso em componentes

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    ctx.logger.info('页面加载完成', { page: 'UserList' });
    ctx.logger.debug('当前用户状态', { user });
  };

  // ...
}
```

Níveis de log do mais alto para o mais baixo: `fatal` > `error` > `warn` > `info` > `debug` > `trace`. Apenas logs com nível maior ou igual ao configurado serão emitidos.

## Rotas (ctx.router / ctx.route / ctx.location)

As capacidades relacionadas a rotas se dividem em três partes: registro (apenas Plugin), navegação e obtenção de informações (apenas em componentes).

### Registro de rotas (this.router / this.pluginSettingsManager)

No `load()` do Plugin, registre rotas de página com `this.router.add()` e a página de configurações do plugin com `this.pluginSettingsManager`:

```ts
async load() {
  // 注册普通页面路由
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // 注册插件设置页（会出现在「插件配置」菜单里）
  this.pluginSettingsManager.addMenuItem({
    key: 'my-settings',
    title: this.t('My Settings'),
    icon: 'SettingOutlined', // Ant Design 图标，参考 https://5x.ant.design/components/icon
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'my-settings',
    key: 'index',
    title: this.t('My Settings'),
    componentLoader: () => import('./pages/MySettingsPage'),
  });
}
```

Para uso detalhado, veja [Router de rotas](../router). Um exemplo completo de página de configurações está em [Construir uma página de configurações de plugin](../examples/settings-page).

:::warning Atenção

`this.router` é o RouterManager, usado para **registrar rotas**. `this.pluginSettingsManager` é o PluginSettingsManager, usado para **registrar páginas de configurações**. Ambos não são a mesma coisa que o `ctx.router` em componentes (React Router, usado para **navegar entre páginas**).

:::

### Navegação de páginas (ctx.router)

Em componentes, use `ctx.router.navigate()` para navegar entre páginas:

```tsx
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

### Informações de rota (ctx.route)

Em componentes, use `ctx.route` para obter informações da rota atual:

```tsx
const ctx = useFlowContext();

// 获取动态参数（比如路由定义为 /users/:id）
const { id } = ctx.route.params;

// 获取路由名字
const { name } = ctx.route;
```

Tipo completo de `ctx.route`:

```ts
interface RouteOptions {
  name?: string;         // 路由唯一标识
  path?: string;         // 路由模板
  pathname?: string;     // 路由的完整路径
  params?: Record<string, any>; // 路由参数
}
```

### URL atual (ctx.location)

`ctx.location` fornece informações detalhadas sobre a URL atual, semelhante a `window.location` do navegador:

```tsx
const ctx = useFlowContext();

console.log(ctx.location.pathname); // '/v2/hello'
console.log(ctx.location.search);   // '?page=1'
console.log(ctx.location.hash);     // '#section'
```

`ctx.route` e `ctx.location` também podem ser acessados via `this.context` no Plugin, mas no momento do carregamento do plugin a URL é indeterminada e os valores obtidos não fazem sentido. Recomenda-se utilizá-los em componentes.

## Gerenciamento de visualizações (ctx.viewer / ctx.view)

`ctx.viewer` oferece a capacidade de abrir modais, drawers e outras visualizações de forma imperativa. Funciona tanto no Plugin quanto em componentes.

### Uso no Plugin

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 比如在某个初始化逻辑中打开一个弹窗
    this.context.viewer.dialog({
      title: '欢迎',
      content: () => <div>插件初始化完成</div>,
    });
  }
}
```

### Uso em componentes

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const openDetail = () => {
    // 打开弹窗
    ctx.viewer.dialog({
      title: '编辑用户',
      content: () => <UserEditForm />,
    });
  };

  const openDrawer = () => {
    // 打开抽屉
    ctx.viewer.drawer({
      title: '详情',
      content: () => <UserDetail />,
    });
  };

  return (
    <div>
      <Button onClick={openDetail}>编辑</Button>
      <Button onClick={openDrawer}>查看详情</Button>
    </div>
  );
}
```

### Método genérico

```tsx
// 通过 type 指定视图类型
ctx.viewer.open({
  type: 'dialog',  // 'dialog' | 'drawer' | 'popover' | 'embed'
  title: '标题',
  content: () => <SomeComponent />,
});
```

### Operações dentro da visualização (ctx.view)

Em componentes dentro de modais/drawers, você pode usar `ctx.view` para operar a visualização atual (por exemplo, fechá-la):

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

function DialogContent() {
  const ctx = useFlowContext();
  return (
    <div>
      <p>弹窗内容</p>
      <Button onClick={() => ctx.view.close()}>关闭</Button>
    </div>
  );
}
```

## FlowEngine (this.flowEngine)

`this.flowEngine` é a instância do FlowEngine, disponível apenas no Plugin. Geralmente, é usado para registrar FlowModels:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // 注册 FlowModel（推荐按需加载写法）
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

O FlowModel é o núcleo do sistema de configuração visual do NocoBase — se o seu componente precisa aparecer no menu "Adicionar bloco / campo / ação", você precisa envolvê-lo com FlowModel. Para uso detalhado, veja [FlowEngine](../flow-engine/index.md).

## Mais capacidades

As capacidades a seguir podem ser usadas em cenários mais avançados; aqui estão listadas brevemente:

| Propriedade             | Descrição                                       |
| ----------------------- | ----------------------------------------------- |
| `ctx.model`             | Instância atual do FlowModel (disponível no contexto de execução do Flow) |
| `ctx.ref`               | Referência ao componente, usada com `ctx.onRefReady` |
| `ctx.exit()`            | Sai da execução do Flow atual                   |
| `ctx.defineProperty()`  | Adiciona dinamicamente uma propriedade personalizada ao contexto |
| `ctx.defineMethod()`    | Adiciona dinamicamente um método personalizado ao contexto |
| `ctx.useResource()`     | Obtém a interface de operação de recursos de dados |
| `ctx.dataSourceManager` | Gerenciamento de fontes de dados                |

Para uso detalhado dessas capacidades, consulte a [documentação completa do FlowEngine](../../../flow-engine/index.md).

## Links relacionados

- [Visão geral do contexto](../ctx/index.md) — semelhanças e diferenças entre os dois pontos de acesso ao contexto
- [Plugin](../plugin) — atalhos do Plugin
- [Desenvolvimento de Component](../component/index.md) — uso de useFlowContext em componentes
- [Router de rotas](../router) — registro de rotas e navegação
- [Documentação completa do FlowEngine](../../../flow-engine/index.md) — referência completa do FlowEngine
- [i18n internacionalização](../component/i18n) — escrita de arquivos de tradução, tExpr, useT
- [Lista de idiomas](../../languages) — códigos de idioma suportados pelo NocoBase
- [Construir uma página de configurações de plugin](../examples/settings-page) — exemplo completo de uso de ctx.api
- [Visão geral do FlowEngine](../flow-engine/index.md) — uso básico de FlowModel
