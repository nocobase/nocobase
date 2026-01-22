:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Ключ API

## Введение

## Установка

## Инструкции по использованию

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Добавление ключа API

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Важные примечания**

- Добавленный ключ API принадлежит текущему пользователю и наследует его роль.
- Убедитесь, что переменная окружения `APP_KEY` настроена и сохраняется в секрете. Если `APP_KEY` изменится, все ранее добавленные ключи API станут недействительными.

### Как настроить `APP_KEY`

Для версии Docker измените файл `docker-compose.yml`:

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

При установке из исходного кода или с помощью `create-nocobase-app` вы можете напрямую изменить `APP_KEY` в файле `.env`:

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```