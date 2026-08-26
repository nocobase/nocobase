---
title: "Шпаргалка по разработке плагинов"
description: "Шпаргалка по разработке плагинов NocoBase: что нужно сделать → в каком файле → какой API вызвать, быстрый поиск места для кода."
keywords: "шпаргалка,Cheatsheet,способ регистрации,расположение файлов,NocoBase"
---

# Шпаргалка по разработке плагинов

При написании плагина часто возникает мысль: «Что и где именно писать, какой API вызывать?». Эта шпаргалка поможет быстро найти ответ.

## Структура каталогов плагина

При создании плагина через `yarn pm create @my-project/plugin-name` автоматически генерируется следующая структура каталогов. Не создавайте каталоги вручную, чтобы не пропустить шаг регистрации и не получить неработающий плагин. Подробности см. в [Написание первого плагина](../../write-your-first-plugin).

```bash
plugin-name/
├── src/
│   ├── client-v2/              # 客户端代码（v2）
│   │   ├── plugin.tsx          # 客户端插件入口
│   │   ├── locale.ts           # useT / tExpr 翻译 hook
│   │   ├── models/             # FlowModel（区块、字段、操作）
│   │   └── pages/              # 页面组件
│   ├── client/                 # 客户端代码（v1，兼容）
│   │   ├── plugin.tsx
│   │   ├── locale.ts
│   │   ├── models/
│   │   └── pages/
│   ├── server/                 # 服务端代码
│   │   ├── plugin.ts           # 服务端插件入口
│   │   └── collections/        # 数据表定义
│   └── locale/                 # 多语言翻译文件
│       ├── zh-CN.json
│       └── en-US.json
├── client-v2.js                # 根目录入口（构建产物指向）
├── client-v2.d.ts
├── client.js
├── client.d.ts
├── server.js
├── server.d.ts
└── package.json
```

## Клиент: что я хочу сделать → как это написать

| Что я хочу сделать | В каком файле писать | Какой API вызывать | Документация |
| --- | --- | --- | --- |
| Зарегистрировать маршрут страницы | `load()` в `plugin.tsx` | `this.router.add()` | [Router](../router) |
| Зарегистрировать страницу настроек плагина | `load()` в `plugin.tsx` | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| Зарегистрировать пользовательский блок | `load()` в `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Расширение блоков](../flow-engine/block) |
| Зарегистрировать пользовательское поле | `load()` в `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Расширение полей](../flow-engine/field) |
| Зарегистрировать пользовательское действие | `load()` в `plugin.tsx` | `this.flowEngine.registerModelLoaders()` | [FlowEngine → Расширение действий](../flow-engine/action) |
| Сделать так, чтобы внутренняя таблица появилась в выборе таблицы данных блока | `load()` в `plugin.tsx` | `mainDS.addCollection()` | [Collections (Таблицы данных)](../../server/collections) |
| Перевести тексты плагина | `locale/zh-CN.json` + `locale/en-US.json` | — | [i18n Интернационализация](../component/i18n) |

## Сервер: что я хочу сделать → как это написать

| Что я хочу сделать | В каком файле писать | Какой API вызывать | Документация |
| --- | --- | --- | --- |
| Определить таблицу данных | `server/collections/xxx.ts` | `defineCollection()` | [Collections (Таблицы данных)](../../server/collections) |
| Расширить существующую таблицу данных | `server/collections/xxx.ts` | `extendCollection()` | [Collections (Таблицы данных)](../../server/collections) |
| Зарегистрировать пользовательский интерфейс | `load()` в `server/plugin.ts` | `this.app.resourceManager.define()` | [ResourceManager](../../server/resource-manager) |
| Настроить права доступа интерфейса | `load()` в `server/plugin.ts` | `this.app.acl.allow()` | [ACL Контроль доступа](../../server/acl) |
| Записать начальные данные при установке плагина | `install()` в `server/plugin.ts` | `this.db.getRepository().create()` | [Plugin (Плагин)](../../server/plugin) |

## Шпаргалка по FlowModel

| Что я хочу сделать | Какой базовый класс наследовать | Ключевой API |
| --- | --- | --- |
| Сделать чистый блок отображения | `BlockModel` | `renderComponent()` + `define()` |
| Сделать блок, привязанный к таблице данных (с пользовательским рендерингом) | `CollectionBlockModel` | `createResource()` + `renderComponent()` |
| Сделать полноценный блок таблицы (на базе встроенной таблицы) | `TableBlockModel` | `filterCollection()` + `customModelClasses` |
| Сделать компонент отображения поля | `ClickableFieldModel` | `renderComponent(value)` + `bindModelToInterface()` |
| Сделать кнопку действия | `ActionModel` | `static scene` + `registerFlow({ on: 'click' })` |

## Шпаргалка по методам перевода

| Сценарий | Что использовать | Откуда импортировать |
| --- | --- | --- |
| В `load()` плагина | `this.t('key')` | Встроено в базовый класс Plugin |
| В React-компоненте | `const t = useT(); t('key')` | `locale.ts` |
| Статическое определение FlowModel (`define()`, `registerFlow()`) | `tExpr('key')` | `locale.ts` |

## Шпаргалка распространённых API-вызовов

| Что я хочу сделать | В Plugin | В компоненте |
| --- | --- | --- |
| Отправить API-запрос | `this.context.api.request()` | `ctx.api.request()` |
| Получить перевод | `this.t()` | `useT()` |
| Получить логгер | `this.context.logger` | `ctx.logger` |
| Зарегистрировать маршрут | `this.router.add()` | — |
| Навигация | — | `ctx.router.navigate()` |
| Открыть модальное окно | — | `ctx.viewer.dialog()` |

## Связанные ссылки

- [Обзор клиентской разработки](../index.md) — путь обучения и быстрый указатель
- [Plugin (Плагин)](../plugin) — точка входа плагина и жизненный цикл
- [Частые проблемы и руководство по устранению неполадок](./faq) — разбор часто встречающихся проблем
- [Router (Маршрутизация)](../router) — регистрация маршрутов страниц
- [FlowEngine → Расширение блоков](../flow-engine/block) — базовые классы серии BlockModel
- [FlowEngine → Расширение полей](../flow-engine/field) — разработка FieldModel
- [FlowEngine → Расширение действий](../flow-engine/action) — разработка ActionModel
- [Collections (Таблицы данных)](../../server/collections) — defineCollection и типы полей
- [i18n Интернационализация](../component/i18n) — формат файлов перевода
- [ResourceManager (Управление ресурсами)](../../server/resource-manager) — пользовательские REST API
- [ACL Контроль доступа](../../server/acl) — настройка прав доступа
- [Plugin (Плагин, сервер)](../../server/plugin) — жизненный цикл серверного плагина
- [Написание первого плагина](../../write-your-first-plugin) — создание каркаса плагина
