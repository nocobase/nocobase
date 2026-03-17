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

Додавайте звичайні маршрути сторінок через `router.add()`. Для компонентів сторінок використовуйте `componentLoader`, щоб модуль сторінки завантажувався лише тоді, коли користувач фактично переходить на цей маршрут.

Файли сторінок мають використовувати `export default`:

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
      // Динамічний імпорт: модуль сторінки завантажується лише після входу на цей маршрут
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

Підтримка динамічних параметрів

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Якщо сторінка важка або не потрібна під час першого рендеру, варто віддавати перевагу `componentLoader`; `element` і далі підходить для layout-маршрутів або дуже легких inline-сторінок.

## Розширення сторінок налаштувань плагінів

Додавайте сторінки налаштувань плагіна через `pluginSettingsRouter.add()`. Як і для звичайних маршрутів, для сторінок налаштувань також слід використовувати `componentLoader`.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Заголовок сторінки налаштувань
      icon: 'ApiOutlined', // Іконка меню сторінки налаштувань
      // Динамічний імпорт: модуль сторінки завантажується лише після входу на цю сторінку налаштувань
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Дочірні маршрути
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Динамічний імпорт: модуль сторінки завантажується лише після входу на цю сторінку налаштувань
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```