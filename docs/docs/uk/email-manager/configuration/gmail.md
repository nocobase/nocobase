---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::

# Налаштування Google

### Передумови

Щоб користувачі могли підключати свої облікові записи Google Mail до NocoBase, систему необхідно розгорнути на сервері, який має доступ до сервісів Google, оскільки бекенд буде викликати Google API.
    
### Реєстрація облікового запису

1. Відкрийте https://console.cloud.google.com/welcome, щоб перейти до Google Cloud.
2. Під час першого входу вам потрібно буде погодитися з умовами використання.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Створення застосунку

1. Натисніть "Select a project" у верхній частині сторінки.
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Натисніть кнопку "NEW PROJECT" у спливаючому вікні.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Заповніть інформацію про проєкт.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Після створення проєкту виберіть його.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Увімкнення Gmail API

1. Натисніть кнопку "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Перейдіть до панелі керування "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Знайдіть "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Натисніть кнопку "ENABLE", щоб увімкнути Gmail API.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Налаштування екрана згоди OAuth

1. Натисніть меню "OAuth consent screen" ліворуч.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Виберіть "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Заповніть інформацію про проєкт (вона відображатиметься на сторінці авторизації) і натисніть "Зберегти".

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Заповніть контактну інформацію розробника та натисніть "Продовжити".

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Натисніть "Продовжити".

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Додайте тестових користувачів для перевірки перед публікацією застосунку.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Натисніть "Продовжити".

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Перегляньте зведену інформацію та поверніться до панелі керування.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Створення облікових даних

1. Натисніть меню "Credentials" ліворуч.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Натисніть кнопку "CREATE CREDENTIALS" і виберіть "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Виберіть "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Заповніть інформацію про застосунок.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Введіть домен кінцевого розгортання проєкту (приклад тут — тестова адреса NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Додайте авторизований URI переспрямування. Він має бути у форматі `домен + "/admin/settings/mail/oauth2"`. Приклад: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Натисніть "Створити", щоб переглянути інформацію OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Скопіюйте Client ID та Client secret і вставте їх на сторінку налаштувань пошти.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Натисніть "Зберегти", щоб завершити налаштування.

### Публікація застосунку

Після завершення описаного вище процесу та тестування таких функцій, як авторизація тестових користувачів і надсилання електронних листів, ви можете опублікувати застосунок.

1. Натисніть меню "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Натисніть кнопку "EDIT APP", а потім кнопку "SAVE AND CONTINUE" внизу.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Натисніть кнопку "ADD OR REMOVE SCOPES", щоб вибрати обсяги дозволів користувачів.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Введіть "Gmail API" для пошуку, а потім встановіть прапорець "Gmail API" (переконайтеся, що значення Scope відповідає Gmail API з "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Натисніть кнопку "UPDATE" внизу, щоб зберегти.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Натисніть кнопку "SAVE AND CONTINUE" внизу кожної сторінки, а потім натисніть кнопку "BACK TO DASHBOARD", щоб повернутися на сторінку панелі керування.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Натисніть кнопку "PUBLISH APP". З'явиться сторінка підтвердження публікації, де буде перераховано необхідну інформацію. Потім натисніть кнопку "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Повернувшись на сторінку консолі, ви побачите, що статус публікації — "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Натисніть кнопку "PREPARE FOR VERIFICATION", заповніть необхідну інформацію та натисніть кнопку "SAVE AND CONTINUE" (дані на зображенні наведено лише для прикладу).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Продовжуйте заповнювати необхідну інформацію (дані на зображенні наведено лише для прикладу).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Натисніть кнопку "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Натисніть кнопку "SUBMIT FOR VERIFICATION", щоб подати запит на перевірку.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Дочекайтеся результатів перевірки.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Якщо перевірка ще не завершена, користувачі можуть натиснути небезпечне посилання, щоб авторизуватися та увійти.

![](https://static-docs.nocobase.com/mail-1735633689645.png)