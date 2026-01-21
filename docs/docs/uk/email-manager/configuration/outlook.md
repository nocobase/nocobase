---
pkg: "@nocobase/plugin-email-manager"
---

:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::



# Налаштування Microsoft

### Передумови
Щоб користувачі могли підключати свої поштові скриньки Outlook до NocoBase, систему потрібно розгорнути на сервері, який має доступ до служб Microsoft. Бекенд буде викликати API Microsoft.

### Реєстрація облікового запису

1. Перейдіть за посиланням https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Увійдіть у свій обліковий запис Microsoft
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Створення клієнта (Tenant)

1. Перейдіть за посиланням https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount та увійдіть у свій обліковий запис.
    
2. Заповніть основну інформацію та отримайте код підтвердження.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Заповніть іншу інформацію та продовжте.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Заповніть інформацію про кредитну картку (наразі це можна пропустити).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Отримання Client ID

1. Натисніть верхнє меню та оберіть "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Оберіть "App registrations" (Реєстрації застосунків) ліворуч.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Натисніть "New registration" (Нова реєстрація) угорі.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Заповніть інформацію та надішліть.

Назва може бути довільною. Для типів облікових записів оберіть варіант, показаний на зображенні нижче. Поле Redirect URI (URI переспрямування) наразі можна залишити порожнім.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Отримайте Client ID.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Авторизація API

1. Відкрийте меню "API permissions" (Дозволи API) ліворуч.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Натисніть кнопку "Add a permission" (Додати дозвіл).

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Натисніть "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Знайдіть та додайте наступні дозволи. Кінцевий результат має виглядати, як на зображенні нижче.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (За замовчуванням)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Отримання секрету

1. Натисніть "Certificates & secrets" (Сертифікати та секрети) ліворуч.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Натисніть кнопку "New client secret" (Новий секрет клієнта).

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Заповніть опис та термін дії, а потім натисніть "Додати".

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Отримайте Secret ID.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Скопіюйте Client ID та Client secret і вставте їх на сторінку налаштувань електронної пошти.

![](https://static-docs.nocobase.com/mail-1733818630710.png)