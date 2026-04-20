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

Adicione rotas de páginas comuns usando `router.add()`. Para componentes de página, use `componentLoader` para registro sob demanda, de modo que o módulo da página só seja carregado quando a rota for realmente acessada.

Os arquivos de página devem usar `export default`:

```tsx
// routes/HomePage.tsx
export default function HomePage() {
  return <h1>Home</h1>;
}
```

```tsx
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

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

    this.router.add('root.home', {
      path: '/',
      // Importação dinâmica: o módulo da página só é carregado quando esta rota é realmente acessada
      componentLoader: () => import('./routes/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about',
      componentLoader: () => import('./routes/AboutPage'),
    });
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

Se a página for pesada ou não for necessária na renderização inicial, dê preferência a `componentLoader`; `element` continua adequado para rotas de layout ou páginas inline muito leves.

## Extensão de Páginas de Configuração de Plugins

Adicione páginas de configuração de plugins usando `pluginSettingsRouter.add()`. Assim como nas rotas de páginas comuns, as páginas de configuração também devem usar `componentLoader` para registro sob demanda.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Título da página de configuração
      icon: 'ApiOutlined', // Ícone do menu da página de configuração
      // Importação dinâmica: o módulo da página só é carregado quando esta página de configuração é realmente acessada
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Rotas filhas
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Importação dinâmica: o módulo da página só é carregado quando esta página de configuração é realmente acessada
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```