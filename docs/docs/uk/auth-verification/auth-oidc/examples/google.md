:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Вхід за допомогою Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Як отримати облікові дані Google OAuth 2.0

Перейдіть до [Консолі Google Cloud](https://console.cloud.google.com/apis/credentials), потім виберіть "Створити облікові дані" (Create Credentials) і "Ідентифікатор клієнта OAuth" (OAuth Client ID).

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Перейдіть до інтерфейсу налаштувань та введіть авторизовану URL-адресу переспрямування (redirect URL). Цю URL-адресу можна отримати під час додавання автентифікатора в NocoBase. Зазвичай вона має вигляд `http(s)://host:port/api/oidc:redirect`. Докладніше дивіться у розділі [Посібник користувача - Налаштування](../index.md#configuration).

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## Додавання нового автентифікатора в NocoBase

Налаштування плагіна - Автентифікація користувачів - Додати - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Щоб завершити налаштування автентифікатора, зверніться до параметрів, описаних у розділі [Посібник користувача - Налаштування](../index.md#configuration).