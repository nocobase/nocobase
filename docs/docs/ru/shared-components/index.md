---
title: "Общие компоненты"
description: "Общие компоненты NocoBase client v2: контейнеры форм, поля форм, фильтры, таблицы и иконки."
keywords: "client-v2,shared components,React,Antd,NocoBase"
---

# Общие компоненты

В NocoBase client v2 есть набор общих компонентов. При разработке страниц плагинов, страниц настроек или форм их можно использовать напрямую, повторно используя готовый UI и поведение NocoBase.

Этот раздел группирует компоненты по сценариям использования. Каждая страница описывает один компонент: когда он подходит, какие API используются чаще всего и можно ли посмотреть пример прямо в документации.

## Быстрый указатель

| Я хочу... | Где посмотреть |
| --- | --- |
| Управлять низкоуровневым полноэкранным сканером | [CodeScanner](./form/code-scanner) |
| Разместить стандартную форму в dialog | [DialogFormLayout](./form/dialog-form-layout) |
| Разместить стандартную форму в drawer | [DrawerFormLayout](./form/drawer-form-layout) |
| Разрешить только переменные окружения `$env` | [EnvVariableInput](./form/env-variable-input) |
| Ввести размер файла и сохранить его в байтах | [FileSizeInput](./form/file-size-input) |
| Редактировать конфигурацию JSON / JSON5 | [JsonTextArea](./form/json-text-area) |
| Ввести пароль с индикатором надежности | [PasswordInput](./form/password-input) |
| Асинхронно загрузить опции Select из API | [RemoteSelect](./form/remote-select) |
| Добавить поддержку сканирования в поле ввода | [ScanInput](./form/scan-input) |
| Разрешить полю принимать и константы, и переменные | [TypedVariableInput](./form/typed-variable-input) |
| Разрешить однострочному полю принимать переменные вроде `{{ $env.X }}` и `{{ $user.name }}` | [VariableInput](./form/variable-input) |
| Вставлять переменные в конфигурацию JSON / JSON5 | [VariableJsonTextArea](./form/variable-json-text-area) |
| Разрешить многострочному тексту принимать переменные | [VariableTextArea](./form/variable-text-area) |
| Фильтровать Collection по нескольким условиям | [CollectionFilter](./filter/) |
| Встроить панель фильтра Collection в страницу | [CollectionFilterPanel](./filter/collection-filter-panel) |
| Настроить перетаскиваемую строку antd Table | [SortableRow](./table/sortable-row) |
| Настроить колонку ручки перетаскивания Table | [SortHandle](./table/sort-handle) |
| Показывать списки, выбирать строки и сортировать перетаскиванием на страницах настроек | [Table](./table/) |
| Использовать иконки Ant Design или регистрировать свои иконки | [Icon](./icon) |
| Создать внутренний реестр для элементов расширения плагина | [createFormRegistry](./create-form-registry) |

## Использование

Импортируйте нужные компоненты в клиентском плагине и используйте их как обычные React-компоненты:

```tsx
import { RemoteSelect, Table } from '@nocobase/client-v2';

function SettingsPage() {
  return (
    <>
      <RemoteSelect request={loadOptions} />
      <Table rowKey="id" columns={columns} dataSource={records} />
    </>
  );
}
```

## Когда использовать

По умолчанию используйте React + Antd. Для типичных сценариев плагинов NocoBase сначала проверьте эти компоненты:

- Открывать формы drawer или dialog на страницах настроек
- Вставлять переменные, редактировать JSON, вводить размер файла или сканировать коды в полях формы
- Использовать фильтры Collection или сортировку перетаскиванием в списках
- Использовать единый вход для иконок NocoBase

Для обычных полей ввода, кнопок и сообщений компоненты Antd обычно понятнее.

## Связанные ссылки

- [Разработка компонентов](../plugin-development/client/component/index.md)
- [Context - Частые возможности](../plugin-development/client/ctx/common-capabilities.md)
- [FlowEngine](../flow-engine/index.md)
