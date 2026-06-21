# Получение данных через API Keys

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114233060688108&bvid=BV1m8ZuY4E2V&cid=29092153179&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Дорогие друзья, добро пожаловать в этот tutorial.
В этом документе мы шаг за шагом покажем, как использовать API-ключи в NocoBase для получения данных, на примере «списка задач (Todo)».

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Что такое API-ключ

Прежде всего разберёмся с понятием. API-ключ — это что-то вроде входного билета: он подтверждает, что API-запрос приходит от легитимного пользователя. Когда Вы заходите в NocoBase через сайт, мобильное приложение или фоновый скрипт, этот «секретный ключ» помогает системе быстро удостоверить Вашу личность.

В заголовке HTTP-запроса формат выглядит так:

```txt
Authorization: Bearer {API-ключ}
```

«Bearer» означает, что далее идёт проверенный API-ключ, по которому быстро определяются права отправителя.

В реальности API-ключи нужны в нескольких сценариях:

1. **Доступ из клиентских приложений**: при вызове API из браузера или мобильного приложения система использует API-ключ для проверки личности и убеждается, что данные получают только авторизованные пользователи.
2. **Автоматические задачи**: фоновые регулярные задачи и скрипты используют API-ключ для подтверждения легитимности и безопасности запроса при обновлении данных или ведении логов.
3. **Разработка и тесты**: при отладке и тестировании разработчики через API-ключ имитируют реальные запросы и убеждаются, что интерфейс отдаёт корректные ответы.

Коротко: API-ключ помогает не только подтверждать личность отправителя, но и контролировать вызовы, ограничивать частоту запросов и предотвращать угрозы — это важная часть стабильной работы NocoBase.

## 2 Создание API-ключа в NocoBase

### 2.1 Включение plugin [API-ключей](https://docs-cn.nocobase.com/handbook/api-keys)

Сначала убедитесь, что встроенный plugin «Аутентификация: API-ключи» включён. После активации в системных настройках появится страница [API-ключей](https://docs-cn.nocobase.com/handbook/api-keys).

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Создание тестовой таблицы Todo

Заранее создадим таблицу `todos` со следующими полями:

- `id`
- `title` (заголовок)
- `completed` (выполнено)

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Введём в неё несколько произвольных задач, например:

- Поесть
- Поспать
- Поиграть в игры

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Создание и привязка роли

API-ключи привязаны к ролям пользователей: система определяет права запроса по роли. Поэтому перед созданием ключа нужно создать соответствующую роль и выдать ей права.
Рекомендуем создать тестовую роль «Todo API Role» и предоставить ей все права на таблицу todos.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Если при создании API-ключа в списке нет «Todo API Role», возможно, у текущего пользователя нет этой роли. Сначала назначьте её текущему пользователю:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

После этого обновите страницу, перейдите в управление API-ключами, нажмите «Добавить API-ключ» и убедитесь, что «Todo API Role» появилась.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Для более точного управления можно создать отдельного пользователя «Todo API User» — он будет логиниться, тестировать права, управлять API-ключами. Назначим ему только роль «Todo API Role».
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Создание и сохранение API-ключа

После нажатия «Отправить» система выведет сообщение об успешном создании ключа и покажет его во всплывающем окне. Обязательно скопируйте и сохраните ключ — из соображений безопасности система больше его не покажет.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Например, Вы получите такой ключ:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Важные замечания

- Срок действия API-ключа зависит от выбранного при создании.
- Логика генерации и проверки API-ключей тесно связана с переменной окружения `APP_KEY` — не меняйте её без необходимости, иначе все API-ключи в системе перестанут работать.

## 3 Проверка работы API-ключа

### 3.1 Использование plugin [Документация API](https://docs-cn.nocobase.com/handbook/api-doc)

Откройте plugin «Документация API», и Вы увидите для каждого API метод запроса, адрес, параметры и заголовки.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Знакомство с базовыми CRUD-эндпоинтами

Базовые API в NocoBase:

- **Список (list):**

  ```txt
  GET {baseURL}/{collectionName}:list
  Заголовки:
  - Authorization: Bearer <API-ключ>

  ```
- **Создание записи (create):**

  ```txt
  POST {baseURL}/{collectionName}:create

  Заголовки:
  - Authorization: Bearer <API-ключ>

  Тело (JSON), например:
      {
          "title": "123"
      }
  ```
- **Обновление записи (update):**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Заголовки:
  - Authorization: Bearer <API-ключ>

  Тело (JSON), например:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Удаление записи (destroy):**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Заголовки:
  - Authorization: Bearer <API-ключ>
  ```

Где `{baseURL}` — адрес Вашей системы NocoBase, `{collectionName}` — имя таблицы. Например, при локальном тесте адрес `localhost:13000`, таблица `todos`, итоговый адрес запроса:

```txt
http://localhost:13000/todos:list
```

### 3.3 Тест в Postman (на примере List)

Откройте Postman, создайте новый GET-запрос, введите адрес выше и в заголовках добавьте `Authorization` со значением Вашего API-ключа:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)
После отправки запроса при правильной настройке Вы получите примерно такой ответ:

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

Если API-ключ настроен неверно, Вы можете увидеть ошибку:

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

В этом случае проверьте права роли, привязку API-ключа и формат ключа.

### 3.4 Копирование кода запроса из Postman

После успешного теста можно скопировать код запроса для list. Например, такой curl был скопирован из Postman:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Отображение задач в [блоке iframe](https://docs-cn.nocobase.com/handbook/block-iframe)

Чтобы наглядно увидеть результат API-запроса, можно собрать простую HTML-страницу, которая отобразит список задач, полученных из NocoBase. Пример:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
</head>
<body>
    <h1>Todo List</h1>
    <pre id="result"></pre>

    <script>
        fetch('http://localhost:13000/api/todos:list', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    </script>
</body>
</html>
```

Этот код в блоке iframe покажет простой «Todo List»: при загрузке вызовется API, получится список задач и выведется в виде форматированного JSON.

Анимация ниже показывает динамику запроса:

![202503031918-fetch](https://static-docs.nocobase.com/202503031918-fetch.gif)

## 5 Итоги

С помощью описанных шагов мы подробно показали, как создать и использовать API-ключи в NocoBase. От активации plugin до создания таблицы, привязки роли, теста интерфейса и отображения данных в блоке iframe — все шаги важны. В заключение, с помощью DeepSeek мы реализовали простую страницу со списком задач. Вы можете доработать код под собственные нужды.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

[Код примера страницы](https://forum.nocobase.com/t/api-api-key/3314) уже выложен в сообществе — заходите, обсуждайте. Надеемся, что эта инструкция поможет Вам разобраться. Удачной работы!
