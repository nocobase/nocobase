---
pkg: '@nocobase/plugin-auth-dingtalk'
---

# Аутентификация: DingTalk (Аuth: Dingtalk)

## Введение 

Плагин Аутентификация: DingTalk позволяет пользователям входить в NocoBase, используя учетные записи DingTalk.

## Включить плагин

![](https://static-docs.nocobase.com/202406120929356.png)

## Подать заявку на получение права доступа API в консоли разработчика DingTalk.

См. <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalk Open Platform - Implement Login to Third-Party Websites</a>, чтобы создать приложение.

Перейдите в консоль управления приложением и включите разрешения «Сведения о личном номере телефона» и «Чтение персональных данных адресной книги».

![](https://static-docs.nocobase.com/202406120006620.png)

## Получить учетные данные из консоли разработчика DingTalk

Скопируйте Client ID и Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Добавить аутентификацию DingTalk в NocoBase

Перейдите на страницу управления плагинами аутентификации пользователей.

![](https://static-docs.nocobase.com/202406112348051.png)

Добавить — DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Конфигурация

![](https://static-docs.nocobase.com/202406120016896.png)

- Автоматически регистрировать пользователя, если его нет — будет ли автоматически создаваться новый пользователь, если по номеру телефона не находится существующий пользователь.
- Client ID и Client Secret — заполните информацию, скопированную на предыдущем шаге.
- Redirect URL — URL обратного вызова (callback URL), скопируйте его и перейдите к следующему шагу.

## Настройте Callback URL в консоли разработчика DingTalk

Вставьте скопированный callback URL в консоли разработчика DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## Вход

Перейдите на страницу входа и нажмите кнопку ниже формы входа, чтобы начать вход через сторонний сервис.

![](https://static-docs.nocobase.com/202406120014539.png)