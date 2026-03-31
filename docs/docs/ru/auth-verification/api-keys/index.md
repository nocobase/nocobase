---
pkg: '@nocobase/plugin-api-keys'
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::


# Ключи API

## Введение

## Инструкции по использованию

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Добавление ключа API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Примечания**

- Ключ API создается для текущего пользователя и наследует роль пользователя.
- Убедитесь, что переменная окружения `APP_KEY` настроена и хранится в секрете. Если `APP_KEY` изменится, все добавленные ключи API станут недействительными.

### Как настроить APP_KEY

Для версии Docker измените файл `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

При установке из исходного кода или с помощью `create-nocobase-app` вы можете изменить `APP_KEY` непосредственно в файле `.env`:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```