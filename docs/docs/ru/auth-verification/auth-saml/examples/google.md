# Google Workspace

## Установить Google в качестве IdP

[Google Admin Console](https://admin.google.com/) — Apps — Web and mobile apps

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

После настройки приложения скопируйте **SSO URL**, **Entity ID** и **Certificate**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## Добавить новый аутентификатор в NocoBase

Параметры плагина — Аутентификация пользователей — Добавить — SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Введите скопированную информацию:

- SSO URL: SSO URL
- Публичный сертификат: Certificate
- Издатель idP: Entity ID
- http: проверьте, если вы тестируете локально через http

Затем скопируйте SP Issuer/EntityID и ACS URL из раздела Usage.

## Заполните SP-информацию в Google

Вернитесь в консоль Google: на странице **Service Provider Details** укажите ACS URL и Entity ID, которые вы скопировали ранее, и отметьте **Signed Response**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

В разделе **Attribute Mapping** добавьте сопоставления для соответствующих атрибутов.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)
