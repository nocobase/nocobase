---
pkg: "@nocobase/plugin-block-list"
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Блок списка

## Введение

Блок списка отображает данные в виде списка, что удобно для таких сценариев, как списки задач, новостные ленты или информация о продуктах.

## Настройка блока

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Настройка области данных

На изображении показано: отфильтруйте заказы со статусом «Отменен».

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Более подробную информацию смотрите в разделе [Настройка области данных](/interface-builder/blocks/block-settings/data-scope).

### Настройка правил сортировки

На изображении показано: отсортируйте по сумме заказа в порядке убывания.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Более подробную информацию смотрите в разделе [Настройка правил сортировки](/interface-builder/blocks/block-settings/sorting-rule).

## Настройка полей

### Поля текущей коллекции

> **Обратите внимание**: Поля из унаследованных коллекций (то есть поля родительских коллекций) автоматически объединяются и отображаются в текущем списке полей.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Поля из связанных коллекций

> **Обратите внимание**: Поля из связанных коллекций могут быть отображены (в настоящее время поддерживаются только отношения «один к одному»).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Для настройки полей списка смотрите раздел [Поле «Детали»](/interface-builder/fields/generic/detail-form-item).

## Настройка действий

### Глобальные действия

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [Фильтр](/interface-builder/actions/types/filter)
- [Добавить](/interface-builder/actions/types/add-new)
- [Удалить](/interface-builder/actions/types/delete)
- [Обновить](/interface-builder/actions/types/refresh)
- [Импорт](/interface-builder/actions/types/import)
- [Экспорт](/interface-builder/actions/types/export)
- [Печать по шаблону](/template-print/index)
- [Массовое обновление](/interface-builder/actions/types/bulk-update)
- [Экспорт вложений](/interface-builder/actions/types/export-attachments)
- [Запустить рабочий процесс](/interface-builder/actions/types/trigger-workflow)
- [Действие JS](/interface-builder/actions/types/js-action)
- [AI-сотрудник](/interface-builder/actions/types/ai-employee)

### Действия со строками

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [Редактировать](/interface-builder/actions/types/edit)
- [Удалить](/interface-builder/actions/types/delete)
- [Ссылка](/interface-builder/actions/types/link)
- [Всплывающее окно](/interface-builder/actions/types/pop-up)
- [Обновить запись](/interface-builder/actions/types/update-record)
- [Печать по шаблону](/template-print/index)
- [Запустить рабочий процесс](/interface-builder/actions/types/trigger-workflow)
- [Действие JS](/interface-builder/actions/types/js-action)
- [AI-сотрудник](/interface-builder/actions/types/ai-employee)