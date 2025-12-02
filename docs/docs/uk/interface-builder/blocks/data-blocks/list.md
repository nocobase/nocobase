---
pkg: "@nocobase/plugin-block-list"
---
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::

# Блок-список

## Вступ

Блок-список відображає дані у вигляді списку. Він ідеально підходить для таких сценаріїв відображення даних, як списки завдань, новинні стрічки та інформація про продукти.

## Налаштування блоку

![20251023202835](https://static-docs.nocobase.com/20251023202835.png)

### Налаштування діапазону даних

Як показано на зображенні: відфільтруйте замовлення зі статусом «Скасовано».

![20251023202927](https://static-docs.nocobase.com/20251023202927.png)

Докладніше дивіться у розділі [Налаштування діапазону даних](/interface-builder/blocks/block-settings/data-scope)

### Налаштування правил сортування

Як показано на зображенні: відсортуйте за сумою замовлення у зворотному порядку.

![20251023203022](https://static-docs.nocobase.com/20251023203022.png)

Докладніше дивіться у розділі [Налаштування правил сортування](/interface-builder/blocks/block-settings/sorting-rule)

## Налаштування полів

### Поля з цієї колекції

> **Примітка**: Поля з успадкованих колекцій (тобто поля батьківських колекцій) автоматично об'єднуються та відображаються у поточному списку полів.

![20251023203103](https://static-docs.nocobase.com/20251023203103.png)

### Поля з пов'язаних колекцій

> **Примітка**: Поля з пов'язаних колекцій можуть відображатися (наразі підтримуються лише зв'язки «один до одного»).

![20251023203611](https://static-docs.nocobase.com/20251023203611.png)

Щодо налаштування полів списку, дивіться [Поле деталізації](/interface-builder/fields/generic/detail-form-item)

## Налаштування дій

### Глобальні дії

![20251023203918](https://static-docs.nocobase.com/20251023203918.png)

- [Фільтрувати](/interface-builder/actions/types/filter)
- [Додати](/interface-builder/actions/types/add-new)
- [Видалити](/interface-builder/actions/types/delete)
- [Оновити](/interface-builder/actions/types/refresh)
- [Імпортувати](/interface-builder/actions/types/import)
- [Експортувати](/interface-builder/actions/types/export)
- [Друк за шаблоном](/template-print/index)
- [Масове оновлення](/interface-builder/actions/types/bulk-update)
- [Експортувати вкладення](/interface-builder/actions/types/export-attachments)
- [Запустити робочий процес](/interface-builder/actions/types/trigger-workflow)
- [JS Дія](/interface-builder/actions/types/js-action)
- [AI Співробітник](/interface-builder/actions/types/ai-employee)

### Дії для рядка

![20251023204329](https://static-docs.nocobase.com/20251023204329.png)

- [Редагувати](/interface-builder/actions/types/edit)
- [Видалити](/interface-builder/actions/types/delete)
- [Посилання](/interface-builder/actions/types/link)
- [Спливаюче вікно](/interface-builder/actions/types/pop-up)
- [Оновити запис](/interface-builder/actions/types/update-record)
- [Друк за шаблоном](/template-print/index)
- [Запустити робочий процес](/interface-builder/actions/types/trigger-workflow)
- [JS Дія](/interface-builder/actions/types/js-action)
- [AI Співробітник](/interface-builder/actions/types/ai-employee)