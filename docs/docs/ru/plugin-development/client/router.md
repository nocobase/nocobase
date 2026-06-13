---
title: "Router"
description: "Маршрутизация клиента NocoBase: this.router.add для регистрации маршрутов страниц, pluginSettingsManager для регистрации страниц настроек плагинов (addMenuItem + addPageTabItem)."
keywords: "Router,маршрутизация,router.add,pluginSettingsManager,addMenuItem,addPageTabItem,componentLoader,регистрация страниц,NocoBase"
---

# Router

В NocoBase плагины регистрируют страницы через маршруты. Есть два распространённых способа:

- `this.router.add()` — регистрирует обычные маршруты страниц
- `this.pluginSettingsManager.addMenuItem()` + `addPageTabItem()` — регистрирует страницы настроек плагинов

Регистрация маршрутов обычно выполняется в методе `load()` плагина. Подробнее см. [Plugin](./plugin).

:::warning Примечание

В плагинах NocoBase v2 зарегистрированные маршруты по умолчанию получают префикс `/v`. При обращении к маршрутам необходимо указывать этот префикс.

:::

## Маршруты по умолчанию

В NocoBase зарегистрированы следующие маршруты по умолчанию:

| Имя            | Путь                  | Компонент           | Описание                       |
| -------------- | --------------------- | ------------------- | ------------------------------ |
| admin          | /v/admin/\*          | AdminLayout         | Страницы администрирования     |
| admin.page     | /v/admin/:name       | AdminDynamicPage    | Динамически создаваемые страницы |
| admin.settings | /v/admin/settings/\* | AdminSettingsLayout | Страницы настроек плагинов     |

## Маршруты страниц

Регистрируйте маршруты страниц через `this.router.add()`. Для компонентов страниц следует использовать `componentLoader` для отложенной загрузки, чтобы код страницы загружался только при фактическом обращении к ней.

:::warning Примечание

Файлы страниц должны экспортировать компонент через `export default`.

:::

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Регистрация в методе `load()` плагина:

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/hello',
      // Отложенная загрузка: модуль загружается только при обращении к /v/hello
      componentLoader: () => import('./pages/HelloPage'),
    });
  }
}
```

Первый аргумент `router.add()` — это имя маршрута, поддерживающее точечную нотацию `.` для выражения отношений «родитель — потомок». Например, `root.home` представляет дочерний маршрут `root`.

В компонентах можно перейти к маршруту через `ctx.router.navigate('/hello')`.

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

Подробнее см. раздел о маршрутизации в [Component](./component/index.md).

### Вложенные маршруты

Вложенность реализуется через точечную нотацию. Родительские маршруты используют `<Outlet />` для отображения содержимого дочерних маршрутов:

```tsx
import { Outlet } from 'react-router-dom';

class MyPlugin extends Plugin {
  async load() {
    // Родительский маршрут, element как встроенный макет
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

### Динамические параметры

Пути маршрутов поддерживают динамические параметры:

```tsx
this.router.add('root.user', {
  path: '/user/:id', // -> /v/user/:id
  componentLoader: () => import('./pages/UserPage'),
});
```

В компонентах можно получить динамические параметры через `ctx.route.params`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function UserPage() {
  const ctx = useFlowContext();
  const { id } = ctx.route.params; // Получить динамический параметр id
  return <h1>User ID: {id}</h1>;
}
```

Подробнее см. раздел о маршрутизации в [Component](./component/index.md).

### componentLoader или element

- **`componentLoader`** (рекомендуется): отложенная загрузка, подходит для компонентов страниц. Файлам страниц нужен `export default`.
- **`element`**: передаёт JSX напрямую, подходит для компонентов макета или очень лёгких встроенных страниц.

Если страница сама по себе имеет тяжёлые зависимости, предпочтительнее использовать `componentLoader`.

## Страницы настроек плагинов

Регистрируйте страницы настроек плагинов через `this.pluginSettingsManager`. Регистрация состоит из двух шагов — сначала используйте `addMenuItem()` для регистрации пункта меню, затем `addPageTabItem()` для регистрации самой страницы. Страницы настроек появляются в меню «Настройки плагинов» NocoBase.

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

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
```

После регистрации путь доступа — `/v/admin/settings/hello`. Когда под меню есть только одна страница, верхняя панель вкладок автоматически скрывается.

### Страница настроек с несколькими вкладками

Если странице настроек нужно несколько подстраниц, зарегистрируйте несколько вызовов `addPageTabItem` с одним и тем же `menuKey` — сверху автоматически появится панель вкладок:

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Регистрация пункта меню
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    // Вкладка 1: Общие настройки (ключ 'index' сопоставляется с /v/admin/settings/hello)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('General'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    // Вкладка 2: Расширенные настройки (сопоставляется с /v/admin/settings/hello/advanced)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
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
