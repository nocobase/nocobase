# Использование ключей API в NocoBase

Это руководство показывает, как использовать ключи API в NocoBase для получения данных на практическом примере «Задачи». Следуйте пошаговой инструкции ниже, чтобы понять полный рабочий процесс.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Понимание ключей API

Ключ API — это защищённый токен, который аутентифицирует API-запросы от авторизованных пользователей. Он работает как учётные данные, подтверждающие личность отправителя при доступе к системе NocoBase из веб-приложений, мобильных приложений или серверных скриптов.

В заголовках HTTP-запроса вы увидите формат вида:

```txt
Authorization: Bearer {API key}
```

Префикс "Bearer" означает, что следующая строка — это аутентифицированный ключ API, используемый для проверки прав запрашивающей стороны.

### Типовые сценарии использования

Ключи API обычно применяются в следующих сценариях:

1. **Доступ для клиентских приложений**: веб-браузеры и мобильные приложения используют ключи API для аутентификации пользователя, чтобы гарантировать, что только авторизованные пользователи могут получать доступ к данным.
2. **Выполнение автоматизированных задач**: фоновые процессы и планировщики используют ключи API, чтобы безопасно выполнять обновления, синхронизацию данных и операции логирования.
3. **Разработка и тестирование**: разработчики используют ключи API при отладке и тестировании, чтобы имитировать аутентифицированные запросы и проверять ответы API.

Ключи API дают ряд преимуществ безопасности: проверка личности, мониторинг использования, ограничение скорости запросов и предотвращение угроз, обеспечивая стабильную и безопасную работу NocoBase.

## 2 Создание ключей API в NocoBase

### 2.1 Активировать плагин Аутентификация: ключи API

Убедитесь, что встроенный плагин [Аутентификация: ключи API](/plugins/@nocobase/plugin-api-keys/) активирован. После включения в настройках системы появится новая страница конфигурации ключей API.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Создать тестовую коллекцию

Для демонстрации создайте коллекцию с именем `todos` со следующими полями:

- `id`
- `title`
- `completed`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Добавьте в коллекцию несколько примерных записей:

- поесть
- поспать
- поиграть

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Создать и назначить роль

Ключи API привязаны к ролям пользователей, и система определяет права запроса на основе назначенной роли. Перед созданием ключа API необходимо создать роль и настроить соответствующие разрешения. Создайте роль с названием "API роль для задач" и выдайте ей полный доступ к коллекции `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Если при создании ключа API роль "API роль для задач" недоступна, убедитесь, что текущему пользователю назначена эта роль:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

После назначения роли обновите страницу и перейдите на страницу управления ключами API. Нажмите "Добавить ключ API", чтобы убедиться, что "API роль для задач" появляется в выборе роли.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Для более строгого контроля доступа рассмотрите создание отдельного пользователя (например, "API пользователь задач") специально для управления и тестирования ключей API. Назначьте этому пользователю роль "API роль для задач".
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Сгенерировать и сохранить ключ API

После отправки формы система покажет сообщение с только что сгенерированным ключом API. **Важно**: сразу скопируйте и безопасно сохраните этот ключ, поскольку по соображениям безопасности он больше не будет отображаться.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Пример ключа API:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Важные примечания

- Срок действия ключа API определяется настройкой истечения, заданной при создании.
- Генерация и проверка ключей API зависят от переменной окружения `APP_KEY`. **Не изменяйте эту переменную**, иначе все существующие ключи API в системе станут недействительными.

## 3 Тестирование аутентификации по ключу API

### 3.1 Использование плагина документации API

Откройте плагин [Документация API](/plugins/@nocobase/plugin-api-doc/), чтобы посмотреть методы запросов, URL, параметры и заголовки для каждого API-эндпоинта.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Понимание базовых CRUD-операций

NocoBase предоставляет стандартные CRUD (Create, Read, Update, Delete) API для манипуляций с данными:

- **Запрос списк:**

  ```txt
  GET {baseURL}/{collectionName}:list
  Request Header:
  - Authorization: Bearer <API key>

  ```
- **Создание записи:**

  ```txt
  POST {baseURL}/{collectionName}:create

  Request Header:
  - Authorization: Bearer <API key>

  Request Body (in JSON format), for example:
      {
          "title": "123"
      }
  ```
- **Обновление записи:**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Request Header:
  - Authorization: Bearer <API key>

  Request Body (in JSON format), for example:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Удаление записи:**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Request Header:
  - Authorization: Bearer <API key>
  ```

Где:
- `{baseURL}`: URL вашей системы NocoBase
- `{collectionName}`: имя коллекции

Пример: для локального экземпляра на `localhost:13000` и коллекции `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Тестирование в Postman

Создайте GET-запрос в Postman со следующей конфигурацией:
- **URL**: эндпоинт запроса (например, `http://localhost:13000/api/todos:list`)
- **Headers**: добавьте заголовок `Authorization` со значением:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Успешный ответ:**

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

**Ответ с ошибкой**

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

**Устранение неполадок**: если аутентификация не проходит, проверьте права роли, привязку ключа API и формат токена.

### 3.4 Экспорт кода запроса

Postman позволяет экспортировать запрос в различных форматах. Пример команды cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Использование ключей API в JS-блоке

NocoBase 2.0 поддерживает написание нативного JavaScript-кода прямо на страницах с использованием JS-блоков. В этом примере показано, как получать данные через API с использованием ключей API.

### Создание JS-блока

На странице NocoBase добавьте JS-блок и используйте следующий код, чтобы получить данные списка задач:

```javascript
// Получить данные списка задач с использованием API Key
async function fetchTodos() {
  try {
    // Показать сообщение о загрузке
    ctx.message.loading('Fetching data...');

    // Загрузить библиотеку axios для HTTP-запросов
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Failed to load HTTP library');
      return;
    }

    // API Key (замените на ваш фактический API key)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Выполнить API-запрос
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Показать результаты
    console.log('To-Do List:', response.data);
    ctx.message.success(`Successfully fetched ${response.data.data.length} items`);

    // Здесь можно обработать данные
    // Например: показать в таблице, обновить поля формы и т. п.

  } catch (error) {
    console.error('Error fetching data:', error);
    ctx.message.error('Failed to fetch data: ' + error.message);
  }
}

// Выполнить функцию
fetchTodos();
```

### Ключевые моменты

- **ctx.requireAsync()**: динамически загружает внешние библиотеки (например, axios) для HTTP-запросов
- **ctx.message**: показывает уведомления пользователю (сообщения loading/success/error)
- **API Key Authentication**: передавайте ключ API в заголовке `Authorization` с префиксом `Bearer`
- **Response Handling**: обрабатывайте возвращённые данные по необходимости (показ, преобразование и т. п.)

## 5 Итог

В этом руководстве был разобран полный рабочий процесс использования ключей API в NocoBase:

1. **Настройка**: активация плагина ключей API и создание тестовой коллекции
2. **Конфигурация**: создание ролей с нужными правами и генерация ключей API
3. **Тестирование**: проверка аутентификации ключом API в Postman и через плагин документации API
4. **Интеграция**: использование ключей API в JS-блоках

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Дополнительные ресурсы:**
- [Документация плагина ключей API](/plugins/@nocobase/plugin-api-keys/)
- [Документация плагина документации API](/plugins/@nocobase/plugin-api-doc/)