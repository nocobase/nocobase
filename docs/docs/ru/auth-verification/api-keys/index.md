---
pkg: '@nocobase/plugin-api-keys'
---

# Ключи API

## Введение

## Инструкции по использованию

http://localhost:13000/admin/settings/api-keys

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Добавить ключ API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Примечания**

- Ключ API создается для текущего пользователя и наследует его роль.
- Убедитесь, что переменная среды `APP_KEY` настроена и хранится в секрете. Если `APP_KEY` изменится, все добавленные ключи API станут недействительными.

### Как настроить APP_KEY

Для docker-версии измените файл docker-compose.yml

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

При установке через create-nocobase-app или из репозитория Github можно напрямую изменить APP_KEY в файле .env

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```