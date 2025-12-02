:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Маршрутизатор

Клієнт NocoBase надає гнучкий менеджер маршрутизації, який дозволяє розширювати сторінки та сторінки налаштувань плагінів за допомогою методів `router.add()` та `pluginSettingsRouter.add()`.

## Зареєстровані маршрути сторінок за замовчуванням

| Назва          | Шлях               | Компонент           | Опис                       |
| -------------- | ------------------ | ------------------- | -------------------------- |
| admin          | /admin/\*          | AdminLayout         | Сторінки адміністрування   |
| admin.page     | /admin/:name       | AdminDynamicPage    | Динамічно створені сторінки |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Сторінки налаштувань плагінів |

## Розширення звичайних сторінок

Додавайте звичайні маршрути сторінок за допомогою `router.add()`.

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

Підтримка динамічних параметрів

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

## Розширення сторінок налаштувань плагінів

Додавайте сторінки налаштувань плагінів за допомогою `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Заголовок сторінки налаштувань
      icon: 'ApiOutlined', // Іконка меню сторінки налаштувань
      Component: HelloSettingPage,
    });
  }
}
```

Приклад багаторівневої маршрутизації

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Маршрут верхнього рівня
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      Component: Outlet,
    });

    // Дочірні маршрути
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