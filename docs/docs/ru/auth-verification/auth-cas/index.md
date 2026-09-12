---
pkg: '@nocobase/plugin-auth-cas'
---

# Аутентификация: CAS (Auth: CAS)

## Введение

Плагин Аутентификация: CAS следует стандарту протокола CAS (Central Authentication Service), позволяя пользователям входить в NocoBase, используя аккаунты, предоставляемые сторонними провайдерами централизованной аутентификации (IdP).

## Установка

## Руководство пользователя

### Активировать плагин

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Добавить CAS-аутентификацию

Перейдите на страницу управления аутентификацией пользователей

http://localhost:13000/admin/settings/auth/authenticators

Добавьте метод CAS-аутентификации

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Настройте CAS и активируйте

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Перейдите на страницу входа

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)