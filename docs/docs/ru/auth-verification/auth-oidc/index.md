---
pkg: '@nocobase/plugin-auth-oidc'
title: "Аутентификация: OIDC"
description: "Аутентификация NocoBase OIDC SSO: следует протоколу OpenID Connect, режим Authorization Code, поддержка IdP Google, Microsoft Entra ID и других, настройка Issuer, Client ID, маппинг полей."
keywords: "OIDC,OpenID Connect,SSO,единый вход,Google,Microsoft Entra,NocoBase"
---

:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Аутентификация: OIDC

## Введение

Плагин аутентификации OIDC следует стандарту OIDC (OpenID Connect) и использует режим Authorization Code Flow, чтобы пользователь мог входить в NocoBase с помощью учётной записи стороннего провайдера идентификации (IdP).

## Активация плагина

![](https://static-docs.nocobase.com/202411122358790.png)

## Добавление аутентификации OIDC

Перейдите на страницу управления плагинами аутентификации.

![](https://static-docs.nocobase.com/202411130004459.png)

Add — OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Настройка

### Базовая конфигурация

![](https://static-docs.nocobase.com/202411130006341.png)

| Настройка | Описание | Версия |
| --- | --- | --- |
| Sign up automatically when the user does not exist | Автоматически создавать нового пользователя, если не найдено совпадение с существующим. | - |
| Issuer | Issuer предоставляется IdP, обычно заканчивается на `/.well-known/openid-configuration`. | - |
| Client ID | Идентификатор клиента | - |
| Client Secret | Секрет клиента | - |
| scope | Необязательно, по умолчанию `openid email profile`. | - |
| id_token signed response algorithm | Алгоритм подписи id_token, по умолчанию `RS256`. | - |
| Enable RP-initiated logout | Включить RP-initiated logout: при выходе из NocoBase также выполняется выход из IdP. В IdP укажите URL Post logout redirect, приведённый в разделе [Использование](#использование). | `v1.3.44-beta` |

### Маппинг полей

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Настройка | Описание |
| --- | --- |
| Field Map | Маппинг полей. На стороне NocoBase сейчас доступны псевдоним, e-mail и номер телефона. По умолчанию псевдоним получает значение `openid`. |
| Use this field to bind the user | Поле для сопоставления с существующим пользователем — e-mail или имя пользователя; по умолчанию e-mail. Информация пользователя от IdP должна содержать `email` или `username`. |

### Расширенная конфигурация

![](https://static-docs.nocobase.com/202411130013306.png)

| Настройка | Описание | Версия |
| --- | --- | --- |
| HTTP | Использует ли URL обратного вызова NocoBase протокол http; по умолчанию `https`. | - |
| Port | Порт URL обратного вызова NocoBase; по умолчанию `443/80`. | - |
| State token | Используется для проверки источника запроса и защиты от CSRF. Можно задать фиксированное значение, **настоятельно рекомендуется оставить пустым — будет автоматически сгенерировано случайное. При использовании фиксированного значения оцените риски в вашей среде.** | - |
| Pass parameters in the authorization code grant exchange | При обмене code на token некоторые IdP требуют передавать Client ID или Client Secret в виде параметров. Установите флажок и укажите имена параметров. | - |
| Method to call the user info endpoint | HTTP-метод запроса к API получения информации о пользователе. | - |
| Where to put the access token when calling the user info endpoint | Способ передачи access token при запросе к API получения информации о пользователе.<br/>- Header — заголовок запроса (по умолчанию).<br />- Body — тело запроса, используется с методом `POST`.<br />- Query parameters — параметры запроса, используется с методом `GET`. | - |
| Skip SSL verification | Пропустить проверку SSL при запросах к API IdP. **Эта опция делает систему уязвимой к атаке «человек посередине». Включайте только тогда, когда явно понимаете её назначение. Категорически не рекомендуется в production.** | `v1.3.40-beta` |

### Использование

![](https://static-docs.nocobase.com/202411130019570.png)

| Настройка | Описание |
| --- | --- |
| Redirect URL | Используется для настройки URL обратного вызова в IdP. |
| Post logout redirect URL | При включённом RP-initiated logout — для настройки Post logout redirect URL в IdP. |

:::info
Для локального тестирования используйте `127.0.0.1`, а не `localhost`: вход через OIDC требует записи state в cookie клиента для проверки безопасности. Если при входе окно мелькает, но вход не выполняется, проверьте серверные логи на наличие записи о несовпадении state и убедитесь, что в cookie запроса присутствует параметр state. Обычно это происходит из-за несовпадения state в cookie и в запросе.
:::

## Вход

Откройте страницу входа и нажмите кнопку под формой, чтобы инициировать вход через стороннего поставщика.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)
