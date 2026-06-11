# Обзор

Рабочий процесс обычно состоит из нескольких связанных операционных шагов. Каждый узел представляет один из таких шагов и служит базовой логической единицей процесса. Как и в языке программирования, разные типы узлов представляют разные инструкции, которые определяют поведение узла. Когда рабочий процесс запускается, система последовательно входит в каждый узел и выполняет его инструкции.

:::info{title=Примечание}
Триггер рабочего процесса не является узлом. Он лишь отображается как входная точка на диаграмме потока, но это отдельное понятие по отношению к узлу. Подробности см. в разделе [Триггеры](../triggers/index.md).
:::

С функциональной точки зрения реализованные на текущий момент узлы можно разделить на несколько крупных категорий (всего 28 типов узлов):

- Искусственный интеллект
  - [Языковая модель](../../ai-employees/workflow/nodes/llm/chat.md) (предоставляется плагином @nocobase/plugin-workflow-llm)
- Управление потоком
  - [Условие](./condition.md)
  - [Несколько условий](./multi-conditions.md)
  - [Цикл](./loop.md) (предоставляется плагином @nocobase/plugin-workflow-loop)
  - [Переменная](./variable.md) (предоставляется плагином @nocobase/plugin-workflow-variable)
  - [Параллельная ветвь](./parallel.md) (предоставляется плагином @nocobase/plugin-workflow-parallel)
  - [Вызвать рабочий процесс](./subflow.md) (предоставляется плагином @nocobase/plugin-workflow-subflow)
  - [Вывод](./output.md) (предоставляется плагином @nocobase/plugin-workflow-subflow)
  - [Сопоставление переменных JSON](./json-variable-mapping.md) (предоставляется плагином @nocobase/plugin-workflow-json-variable-mapping)
  - [Задержка](./delay.md) (предоставляется плагином @nocobase/plugin-workflow-delay)
  - [Завершить рабочий процесс](./end.md)
- Вычисления
  - [Вычисление](./calculation.md)
  - [Расчет даты](./date-calculation.md) (предоставляется плагином @nocobase/plugin-workflow-date-calculation)
  - [Вычисление JSON](./json-query.md) (предоставляется плагином @nocobase/plugin-workflow-json-query)
- Действия с коллекциями
  - [Создать запись](./create.md)
  - [Обновить запись](./update.md)
  - [Удалить запись](./destroy.md)
  - [Выбрать записи](./query.md)
  - [Агрегирующий запрос](./aggregate.md) (предоставляется плагином @nocobase/plugin-workflow-aggregate)
  - [Действие SQL](./sql.md) (предоставляется плагином @nocobase/plugin-workflow-sql)
- Ручная обработка
  - [Ручная обработка](./manual.md) (предоставляется плагином @nocobase/plugin-workflow-manual)
  - [Согласование](./approval.md) (предоставляется плагином @nocobase/plugin-workflow-approval)
  - [Копия](./cc.md) (предоставляется плагином @nocobase/plugin-workflow-cc)
- Другие расширения
  - [HTTP запрос](./request.md) (предоставляется плагином @nocobase/plugin-workflow-request)
  - [JavaScript](./javascript.md) (предоставляется плагином @nocobase/plugin-workflow-javascript)
  - [Отправить электронную почту](./mailer.md) (предоставляется плагином @nocobase/plugin-workflow-mailer)
  - [Уведомление](../../notification-manager/index.md#工作流通知节点) (предоставляется плагином @nocobase/plugin-workflow-notification)
  - [Ответ](./response.md) (предоставляется плагином @nocobase/plugin-workflow-webhook)
  - [Ответное сообщение](./response-message.md) (предоставляется плагином @nocobase/plugin-workflow-response-message)