---
pkg: "@nocobase/plugin-api-doc"
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::



# Документация API

## Введение

Этот плагин генерирует документацию HTTP API NocoBase на основе Swagger.

## Установка

Это встроенный плагин, поэтому установка не требуется. Просто активируйте его, чтобы начать использовать.

## Инструкции по использованию

### Доступ к странице документации API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Обзор документации

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Общая документация API: `/api/swagger:get`
- Документация API ядра: `/api/swagger:get?ns=core`
- Документация API для всех плагинов: `/api/swagger:get?ns=plugins`
- Документация для каждого плагина: `/api/swagger:get?ns=plugins/{name}`
- Документация API для пользовательских коллекций: `/api/swagger:get?ns=collections`
- Документация для указанной `${collection}` и связанных с ней ресурсов `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## Руководство для разработчиков

### Как писать документацию Swagger для плагинов

Добавьте файл `swagger/index.ts` в папку `src` вашего плагина со следующим содержимым:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

Подробные правила написания документации вы можете найти в [официальной документации Swagger](https://swagger.io/docs/specification/about/).