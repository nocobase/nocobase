---
pkg: '@nocobase/plugin-api-keys'
---
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::

# API-ключі

## Вступ

## Інструкції з використання

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Додати API-ключ

![](https://static-docs.nocobase.com/461872fc0ad9a96fa5b14e97fcba12.png)

**Примітка**

- API-ключ створюється для поточного користувача та успадковує його роль.
- Будь ласка, переконайтеся, що змінна середовища `APP_KEY` налаштована та зберігається в таємниці. Якщо `APP_KEY` зміниться, усі додані API-ключі стануть недійсними.

### Як налаштувати APP_KEY

Для версії Docker змініть файл `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Для встановлення з вихідного коду або за допомогою `create-nocobase-app` ви можете безпосередньо змінити `APP_KEY` у файлі `.env`:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```