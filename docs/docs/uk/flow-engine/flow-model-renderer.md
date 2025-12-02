:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# Рендеринг FlowModel

`FlowModelRenderer` – це основний React-компонент для рендерингу `FlowModel`. Він відповідає за перетворення екземпляра `FlowModel` у візуальний React-компонент.

## Базове використання

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Базове використання
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Для рендерингу контрольованих моделей полів використовуйте `FieldModelRenderer`:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Рендеринг контрольованого поля
<FieldModelRenderer model={fieldModel} />
```

## Параметри Props

### FlowModelRendererProps

| Параметр | Тип | Значення за замовчуванням | Опис |
|------|------|--------|------|
| `model` | `FlowModel` | - | Екземпляр FlowModel для рендерингу |
| `uid` | `string` | - | Унікальний ідентифікатор моделі робочого процесу |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Резервний вміст, що відображається у разі помилки рендерингу |
| `showFlowSettings` | `boolean \| object` | `false` | Чи відображати вхід для налаштувань робочого процесу |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Стиль взаємодії для налаштувань робочого процесу |
| `hideRemoveInSettings` | `boolean` | `false` | Чи приховувати кнопку видалення в налаштуваннях |
| `showTitle` | `boolean` | `false` | Чи відображати заголовок моделі у верхньому лівому куті рамки |
| `skipApplyAutoFlows` | `boolean` | `false` | Чи пропускати автоматичне застосування робочих процесів |
| `inputArgs` | `Record<string, any>` | - | Додатковий контекст, що передається в `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Чи обгортати зовнішній шар компонентом `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | Рівень меню налаштувань: 1=лише поточна модель, 2=включно з дочірніми моделями |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Додаткові елементи панелі інструментів |

### Детальна конфігурація `showFlowSettings`

Коли `showFlowSettings` є об'єктом, підтримуються такі конфігурації:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Показувати фон
  showBorder: true,        // Показувати рамку
  showDragHandle: true,    // Показувати маркер перетягування
  style: {},              // Користувацький стиль панелі інструментів
  toolbarPosition: 'inside' // Позиція панелі інструментів: 'inside' | 'above' | 'below'
}}
```

## Життєвий цикл рендерингу

Весь цикл рендерингу послідовно викликає такі методи:

1.  **model.dispatchEvent('beforeRender')** - Подія `beforeRender`
2.  **model.render()** - Виконує метод рендерингу моделі
3.  **model.onMount()** - Хук монтування компонента
4.  **model.onUnmount()** - Хук розмонтування компонента

## Приклади використання

### Базовий рендеринг

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Завантаження...</div>}
    />
  );
}
```

### Рендеринг з налаштуваннями робочого процесу

```tsx pure
// Показати налаштування, але приховати кнопку видалення
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Показати налаштування та заголовок
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Використовувати режим контекстного меню
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Користувацька панель інструментів

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Користувацька дія',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Користувацька дія');
      }
    }
  ]}
/>
```

### Пропуск автоматичних робочих процесів

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Рендеринг моделі поля

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## Обробка помилок

`FlowModelRenderer` має вбудований комплексний механізм обробки помилок:

-   **Автоматичний межа помилок**: `showErrorFallback={true}` увімкнено за замовчуванням
-   **Помилки автоматичних робочих процесів**: Перехоплює та обробляє помилки під час виконання автоматичних робочих процесів
-   **Помилки рендерингу**: Відображає резервний вміст, коли рендеринг моделі не вдається

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Рендеринг не вдався, спробуйте ще раз</div>}
/>
```

## Оптимізація продуктивності

### Пропуск автоматичних робочих процесів

У сценаріях, де автоматичні робочі процеси не потрібні, ви можете пропустити їх для підвищення продуктивності:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Реактивні оновлення

`FlowModelRenderer` використовує `observer` з `@formily/reactive-react` для реактивних оновлень, забезпечуючи автоматичний перерендер компонента при зміні стану моделі.

## Примітки

1.  **Валідація моделі**: Переконайтеся, що передана `model` має дійсний метод `render`.
2.  **Управління життєвим циклом**: Хуки життєвого циклу моделі викликатимуться у відповідний час.
3.  **Межа помилок**: Рекомендується вмикати межу помилок у виробничому середовищі для забезпечення кращого користувацького досвіду.
4.  **Міркування щодо продуктивності**: Для сценаріїв, що передбачають рендеринг великої кількості моделей, розгляньте можливість використання опції `skipApplyAutoFlows`.