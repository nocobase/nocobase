:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Роутер

Клиент NocoBase предоставляет гибкий менеджер маршрутизации, который позволяет расширять страницы и страницы настроек плагинов с помощью `router.add()` и `pluginSettingsRouter.add()`.

## Зарегистрированные маршруты страниц по умолчанию

| Название           | Путь               | Компонент                | Описание                      |
| :----------------- | :----------------- | :----------------------- | :---------------------------- |
| admin              | /admin/\*          | AdminLayout              | Страницы административной панели |
| admin.page         | /admin/:name       | AdminDynamicPage         | Динамически создаваемые страницы |
| admin.settings     | /admin/settings/\* | AdminSettingsLayout      | Страницы настроек плагинов    |

## Расширение обычных страниц

Добавляйте маршруты обычных страниц с помощью `router.add()`.

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

Поддерживает динамические параметры

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Расширение страниц настроек плагинов

Добавляйте страницы настроек плагинов с помощью `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Заголовок страницы настроек
      icon: 'ApiOutlined', // Иконка меню страницы настроек
      Component: HelloSettingPage,
    });
  }
}
```

Пример многоуровневой маршрутизации

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Маршрут верхнего уровня
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Дочерние маршруты
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