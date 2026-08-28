# Вход через Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Получить учетные данные Google OAuth 2.0

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) — Создать учетные данные — OAuth Client ID

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Перейдите в интерфейс настройки и укажите Разрешённый URL перенаправления. URL перенаправления можно получить при добавлении аутентификатора в NocoBase; обычно он выглядит как `http(s)://host:port/api/oidc:redirect`. См. раздел [Руководство пользователя - Конфигурация](../index.md#configuration).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Добавить новый аутентификатор в NocoBase

Параметры плагина — Пользовательская аутентификация — Добавить — OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Для завершения конфигурации аутентификатора используйте параметры, описанные в [Руководстве пользователя - Конфигурация](../index.md#configuration).