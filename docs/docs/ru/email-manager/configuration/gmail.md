---
pkg: "@nocobase/plugin-email-manager"
---

# Настройка Google

### Предварительные условия

Чтобы пользователи могли подключать Google Gmail к NocoBase, система должна быть развёрнута на сервере, который поддерживает доступ к сервисам Google. Бэкенд будет вызывать Google API.

### Регистрация аккаунта

1. Откройте https://console.cloud.google.com/welcome, чтобы войти в Google Cloud.
2. При первом входе нужно согласиться с соответствующими условиями.

![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Создание приложения

1. Нажмите "Select a project" сверху.

![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Во всплывающем слое нажмите кнопку "NEW PROJECT".

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Заполните информацию о проекте.

![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. После создания проекта выберите этот проект.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Включить Gmail API

1. Нажмите кнопку "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Перейдите в панель APIs & Services.

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Найдите **mail**.

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Нажмите кнопку **ENABLE**, чтобы включить Gmail API.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Настроить экран согласия OAuth

1. Слева нажмите меню "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Выберите **External**.

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Заполните информацию о проекте (она будет отображаться на последующей странице авторизации) и нажмите save.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Заполните Developer contact information и нажмите continue.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Нажмите continue.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Добавьте тестовых пользователей для тестирования до публикации приложения.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Нажмите continue.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Проверьте сводную информацию и вернитесь в dashboard.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Создать учётные данные

1. Слева нажмите меню **Credentials**.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Нажмите кнопку "CREATE CREDENTIALS" и выберите "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Выберите "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Заполните информацию о приложении.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Укажите домен, на котором приложение будет развёрнуто (в этом примере — тестовый адрес NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Добавьте адрес авторизованного callback, он должен быть `domain + "/admin/settings/mail/oauth2"`, например: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Нажмите create, чтобы посмотреть OAuth-информацию.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Скопируйте значения Client ID и Client Secret и вставьте их на страницу настройки почты.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Нажмите save, чтобы завершить настройку.

### Публикация приложения

Приступайте к публикации после завершения описанного выше процесса и после того, как тестовые пользователи авторизуются и будет выполнено тестирование входа, отправки почты и других функций.

1. Нажмите меню "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Нажмите кнопку "EDIT APP", затем нажмите кнопку "SAVE AND CONTINUE" внизу.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Нажмите кнопку "ADD OR REMOVE SCOPES", чтобы выбрать области прав (permission scopes) пользователей.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Найдите "Gmail API" и отметьте "Gmail API" (убедитесь, что значение Scope равно "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Нажмите кнопку **UPDATE** внизу, чтобы сохранить.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. На каждой странице нажимайте кнопку "SAVE AND CONTINUE" внизу, а в конце нажмите "BACK TO DASHBOARD", чтобы вернуться на страницу dashboard.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Нажмите кнопку **PUBLISH APP** — появится страница подтверждения публикации с информацией, необходимой для публикации. Затем нажмите кнопку **CONFIRM**.

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Снова вернитесь в консоль — вы увидите, что статус публикации "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Нажмите кнопку "PREPARE FOR VERIFICATION", заполните требуемую информацию и нажмите кнопку "SAVE AND CONTINUE" (данные на изображении приведены только как пример).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Продолжайте заполнять необходимую информацию (данные на изображении приведены только как пример).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Нажмите кнопку "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Нажмите кнопку "SUBMIT FOR VERIFICATION", чтобы отправить Verification.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Дождитесь результата одобрения.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Если одобрение ещё не получено, пользователи могут нажать небезопасную ссылку, чтобы авторизоваться.

![](https://static-docs.nocobase.com/mail-1735633689645.png)