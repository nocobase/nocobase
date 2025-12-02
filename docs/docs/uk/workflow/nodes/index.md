:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Огляд

Робочий процес зазвичай складається з кількох пов'язаних операційних кроків. Кожен вузол представляє один із цих кроків і є базовою логічною одиницею в процесі. Як і в мові програмування, різні типи вузлів представляють різні інструкції, які визначають їхню поведінку. Коли робочий процес запускається, система послідовно входить у кожен вузол і виконує його інструкції.

:::info{title=Примітка}
Тригер робочого процесу не є вузлом. Він відображається лише як точка входу на схемі процесу, але це інша концепція, ніж вузол. Детальніше дивіться в розділі [Тригери](../triggers/index.md).
:::

З функціональної точки зору, реалізовані наразі вузли можна розділити на кілька основних категорій (всього 29 типів вузлів):

- Штучний інтелект
  - [Велика мовна модель](../../ai-employees/workflow/nodes/llm/chat.md) (надається плагіном @nocobase/plugin-workflow-llm)
- Керування потоком
  - [Умова](./condition.md)
  - [Багатоумовне розгалуження](./multi-conditions.md)
  - [Цикл](./loop.md) (надається плагіном @nocobase/plugin-workflow-loop)
  - [Змінна](./variable.md) (надається плагіном @nocobase/plugin-workflow-variable)
  - [Паралельне розгалуження](./parallel.md) (надається плагіном @nocobase/plugin-workflow-parallel)
  - [Виклик робочого процесу](./subflow.md) (надається плагіном @nocobase/plugin-workflow-subflow)
  - [Вивід робочого процесу](./output.md) (надається плагіном @nocobase/plugin-workflow-subflow)
  - [Мапування JSON змінних](./json-variable-mapping.md) (надається плагіном @nocobase/plugin-workflow-json-variable-mapping)
  - [Затримка](./delay.md) (надається плагіном @nocobase/plugin-workflow-delay)
  - [Завершити робочий процес](./end.md)
- Обчислення
  - [Обчислення](./calculation.md)
  - [Обчислення дати](./date-calculation.md) (надається плагіном @nocobase/plugin-workflow-date-calculation)
  - [JSON обчислення](./json-query.md) (надається плагіном @nocobase/plugin-workflow-json-query)
- Дії з колекціями
  - [Створити дані](./create.md)
  - [Оновити дані](./update.md)
  - [Видалити дані](./destroy.md)
  - [Запит даних](./query.md)
  - [Агрегований запит](./aggregate.md) (надається плагіном @nocobase/plugin-workflow-aggregate)
  - [SQL дія](./sql.md) (надається плагіном @nocobase/plugin-workflow-sql)
- Ручна обробка
  - [Ручна обробка](./manual.md) (надається плагіном @nocobase/plugin-workflow-manual)
  - [Схвалення](./approval.md) (надається плагіном @nocobase/plugin-workflow-approval)
  - [Копія (CC)](./cc.md) (надається плагіном @nocobase/plugin-workflow-cc)
- Інші розширення
  - [HTTP запит](./request.md) (надається плагіном @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (надається плагіном @nocobase/plugin-workflow-javascript)
  - [Надсилання електронної пошти](./mailer.md) (надається плагіном @nocobase/plugin-workflow-mailer)
  - [Сповіщення](../../notification-manager/index.md#工作流通知节点) (надається плагіном @nocobase/plugin-workflow-notification)
  - [Відповідь](./response.md) (надається плагіном @nocobase/plugin-workflow-webhook)
  - [Повідомлення-відповідь](./response-message.md) (надається плагіном @nocobase/plugin-workflow-response-message)