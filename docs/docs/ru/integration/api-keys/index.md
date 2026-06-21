# Ключ API

## Введение

## Установка

## Инструкции по использованию

http://localhost:13000/admin/settings/api-keys

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Добавить ключ API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Примечания**

- Добавленный вами ключ API принадлежит текущему пользователю и наследует роль текущего пользователя.
- Убедитесь, что переменная окружения `APP_KEY` настроена и хранится в секрете. Если `APP_KEY` изменится, все ранее добавленные ключи API станут недействительными.

### Как настроить APP_KEY

Для Docker-версии измените файл `docker-compose.yml`.

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

Для установки из исходного кода или через create-nocobase-app вы можете напрямую изменить `APP_KEY` в файле `.env`.

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```