---
title: "Router"
description: "Roteamento do cliente NocoBase: this.router.add para registrar rotas de página, pluginSettingsManager para registrar páginas de configuração de plugins (addMenuItem + addPageTabItem)."
keywords: "Router,roteamento,router.add,pluginSettingsManager,addMenuItem,addPageTabItem,componentLoader,registro de páginas,NocoBase"
---

# Router

No NocoBase, os plugins registram páginas por meio de rotas. Há duas abordagens comuns:

- `this.router.add()` — registra rotas de página comuns
- `this.pluginSettingsManager.addMenuItem()` + `addPageTabItem()` — registra páginas de configuração de plugins

O registro de rotas geralmente é feito no método `load()` do plugin. Consulte [Plugin](./plugin) para mais detalhes.

:::warning Atenção

Nos plugins do NocoBase v2, as rotas registradas recebem por padrão o prefixo `/v`. É necessário incluir esse prefixo ao acessar as rotas.

:::

## Rotas padrão

O NocoBase já tem as seguintes rotas padrão registradas:

| Nome           | Caminho               | Componente          | Descrição                     |
| -------------- | --------------------- | ------------------- | ----------------------------- |
| admin          | /v/admin/\*          | AdminLayout         | Páginas de administração      |
| admin.page     | /v/admin/:name       | AdminDynamicPage    | Páginas criadas dinamicamente |
| admin.settings | /v/admin/settings/\* | AdminSettingsLayout | Páginas de configuração de plugins |

## Rotas de página

Registre rotas de página por meio de `this.router.add()`. Os componentes de página devem usar `componentLoader` para carregamento sob demanda, de modo que o código da página só seja carregado quando ela for realmente acessada.

:::warning Atenção

Os arquivos de página devem exportar o componente com `export default`.

:::

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Registro no método `load()` do plugin:

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/hello',
      // Carregamento sob demanda: o módulo só é carregado ao acessar /v/hello
      componentLoader: () => import('./pages/HelloPage'),
    });
  }
}
```

O primeiro argumento de `router.add()` é o nome da rota, que aceita a notação de ponto `.` para expressar relações pai-filho. Por exemplo, `root.home` representa uma rota filha de `root`.

Nos componentes, você pode navegar para uma rota por meio de `ctx.router.navigate('/hello')`.

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { Button } from 'antd';

export default function SomeComponent() {
  const ctx = useFlowContext();
  return (
    <Button onClick={() => ctx.router.navigate('/hello')}>
      Go to Hello Page
    </Button>
  );
}
```

Para mais detalhes, consulte a seção de roteamento em [Component](./component/index.md).

### Rotas aninhadas

O aninhamento é implementado por meio da notação de ponto. As rotas pai usam `<Outlet />` para renderizar o conteúdo das rotas filhas:

```tsx
import { Outlet } from 'react-router-dom';

class MyPlugin extends Plugin {
  async load() {
    // Rota pai, usando element como layout em linha
    this.router.add('root', {
      element: (
        <div>
          <nav>Barra de navegação</nav>
          <Outlet />
        </div>
      ),
    });

    // Rota filha, usando componentLoader para carregamento sob demanda
    this.router.add('root.home', {
      path: '/', // -> /v/
      componentLoader: () => import('./pages/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about', // -> /v/about
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}
```

### Parâmetros dinâmicos

Os caminhos de rota aceitam parâmetros dinâmicos:

```tsx
this.router.add('root.user', {
  path: '/user/:id', // -> /v/user/:id
  componentLoader: () => import('./pages/UserPage'),
});
```

