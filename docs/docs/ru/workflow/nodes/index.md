:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Обзор

Рабочий процесс обычно состоит из нескольких связанных операционных шагов. Каждый узел представляет собой такой шаг и является базовой логической единицей в процессе. Как и в языке программирования, разные типы узлов представляют разные инструкции, которые определяют поведение узла. Когда рабочий процесс запускается, система последовательно входит в каждый узел и выполняет его инструкции.

:::info{title=Примечание}
Триггер рабочего процесса не является узлом. Он отображается в схеме процесса только как точка входа, но это другое понятие по сравнению с узлом. Подробности см. в разделе [Триггеры](../triggers/index.md).
:::

С функциональной точки зрения, реализованные на данный момент узлы можно разделить на несколько основных категорий (всего 29 типов узлов):

- Искусственный интеллект
  - [Большая языковая модель](../../ai-employees/workflow/nodes/llm/chat.md) (предоставляется плагином @nocobase/plugin-workflow-llm)
- Управление потоком
  - [Условие](./condition.md)
  - [Множественные условия](./multi-conditions.md)
  - [Цикл](./loop.md) (предоставляется плагином @nocobase/plugin-workflow-loop)
  - [Переменная](./variable.md) (предоставляется плагином @nocobase/plugin-workflow-variable)
  - [Параллельная ветвь](./parallel.md) (предоставляется плагином @nocobase/plugin-workflow-parallel)
  - [Вызов рабочего процесса](./subflow.md) (предоставляется плагином @nocobase/plugin-workflow-subflow)
  - [Вывод рабочего процесса](./output.md) (предоставляется плагином @nocobase/plugin-workflow-subflow)
  - [Сопоставление JSON-переменных](./json-variable-mapping.md) (предоставляется плагином @nocobase/plugin-workflow-json-variable-mapping)
  - [Задержка](./delay.md) (предоставляется плагином @nocobase/plugin-workflow-delay)
  - [Завершение процесса](./end.md)
- Вычисления
  - [Вычисление](./calculation.md)
  - [Вычисление даты](./date-calculation.md) (предоставляется плагином @nocobase/plugin-workflow-date-calculation)
  - [JSON-вычисление](./json-query.md) (предоставляется плагином @nocobase/plugin-workflow-json-query)
- Действия с коллекциями
  - [Создание данных](./create.md)
  - [Обновление данных](./update.md)
  - [Удаление данных](./destroy.md)
  - [Запрос данных](./query.md)
  - [Агрегированный запрос](./aggregate.md) (предоставляется плагином @nocobase/plugin-workflow-aggregate)
  - [SQL-операция](./sql.md) (предоставляется плагином @nocobase/plugin-workflow-sql)
- Ручная обработка
  - [Ручная обработка](./manual.md) (предоставляется плагином @nocobase/plugin-workflow-manual)
  - [Утверждение](./approval.md) (предоставляется плагином @nocobase/plugin-workflow-approval)
  - [Копия (CC)](./cc.md) (предоставляется плагином @nocobase/plugin-workflow-cc)
- Другие расширения
  - [HTTP-запрос](./request.md) (предоставляется плагином @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (предоставляется плагином @nocobase/plugin-workflow-javascript)
  - [Отправка электронной почты](./mailer.md) (предоставляется плагином @nocobase/plugin-workflow-mailer)
  - [Уведомление](../../notification-manager/index.md#рабочий-процесс-уведомления) (предоставляется плагином @nocobase/plugin-workflow-notification)
  - [Ответ](./response.md) (предоставляется плагином @nocobase/plugin-workflow-webhook)
  - [Сообщение ответа](./response-message.md) (предоставляется плагином @nocobase/plugin-workflow-response-message)