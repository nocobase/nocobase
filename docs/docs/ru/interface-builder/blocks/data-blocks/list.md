---
pkg: "@nocobase/plugin-block-list"
---
# Блок списка

## Введение

Блок списка отображает данные в формате списка и подходит для сценариев вроде списка задач, новостей и информации о товарах.

## Конфигурация блока

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Установить область данных

Как показано: фильтрация заказов со статусом "Отменен".

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Для подробностей см. [Установить область данных](/interface-builder/blocks/block-settings/data-scope)

### Установить правила сортировки

Как показано: сортировка по сумме заказа в порядке убывания.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Для подробностей см. [Установить правила сортировки](/interface-builder/blocks/block-settings/sorting-rule)

## Настроить поля

### Поля из этой коллекции

> **Примечание**: Поля из наследуемых коллекций (то есть родительских коллекций) автоматически объединяются и отображаются в текущем списке полей.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Поля из связанных коллекций

> **Примечание**: можно отображать поля из связанных коллекций (сейчас поддерживаются только связи to-one).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Для конфигурации полей списка см. [Поля деталей](/interface-builder/fields/generic/detail-form-item)

## Настроить действия

### Глобальные действия

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [Фильтр](/interface-builder/actions/types/filter)
- [Добавить](/interface-builder/actions/types/add-new)
- [Удалить](/interface-builder/actions/types/delete)
- [Обновить](/interface-builder/actions/types/refresh)
- [Импорт](/interface-builder/actions/types/import)
- [Экспорт](/interface-builder/actions/types/export)
- [Печать шаблона](/template-print/index)
- [Массовое обновление](/interface-builder/actions/types/bulk-update)
- [Экспорт вложений](/interface-builder/actions/types/export-attachments)
- [Запуск рабочего процесса](/interface-builder/actions/types/trigger-workflow)
- [Действие JS](/interface-builder/actions/types/js-action)
- [ИИ-сотрудник](/interface-builder/actions/types/ai-employee)

### Действия строки

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [Редактировать](/interface-builder/actions/types/edit)
- [Удалить](/interface-builder/actions/types/delete)
- [Ссылка](/interface-builder/actions/types/link)
- [Открыть модальное окно](/interface-builder/actions/types/pop-up)
- [Обновить запись](/interface-builder/actions/types/update-record)
- [Печать шаблона](/template-print/index)
- [Запуск рабочего процесса](/interface-builder/actions/types/trigger-workflow)
- [Действие JS](/interface-builder/actions/types/js-action)
- [ИИ-сотрудник](/interface-builder/actions/types/ai-employee)