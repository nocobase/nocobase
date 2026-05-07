:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Роутер

Клиент NocoBase предоставляет гибкий менеджер маршрутизации, который позволяет расширять страницы и страницы настроек плагинов с помощью `router.add()` и `pluginSettingsManager`.

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

Register plugin settings pages via `this.pluginSettingsManager`. Registration has two steps — first use `addMenuItem()` to register the menu entry, then use `addPageTabItem()` to register the actual page. Settings pages appear in the NocoBase "Plugin Settings" menu.

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello Settings'),
      icon: 'ApiOutlined',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Hello Settings'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

To add multiple sub-pages under a single menu entry, register multiple `addPageTabItem` calls with the same `menuKey` — tabs will appear automatically:

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('General'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('Advanced'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```