---
pkg: "@nocobase/plugin-api-doc"
---


# Документация API

## Введение

Плагин генерирует документацию HTTP API NocoBase на основе Swagger.

## Установка

Это встроенный плагин, установка не требуется. Активируйте его, чтобы использовать.

## Инструкции по использовани

### Доступ к странице документации API

http://localhost:13000/admin/settings/api-doc

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Обзор документации

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Общая документация API: `/api/swagger:get`
- Документация API ядра: `/api/swagger:get?ns=core`
- Документация API всех плагинов: `/api/swagger:get?ns=plugins`
- Документация каждого плагина: `/api/swagger:get?ns=plugins/{name}`
- Документация API пользовательских коллекций: `/api/swagger:get?ns=collections`
- Ресурсы `${collection}` и связанные `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## Руководство для разработчиков

### Как писать Swagger-документацию для плагинов

Добавьте файл `swagger/index.ts` в папке `src` плагина со следующим содержимым:

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

Подробные правила написания см. в [официальной документации Swagger](https://swagger.io/docs/specification/about/).