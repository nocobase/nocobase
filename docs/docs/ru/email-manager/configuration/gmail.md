---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::


# Настройка Google

### Предварительные условия

Чтобы пользователи могли подключать свои аккаунты Google Почты к NocoBase, система должна быть развернута на сервере с доступом к сервисам Google, так как бэкенд будет вызывать Google API.

### Регистрация аккаунта

1. Откройте https://console.cloud.google.com/welcome, чтобы перейти в Google Cloud.
2. При первом входе вам потребуется принять условия использования.

![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Создание приложения

1. Нажмите "Select a project" (Выбрать проект) в верхней части страницы.

![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Нажмите кнопку "NEW PROJECT" (Новый проект) во всплывающем окне.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Заполните информацию о проекте.

![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. После создания проекта выберите его.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Включение Gmail API

1. Нажмите кнопку "APIs & Services" (API и сервисы).

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Перейдите на панель управления "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Введите "mail" в поиске.

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Нажмите кнопку "ENABLE" (Включить), чтобы активировать Gmail API.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Настройка экрана согласия OAuth

1. Нажмите на пункт меню "OAuth consent screen" (Экран согласия OAuth) слева.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Выберите "External" (Внешний).

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Заполните информацию о проекте (она будет отображаться на странице авторизации) и нажмите "Сохранить".

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Заполните контактную информацию разработчика (Developer contact information) и нажмите "Продолжить".

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Нажмите "Продолжить".

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Добавьте тестовых пользователей для проверки приложения перед его публикацией.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Нажмите "Продолжить".

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Просмотрите сводную информацию и вернитесь на панель управления.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Создание учетных данных

1. Нажмите на пункт меню "Credentials" (Учетные данные) слева.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Нажмите кнопку "CREATE CREDENTIALS" (Создать учетные данные) и выберите "OAuth client ID" (Идентификатор клиента OAuth).

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Выберите "Web application" (Веб-приложение).

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Заполните информацию о приложении.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Введите домен, на котором будет развернут проект (здесь в качестве примера используется тестовый адрес NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Добавьте авторизованный URI перенаправления. Он должен быть в формате `домен + "/admin/settings/mail/oauth2"`. Пример: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Нажмите "Создать", чтобы просмотреть информацию OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Скопируйте Client ID и Client secret и вставьте их на страницу настройки почты.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Нажмите "Сохранить", чтобы завершить настройку.

### Публикация приложения

После завершения описанных выше шагов и тестирования таких функций, как авторизация тестовых пользователей и отправка электронной почты, вы можете опубликовать приложение.

1. Нажмите на пункт меню "OAuth consent screen" (Экран согласия OAuth).

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Нажмите кнопку "EDIT APP" (Редактировать приложение), затем нажмите кнопку "SAVE AND CONTINUE" (Сохранить и продолжить) внизу.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Нажмите кнопку "ADD OR REMOVE SCOPES" (Добавить или удалить области), чтобы выбрать области разрешений пользователя.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Введите "Gmail API" для поиска, затем установите флажок "Gmail API" (убедитесь, что значение области действия (Scope) соответствует Gmail API с "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Нажмите кнопку "UPDATE" (Обновить) внизу, чтобы сохранить изменения.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Нажимайте кнопку "SAVE AND CONTINUE" (Сохранить и продолжить) внизу каждой страницы, а затем нажмите кнопку "BACK TO DASHBOARD" (Вернуться на панель управления), чтобы вернуться на страницу панели управления.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Нажмите кнопку "PUBLISH APP" (Опубликовать приложение). Появится страница подтверждения публикации, где будет перечислен необходимый контент для публикации. Затем нажмите кнопку "CONFIRM" (Подтвердить).

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Вернитесь на страницу консоли, и вы увидите, что статус публикации изменился на "In production" (В производстве).

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Нажмите кнопку "PREPARE FOR VERIFICATION" (Подготовиться к проверке), заполните необходимую информацию и нажмите кнопку "SAVE AND CONTINUE" (Сохранить и продолжить) (данные на изображении приведены только для примера).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Продолжайте заполнять необходимую информацию (данные на изображении приведены только для примера).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Нажмите кнопку "SAVE AND CONTINUE" (Сохранить и продолжить).

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Нажмите кнопку "SUBMIT FOR VERIFICATION" (Отправить на проверку), чтобы отправить запрос на проверку.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Дождитесь результатов проверки.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Если проверка еще не пройдена, пользователи могут нажать на небезопасную ссылку для авторизации и входа.

![](https://static-docs.nocobase.com/mail-1735633689645.png)