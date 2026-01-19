:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# Roteador

O cliente NocoBase oferece um gerenciador de roteamento flexível que permite estender páginas e páginas de configuração de **plugins** usando `router.add()` e `pluginSettingsRouter.add()`.

## Rotas de Página Padrão Registradas

| Nome           | Caminho            | Componente          | Descrição                       |
| -------------- | ------------------ | ------------------- | ------------------------------- |
| admin          | /admin/\*          | AdminLayout         | Páginas de administração        |
| admin.page     | /admin/:name       | AdminDynamicPage    | Páginas criadas dinamicamente   |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Páginas de configuração de **plugins** |

## Extensão de Páginas Comuns

Adicione rotas para páginas comuns usando `router.add()`.

```tsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

const Layout = () => (
  <div>
    <div>
      <Link to="/">Home</Link> | <Link to="/about">About</Link>
    </div>
    <Outlet />
  </div>
);

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', { element: <Layout /> });

    this.router.add('root.home', { path: '/', element: <Home /> });
    this.router.add('root.about', { path: '/about', element: <About /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin]
});

export default app.getRootComponent();
```

Suporta parâmetros dinâmicos

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Extensão de Páginas de Configuração de Plugins

Adicione páginas de configuração de **plugins** usando `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Título da página de configuração
      icon: 'ApiOutlined', // Ícone do menu da página de configuração
      Component: HelloSettingPage,
    });
  }
}
```

Exemplo de roteamento multinível

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Rota de nível superior
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Rotas filhas
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      Component: () => <div>Demo1 Page Content</div>,
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      Component: () => <div>Demo2 Page Content</div>,
    });
  }
}
```