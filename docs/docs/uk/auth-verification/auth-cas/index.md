---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::

# Автентифікація: CAS

## Вступ

Плагін Автентифікація: CAS дотримується стандарту протоколу CAS (Central Authentication Service), дозволяючи користувачам входити в NocoBase за допомогою облікових записів, наданих сторонніми постачальниками послуг ідентифікації (IdP).

## Встановлення

## Посібник користувача

### Активація плагіна

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### Додавання автентифікації CAS

Відвідайте сторінку керування автентифікацією користувачів

http://localhost:13000/admin/settings/auth/authenticators

Додайте метод автентифікації CAS

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

Налаштуйте CAS та активуйте його

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### Відвідайте сторінку входу

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)