---
title: "nb portal registry"
description: "Справочник nb portal registry: управление элементами Portal Registry, предоставляемыми плагинами, в рабочей области AI Portal."
keywords: "nb portal registry,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry

Управляет элементами NocoBase Portal Registry в рабочей области AI Portal. Включенные на сервере плагины могут предоставлять повторно используемые frontend-интеграции: компоненты, хуки, адаптеры и демонстрационные страницы. Команды Registry устанавливают их в исходный код Portal.

## Использование

```bash
nb portal registry <команда>
```

## Подкоманды

| Команда | Описание |
| --- | --- |
| [`nb portal registry sync`](./sync.md) | Установить или обновить элементы Registry, предоставляемые включенными плагинами NocoBase |

## Требования

- Рабочая область Portal должна быть создана и содержать `package.json` и `components.json`.
- Выбранная среда NocoBase должна предоставлять API Portal Registry.
- Доступны только элементы Registry из включенных плагинов.

## Примеры

Установить все доступные элементы Registry в Portal `customer`:

```bash
nb portal registry sync customer
```

Установить выбранные элементы:

```bash
nb portal registry sync customer ai acl auth-sms
```

## Связанные команды

- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
