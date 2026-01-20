---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::


# Настройка Microsoft

### Предварительные условия
Чтобы пользователи могли подключить свои почтовые ящики Outlook к NocoBase, вам необходимо развернуть NocoBase на сервере, который имеет доступ к службам Microsoft. Бэкенд будет использовать API Microsoft.

### Регистрация аккаунта

1. Откройте https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Войдите в свою учетную запись Microsoft.
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Создание клиента (Tenant)

1. Перейдите по ссылке https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount и войдите в свою учетную запись.
    
2. Заполните основную информацию и получите код подтверждения.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Заполните остальную информацию и продолжите.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Введите данные своей кредитной карты (этот шаг можно пропустить).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Получение Client ID

1. В верхнем меню выберите "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Слева выберите "App registrations".

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Вверху нажмите "New registration".

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Заполните информацию и отправьте.

Имя может быть любым. Для типов учетных записей выберите вариант, показанный на изображении ниже. Поле Redirect URI пока можно оставить пустым.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Получите Client ID.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Авторизация API

1. Откройте меню "API permissions" слева.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Нажмите кнопку "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Нажмите "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Найдите и добавьте следующие разрешения. Конечный результат должен выглядеть как на изображении ниже.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Получение секрета (Secret)

1. Слева нажмите "Certificates & secrets".

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Нажмите кнопку "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Введите описание и срок действия, затем нажмите "Add".

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Получите Secret ID.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Скопируйте Client ID и Client secret и вставьте их на страницу настройки электронной почты.

![](https://static-docs.nocobase.com/mail-1733818630710.png)