Nos componentes, você pode obter os parâmetros dinâmicos por meio de `ctx.route.params`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function UserPage() {
  const ctx = useFlowContext();
  const { id } = ctx.route.params; // Obter o parâmetro dinâmico id
  return <h1>User ID: {id}</h1>;
}
```

Para mais detalhes, consulte a seção de roteamento em [Component](./component/index.md).

### componentLoader vs. element

- **`componentLoader`** (recomendado): carregamento sob demanda, adequado para componentes de página. Os arquivos de página precisam de `export default`.
- **`element`**: passa o JSX diretamente, adequado para componentes de layout ou páginas em linha muito leves.

Se a página tiver dependências pesadas, prefira `componentLoader`.

## Páginas de configuração de plugins

Registre páginas de configuração de plugins por meio de `this.pluginSettingsManager`. O registro tem duas etapas — primeiro use `addMenuItem()` para registrar a entrada de menu e depois `addPageTabItem()` para registrar a página propriamente dita. As páginas de configuração aparecem no menu "Configuração de plugins" do NocoBase.

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Registrar a entrada de menu
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello Settings'),
      icon: 'ApiOutlined', // Nome de um ícone do Ant Design, consulte https://5x.ant.design/components/icon
    });

    // Registrar a página (a chave 'index' é mapeada para o caminho raiz do menu)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Hello Settings'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

Após o registro, o caminho de acesso é `/v/admin/settings/hello`. Quando há apenas uma página sob o menu, a barra de abas superior é ocultada automaticamente.

### Página de configuração com várias abas

Se a página de configuração precisar de várias subpáginas, registre várias chamadas a `addPageTabItem` com o mesmo `menuKey` — uma barra de abas aparecerá automaticamente no topo:

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Registrar a entrada de menu
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    // Aba 1: Configurações gerais (a chave 'index' é mapeada para /v/admin/settings/hello)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('General'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    // Aba 2: Configurações avançadas (mapeada para /v/admin/settings/hello/advanced)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('Advanced'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```

### Parâmetros de addMenuItem

| Campo      | Tipo                  | Obrigatório | Descrição                                                            |
| ---------- | --------------------- | ----------- | -------------------------------------------------------------------- |
| `key`      | `string`              | Sim         | Identificador único do menu, não pode conter `.`                    |
| `title`    | `ReactNode`           | Não         | Título do menu                                                       |
| `icon`     | `string \| ReactNode` | Não         | Ícone do menu; quando é uma string, é renderizado como `Icon` integrado |
| `sort`     | `number`              | Não         | Valor de ordenação; valores menores aparecem primeiro, padrão `0`   |
| `showTabs` | `boolean`             | Não         | Se a barra de abas superior é exibida; por padrão, determinado pela quantidade de páginas |
| `hidden`   | `boolean`             | Não         | Se a entrada de navegação é ocultada                                 |

### Parâmetros de addPageTabItem

| Campo             | Tipo        | Obrigatório | Descrição                                                            |
| ----------------- | ----------- | ----------- | -------------------------------------------------------------------- |
| `menuKey`         | `string`    | Sim         | O `key` do menu pai, correspondente ao `key` de `addMenuItem`        |
| `key`             | `string`    | Sim         | Identificador único da página. `'index'` indica a página padrão, mapeada para o caminho raiz do menu |
| `title`           | `ReactNode` | Não         | Título da página (exibido na aba)                                    |
| `componentLoader` | `Function`  | Não         | Componente de página com carregamento sob demanda (recomendado)      |
| `Component`       | `Component` | Não         | Passar o componente diretamente (alternativa a `componentLoader`)    |
| `sort`            | `number`    | Não         | Valor de ordenação; valores menores aparecem primeiro                |
| `hidden`          | `boolean`   | Não         | Se é ocultado na barra de abas                                       |
| `link`            | `string`    | Não         | Link externo; quando definido, clicar na aba navega para a URL externa |

## Links relacionados

- [Plugin](./plugin) — as rotas são registradas em `load()`
- [Component](./component/index.md) — como escrever os componentes de página montados pelas rotas
- [Exemplo de plugin: criar uma página de configuração](./examples/settings-page) — exemplo completo de página de configuração
