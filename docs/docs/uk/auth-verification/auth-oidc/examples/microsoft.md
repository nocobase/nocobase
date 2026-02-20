:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Додавання автентифікатора в NocoBase

Спершу додайте новий автентифікатор у NocoBase: Налаштування плагінів - Автентифікація користувачів - Додати - OIDC.

Скопіюйте URL-адресу зворотного виклику.

![](https://static-docs.nocobase.com/202412021504114.png)

## Реєстрація застосунку

Відкрийте Центр адміністрування Microsoft Entra та зареєструйте новий застосунок.

![](https://static-docs.nocobase.com/202412021506837.png)

Сюди вставте щойно скопійовану URL-адресу зворотного виклику.

![](https://static-docs.nocobase.com/202412021520696.png)

## Отримання та заповнення необхідної інформації

Натисніть, щоб перейти до щойно зареєстрованого застосунку, та на сторінці огляду скопіюйте **Application (client) ID** та **Directory (tenant) ID**.

![](https://static-docs.nocobase.com/202412021522063.png)

Натисніть `Certificates & secrets`, створіть новий секрет клієнта (Client secret) та скопіюйте **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

Відповідність між інформацією Microsoft Entra та конфігурацією автентифікатора NocoBase така:

| Інформація Microsoft Entra    | Поле автентифікатора NocoBase                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID | Client ID                                                                                                                                        |
| Client secrets - Value  | Client secret                                                                                                                                    |
| Directory (tenant) ID   | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, `{tenant}` потрібно замінити на відповідний Directory (tenant) ID |