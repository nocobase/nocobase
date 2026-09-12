---
pkg: "@nocobase/plugin-email-manager"
---

# Настройка Microsoft

### Предварительные условия
Чтобы пользователи могли подключать почту Outlook к NocoBase, система должна быть развёрнута на сервере, который поддерживает доступ к сервисам Microsoft. Бэкенд будет вызывать Microsoft API.

### Регистрация аккаунта

1. Откройте https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account

2. Войдите в свой Microsoft-аккаунт.

![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Создание tenant


1. Откройте https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account?icid=azurefreeaccount и войдите в аккаунт.
2. Заполните базовую информацию и получите код подтверждения.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Заполните остальную информацию и продолжите.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Заполните данные банковской карты (можно сделать позже).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Получить Client ID

1. Нажмите верхнее меню и выберите **Microsoft Entra ID**.

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Слева выберите **App registrations**.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Сверху нажмите **New registration**.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Заполните информацию и отправьте.

Имя может быть любым. Выберите типы аккаунтов как на изображении, а Redirect URI пока можно оставить пустым.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Получите Client ID.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Разрешения API

1. Откройте меню **API permissions** справа.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Нажмите кнопку **Add a permission**.

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Нажмите **Microsoft Graph**.

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Найдите и добавьте следующие разрешения; итоговый результат показан на изображении ниже.

   1. `"email"`
   2. `"offline_access"`
   3. `"IMAP.AccessAsUser.All"`
   4. `"SMTP.Send"`
   5. `"offline_access"`
   6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Получить Client Secret

1. Слева нажмите **Certificates & secrets**.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Нажмите кнопку **New client secret**.

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Заполните описание и срок действия, затем добавьте.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Получите Client Secret.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Скопируйте значения Client ID и Client Secret и вставьте их на страницу настройки почты.

![](https://static-docs.nocobase.com/mail-1733818630710.png)