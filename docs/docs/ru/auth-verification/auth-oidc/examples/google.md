:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Вход через Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Как получить учетные данные Google OAuth 2.0

[Консоль Google Cloud](https://console.cloud.google.com/apis/credentials) - Создать учетные данные - Идентификатор клиента OAuth

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Перейдите в интерфейс настройки и укажите авторизованный URL перенаправления. URL перенаправления можно получить при добавлении аутентификатора в NocoBase. Как правило, это `http(s)://host:port/api/oidc:redirect`. Подробнее см. в разделе [Руководство пользователя - Настройка](../index.md#configuration).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Как добавить новый аутентификатор в NocoBase

Настройки плагина - Аутентификация пользователя - Добавить - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Для завершения настройки аутентификатора используйте параметры, описанные в разделе [Руководство пользователя - Настройка](../index.md#configuration).