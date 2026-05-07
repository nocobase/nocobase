---
title: "JS Item"
description: "JS Item: позволяет рендерить кастомный пункт действия в панели операций с помощью JavaScript/JSX, поддерживает React, ctx и связки с контекстом коллекции/записи/формы."
keywords: "JSItem,JS Item,JS Item,кастомный пункт действия,JavaScript,конструктор интерфейса,NocoBase"
---

# JS Item

## Введение

JS Item используется для отображения в панели операций «кастомного пункта действия». Вы можете напрямую писать JavaScript / JSX и выводить любой UI: кнопку, группу кнопок, выпадающее меню, текстовую подсказку, ярлык состояния или небольшие интерактивные компоненты, а внутри компонента — обращаться к интерфейсам, открывать всплывающие окна, читать текущую запись или обновлять данные Block.

JS Item можно использовать в панели инструментов формы, панели инструментов таблицы (на уровне коллекции), действиях строки таблицы (на уровне записи) и т. п. Подходит для следующих случаев:

- Нужно настроить структуру кнопки, а не просто привязать к ней обработчик клика;
- Нужно объединить несколько действий в группу кнопок или выпадающее меню;
- Нужно отображать в панели операций актуальное состояние, статистику или поясняющие сведения;
- Нужно динамически рендерить разный контент в зависимости от текущей записи, выделенных данных или значений формы.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM%20(1).png)

## Отличия от JS Action

- `JS Action` больше подходит для сценария «после нажатия на кнопку выполнить скрипт», основной фокус — логика поведения.
- `JS Item` больше подходит для сценария «самостоятельно отрендерить пункт действия» — Вы управляете и интерфейсом, и логикой взаимодействия.

Если нужно лишь дополнить существующую кнопку логикой клика, используйте `JS Action`; если нужно настроить структуру интерфейса пункта действия или отрендерить несколько контролов, выбирайте `JS Item`.

## Контекст времени выполнения (наиболее используемые API)

Во время выполнения JS Item доступны типовые возможности, которые можно использовать в скрипте напрямую:

- `ctx.render(vnode)` — отрендерить React-элемент, HTML-строку или DOM-узел в контейнер текущего пункта действия;
- `ctx.element` — DOM-контейнер текущего пункта действия (ElementProxy);
- `ctx.api.request(options)` — выполнить HTTP-запрос;
- `ctx.openView(viewUid, options)` — открыть настроенное представление (drawer / dialog / страница);
- `ctx.message` / `ctx.notification` — глобальные подсказки и уведомления;
- `ctx.t()` / `ctx.i18n.t()` — интернационализация;
- `ctx.resource` — ресурс данных контекста уровня коллекции, например для чтения выделенных записей или обновления списка;
- `ctx.record` — текущая запись в контексте уровня записи;
- `ctx.form` — экземпляр AntD Form в контексте уровня формы;
- `ctx.blockModel` / `ctx.collection` — мета-информация о текущем Block и коллекции;
- `ctx.requireAsync(url)` — асинхронная загрузка AMD / UMD библиотеки по URL;
- `ctx.importAsync(url)` — динамический импорт ESM-модуля по URL;
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula` — встроенные часто используемые библиотеки, которые можно напрямую использовать для JSX-рендера, работы со временем, обработки данных и математических операций.

> Реальный набор доступных переменных зависит от того, где расположен пункт действия. Например, в действиях строки таблицы обычно доступен `ctx.record`, в панели инструментов формы — `ctx.form`, в панели инструментов таблицы — `ctx.resource`.

## Редактор и сниппеты

- `Snippets` — открывает встроенный список сниппетов, по которым можно искать и одним кликом вставлять выбранный фрагмент в текущую позицию курсора.
- `Run` — запускает текущий код прямо здесь и выводит логи в нижнюю панель `Logs`. Поддерживается `console.log/info/warn/error` и подсветка ошибок с точной локализацией.

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM.png)

- Можно совмещать с AI-сотрудником для генерации/изменения скрипта: [AI-сотрудник Nathan: фронтенд-инженер](/ai-employees/features/built-in-employee)

## Типичные сценарии использования (краткие примеры)

### 1) Рендеринг обычной кнопки

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      type="primary"
      onClick={() => ctx.message.success(ctx.t('Click from JS item'))}
    >
      {ctx.t('JS item')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 2) Действие коллекции: комбинация кнопки и выпадающего меню

```js
const { Space, Button, Dropdown } = ctx.libs.antd;
const { EllipsisOutlined } = ctx.libs.antdIcons;

function JsItem() {
  const items = [
    { key: 'export', label: ctx.t('Export selected') },
    { key: 'refresh', label: ctx.t('Refresh data') },
  ];

  const onMenuClick = async ({ key }) => {
    if (key === 'export') {
      const rows = ctx.resource?.getSelectedRows?.() || [];
      if (!rows.length) {
        ctx.message.warning(ctx.t('Please select records'));
        return;
      }
      ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
      return;
    }

    if (key === 'refresh') {
      await ctx.resource?.refresh?.();
      ctx.message.success(ctx.t('Refreshed'));
    }
  };

  return (
    <Space.Compact>
      <Button>{ctx.t('Actions')}</Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} placement="bottomRight">
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </Space.Compact>
  );
}

ctx.render(<JsItem />);
```

### 3) Действие записи: открытие представления на основе текущей строки

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      onClick={async () => {
        // Open a view as drawer and pass arguments at top-level
        const popupUid = `${ctx.model.uid}-details`;
        await ctx.openView(popupUid, {
          mode: 'drawer',
          title: ctx.t('Details'),
          size: 'large',
        });
      }}
    >
      {ctx.t('Open')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 4) Рендеринг кастомного контента состояния

```js
const { Tag } = ctx.libs.antd;

function JsItem() {
  const count = ctx.resource?.getSelectedRows?.()?.length || 0;

  return (
    <Tag color={count ? 'processing' : 'default'}>
      Selected: {count}
    </Tag>
  );
}

ctx.render(<JsItem />);
```

## Замечания

- Если требуется лишь «выполнить логику после нажатия», предпочтительнее использовать `JS Action` — реализация будет проще.
- При вызовах интерфейсов добавляйте `try/catch` и пользовательские подсказки, чтобы исключения не молчали.
- При взаимодействии с таблицами, списками и связанными всплывающими окнами после успешной отправки можно вручную обновить данные через `ctx.resource?.refresh?.()` или ресурс соответствующего Block.
- При использовании внешних библиотек подгружайте их с проверенного CDN и предусмотрите обработку случая, когда загрузка не удалась.

## Связанные документы

- [Переменные и контекст](/interface-builder/variables)
- [Правила связывания](/interface-builder/linkage-rule)
- [Представления и всплывающие окна](/interface-builder/actions/types/view)
- [JS Action](/interface-builder/actions/types/js-action)
