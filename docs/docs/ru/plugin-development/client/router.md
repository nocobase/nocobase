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

Добавляйте обычные маршруты страниц с помощью `router.add()`. Для компонентов страниц используйте `componentLoader`, чтобы модуль страницы загружался только при фактическом переходе на маршрут.

Файлы страниц должны использовать `export default`:

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
      // Динамический импорт: модуль страницы загружается только при переходе на этот маршрут
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

Поддерживает динамические параметры

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

Если страница тяжёлая или не нужна при первом рендере, отдавайте предпочтение `componentLoader`; `element` по-прежнему подходит для layout-маршрутов или очень лёгких inline-страниц.

## Расширение страниц настроек плагинов

Добавляйте страницы настроек плагина с помощью `pluginSettingsRouter.add()`. Как и для обычных маршрутов, для страниц настроек также следует использовать `componentLoader`.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Заголовок страницы настроек
      icon: 'ApiOutlined', // Иконка меню страницы настроек
      // Динамический импорт: модуль страницы загружается только при переходе на эту страницу настроек
      componentLoader: () => import('./settings/HelloSettingPage'),
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
      element: <Outlet />,
    });

    // Дочерние маршруты
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Динамический импорт: модуль страницы загружается только при переходе на эту страницу настроек
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```