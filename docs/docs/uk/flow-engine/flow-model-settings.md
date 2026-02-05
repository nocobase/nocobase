:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# FlowModel: Потоки подій та конфігурація

FlowModel надає підхід, заснований на «потоках подій (Flow)», для реалізації логіки конфігурації компонентів, роблячи їхню поведінку та налаштування більш розширюваними та візуальними.

## Створення власної моделі

Ви можете створити власну модель компонента, успадкувавши клас `FlowModel`. Модель повинна реалізувати метод `render()`, щоб визначити логіку рендерингу компонента.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Реєстрація потоку (Flow)

Кожна модель може зареєструвати один або кілька **потоків (Flow)**, які описують логіку конфігурації та кроки взаємодії компонента.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Налаштування кнопки',
  steps: {
    general: {
      title: 'Загальні налаштування',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Заголовок кнопки',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

Опис

-   `key`: Унікальний ідентифікатор потоку (Flow).
-   `title`: Назва потоку (Flow), що використовується для відображення в інтерфейсі користувача.
-   `steps`: Визначає кроки конфігурації (Step). Кожен крок включає:
    -   `title`: Заголовок кроку.
    -   `uiSchema`: Структура форми конфігурації (сумісна з Formily Schema).
    -   `defaultParams`: Параметри за замовчуванням.
    -   `handler(ctx, params)`: Запускається при збереженні для оновлення стану моделі.

## Рендеринг моделі

Під час рендерингу моделі компонента ви можете використовувати параметр `showFlowSettings`, щоб керувати тим, чи вмикати функцію конфігурації. Якщо `showFlowSettings` увімкнено, у верхньому правому куті компонента автоматично з'явиться точка входу для конфігурації (наприклад, іконка налаштувань або кнопка).

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Відкриття форми конфігурації вручну за допомогою `openFlowSettings`

Окрім відкриття форми конфігурації через вбудовані інтерактивні елементи, ви також можете викликати `openFlowSettings()` вручну у своєму коді.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Визначення параметрів

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Обов'язково, екземпляр моделі, до якої належить
  preset?: boolean;               // Рендерить лише кроки, позначені як preset=true (за замовчуванням false)
  flowKey?: string;               // Вказати один потік (Flow)
  flowKeys?: string[];            // Вказати кілька потоків (Flow) (ігнорується, якщо також надано flowKey)
  stepKey?: string;               // Вказати один крок (зазвичай використовується разом з flowKey)
  uiMode?: 'dialog' | 'drawer';   // Контейнер для відображення форми, за замовчуванням 'dialog'
  onCancel?: () => void;          // Коллбек при натисканні "Скасувати"
  onSaved?: () => void;           // Коллбек після успішного збереження конфігурації
}
```

### Приклад: Відкриття форми конфігурації певного потоку (Flow) у режимі Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Налаштування кнопки збережено');
  },
});
```