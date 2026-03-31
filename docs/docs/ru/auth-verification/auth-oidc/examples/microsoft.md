:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Добавление аутентификатора в NocoBase

Сначала добавьте новый аутентификатор в NocoBase: Настройки плагинов - Аутентификация пользователя - Добавить - OIDC.

Скопируйте URL-адрес обратного вызова.

![](https://static-docs.nocobase.com/202412021504114.png)

## Регистрация приложения

Откройте центр администрирования Microsoft Entra и зарегистрируйте новое приложение.

![](https://static-docs.nocobase.com/202412021506837.png)

Вставьте сюда URL-адрес обратного вызова, который вы только что скопировали.

![](https://static-docs.nocobase.com/202412021520696.png)

## Получение и ввод необходимой информации

Откройте только что зарегистрированное приложение и скопируйте **Application (client) ID** и **Directory (tenant) ID** со страницы обзора.

![](https://static-docs.nocobase.com/202412021522063.png)

Нажмите `Certificates & secrets`, создайте новый секрет клиента (client secret) и скопируйте **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

Соответствие между информацией Microsoft Entra и конфигурацией аутентификатора NocoBase выглядит следующим образом:

| Информация Microsoft Entra    | Поле аутентификатора NocoBase                                                                                                                            |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application (client) ID       | Client ID                                                                                                                                                |
| Client secrets - Value        | Client secret                                                                                                                                            |
| Directory (tenant) ID         | Issuer:<br />`https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration`, `{tenant}` необходимо заменить на соответствующий Directory (tenant) ID |