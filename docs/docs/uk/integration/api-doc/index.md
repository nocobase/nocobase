---
pkg: "@nocobase/plugin-api-doc"
---
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::



# Документація API

## Вступ

Цей плагін генерує документацію HTTP API NocoBase на основі Swagger.

## Встановлення

Це вбудований плагін, тому встановлення не потрібне. Просто активуйте його, щоб почати використовувати.

## Інструкції з використання

### Доступ до сторінки документації API

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Огляд документації

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Загальна документація API: `/api/swagger:get`
- Документація Core API: `/api/swagger:get?ns=core`
- Документація API для всіх плагінів: `/api/swagger:get?ns=plugins`
- Документація для кожного плагіна: `/api/swagger:get?ns=plugins/{name}`
- Документація API для користувацьких колекцій: `/api/swagger:get?ns=collections`
- Документація для вказаної `${collection}` та пов'язаних ресурсів `${collection}.${association}`: `/api/swagger:get?ns=collections/{name}`

## Посібник для розробників

### Як писати документацію Swagger для плагінів

Додайте файл `swagger/index.ts` до папки `src` вашого плагіна з таким вмістом:

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

Детальні правила написання дивіться в [офіційній документації Swagger](https://swagger.io/docs/specification/about/).