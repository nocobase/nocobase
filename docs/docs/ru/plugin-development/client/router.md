---
title: "Router"
description: "Маршрутизация клиента NocoBase: this.router.add для регистрации маршрутов страниц, pluginSettingsManager для регистрации страниц настроек плагинов (addMenuItem + addPageTabItem)."
keywords: "Router,маршрутизация,router.add,pluginSettingsManager,addMenuItem,addPageTabItem,componentLoader,регистрация страниц,NocoBase"
---

# Маршрутизация

Клиент NocoBase предоставляет гибкий менеджер маршрутов, который поддерживает расширение обычных страниц и страниц настроек плагинов через `router.add()` и `pluginSettingsRouter.add()`.

- `this.router.add()` — регистрирует обычные маршруты страниц
- `this.pluginSettingsManager.addMenuItem()` + `addPageTabItem()` — регистрирует страницы настроек плагинов

Регистрация маршрутов обычно выполняется в методе `load()` плагина. Подробнее см. [Plugin](./plugin).

:::warning Примечание

В плагинах NocoBase v2 зарегистрированные маршруты по умолчанию получают префикс `/v`. При обращении к маршрутам необходимо указывать этот префикс.

:::

## Зарегистрированные маршруты страниц по умолчанию

В NocoBase зарегистрированы следующие маршруты по умолчанию:

| Имя           | Путь              | Компонент           | Описание |
| ------------- | ----------------- | ------------------- | -------- |
| admin          | /admin/\*         | AdminLayout         | Страницы админ-панели |
| admin.page     | /admin/:name      | AdminDynamicPage    | Динамически создаваемые страницы |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Страницы настроек плагинов |

## Расширение обычных страниц

Добавьте маршруты обычных страниц через `router.add()`.

:::warning Примечание

Файлы страниц должны экспортировать компонент через `export default`.

:::

```tsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';
const Home = () => <h1>Home</h1>;
```

const About = () => <h1>About</h1>;

```tsx
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
```

    this.router.add('root', { element: <Layout /> });

    this.router.add('root.home', { path: '/', element: <Home /> });

```tsx
    this.router.add('root.about', { path: '/about', element: <About /> });
  }

}
const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin]
});
export default app.getRootComponent();
  );
}
```

Поддерживаются динамические параметры

### Вложенные маршруты

Вложенность реализуется через точечную нотацию. Родительские маршруты используют `<Outlet />` для отображения содержимого дочерних маршрутов:

```tsx
this.router.add('root.user', {

  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
    this.router.add('root', {
      element: (
        <div>
          <nav>Панель навигации</nav>
          <Outlet />
        </div>
      ),
    });

    // Дочерний маршрут, componentLoader для отложенной загрузки
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

## Расширение страниц настроек плагина

Добавьте страницы настроек плагина через `pluginSettingsRouter.add()`.

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';
const HelloSettingPage = () => <div>Hello Setting page</div>;
export class HelloPlugin extends Plugin {
```

  async load() {

```tsx
    this.pluginSettingsRouter.add('hello', {

      title: 'Hello', // Заголовок страницы настроек
      icon: 'ApiOutlined', // Иконка пункта меню страницы настроек
      Component: HelloSettingPage,
    });
  }
```

}

### componentLoader или element

- **`componentLoader`** (рекомендуется): отложенная загрузка, подходит для компонентов страниц. Файлам страниц нужен `export default`.
- **`element`**: передаёт JSX напрямую, подходит для компонентов макета или очень лёгких встроенных страниц.

Если страница сама по себе имеет тяжёлые зависимости, предпочтительнее использовать `componentLoader`.

## Страницы настроек плагинов

Регистрируйте страницы настроек плагинов через `this.pluginSettingsManager`. Регистрация состоит из двух шагов — сначала используйте `addMenuItem()` для регистрации пункта меню, затем `addPageTabItem()` для регистрации самой страницы. Страницы настроек появляются в меню «Настройки плагинов» NocoBase.

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```
Пример многоуровневой маршрутизации

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Регистрация пункта меню
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello Settings'),
      icon: 'ApiOutlined', // Имя иконки Ant Design, см. https://5x.ant.design/components/icon
    });

    // Регистрация страницы (ключ 'index' сопоставляется с корневым путём меню)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Hello Settings'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```tsx

import { Outlet } from 'react-router-dom';

### Страница настроек с несколькими вкладками

const pluginName = 'hello';

```tsx
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
      key: 'advanced',
      title: this.t('Advanced'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```

### Параметры addMenuItem

| Поле       | Тип                   | Обязательно | Описание                                                             |
| ---------- | --------------------- | ----------- | ------------------------------------------------------------------- |
| `key`      | `string`              | Да          | Уникальный идентификатор меню, не может содержать `.`               |
| `title`    | `ReactNode`           | Нет         | Заголовок меню                                                      |
| `icon`     | `string \| ReactNode` | Нет         | Иконка меню; для строки отображается как встроенный `Icon`          |
| `sort`     | `number`              | Нет         | Значение сортировки; меньшие значения выше, по умолчанию `0`        |
| `showTabs` | `boolean`             | Нет         | Показывать ли верхнюю панель вкладок; по умолчанию определяется числом страниц |
| `hidden`   | `boolean`             | Нет         | Скрывать ли пункт навигации                                         |

### Параметры addPageTabItem

| Поле              | Тип         | Обязательно | Описание                                                            |
| ----------------- | ----------- | ----------- | ------------------------------------------------------------------- |
| `menuKey`         | `string`    | Да          | `key` родительского меню, соответствует `key` из `addMenuItem`      |
| `key`             | `string`    | Да          | Уникальный идентификатор страницы. `'index'` обозначает страницу по умолчанию, сопоставленную с корневым путём меню |
| `title`           | `ReactNode` | Нет         | Заголовок страницы (отображается на вкладке)                        |
| `componentLoader` | `Function`  | Нет         | Компонент страницы с отложенной загрузкой (рекомендуется)           |
| `Component`       | `Component` | Нет         | Передать компонент напрямую (альтернатива `componentLoader`)        |
| `sort`            | `number`    | Нет         | Значение сортировки; меньшие значения выше                          |
| `hidden`          | `boolean`   | Нет         | Скрывать ли на панели вкладок                                       |
| `link`            | `string`    | Нет         | Внешняя ссылка; если задана, клик по вкладке ведёт на внешний URL   |

## Связанные ссылки

- [Plugin](./plugin) — маршруты регистрируются в `load()`
- [Component](./component/index.md) — как писать компоненты страниц, монтируемые маршрутами
- [Пример плагина: создание страницы настроек](./examples/settings-page) — полный пример страницы настроек
