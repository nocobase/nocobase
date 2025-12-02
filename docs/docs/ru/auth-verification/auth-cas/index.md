---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::


# Аутентификация: CAS

## Введение

Плагин Аутентификация: CAS соответствует стандарту протокола CAS (Central Authentication Service), позволяя пользователям входить в NocoBase с помощью учётных записей, предоставляемых сторонними поставщиками услуг аутентификации (IdP).

## Установка

## Руководство пользователя

### Активация плагина

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Добавление аутентификации CAS

Перейдите на страницу управления пользовательской аутентификацией

http://localhost:13000/admin/settings/auth/authenticators

Добавьте способ аутентификации CAS

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Настройте CAS и активируйте

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Перейдите на страницу входа

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)