# Рендеринг FlowModel

Рендерер FlowModel (`FlowModelRenderer`) — основной React-компонент для рендеринга FlowModel. Он отвечает за преобразование экземпляра `FlowModel` в визуальный React-компонент.

## Базовое использование

### Рендерер FlowModel (`FlowModelRenderer`)

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Базовое использование
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Для управляемых field-моделей используйте `FieldModelRenderer`:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Рендер управляемого поля
<FieldModelRenderer model={fieldModel} />
```

## Props

### Свойства рендерера FlowModel (`FlowModelRendererProps`)

| Параметр | Тип | По умолчанию | Описание |
|------|------|--------|------|
| `model` | `FlowModel` | - | Экземпляр FlowModel для рендеринга |
| `uid` | `string` | - | Уникальный идентификатор flow model |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Fallback-контент при ошибке рендеринга |
| `showFlowSettings` | `boolean \| object` | `false` | Показывать ли вход в настройки flow |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Стиль взаимодействия для настроек flow |
| `hideRemoveInSettings` | `boolean` | `false` | Скрывать ли кнопку удаления в настройках |
| `showTitle` | `boolean` | `false` | Показывать ли заголовок модели в левом верхнем углу рамки |
| `skipApplyAutoFlows` | `boolean` | `false` | Пропускать ли применение auto flows |
| `inputArgs` | `Record<string, any>` | - | Дополнительный контекст для `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Оборачивать ли верхний уровень в компонент `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | Уровень меню настроек: 1=текущая модель, 2=включая дочерние модели |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Дополнительные элементы toolbar |

### Детальная конфигурация `showFlowSettings`

Когда `showFlowSettings` задан объектом, поддерживаются следующие настройки:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Показать фон
  showBorder: true,        // Показать рамку
  showDragHandle: true,    // Показать маркер перемещения
  style: {},              // Кастомный стиль toolbar
  toolbarPosition: 'inside' // Позиция toolbar: 'inside' | 'above' | 'below'
}}
```

## Жизненный цикл рендеринга

Весь цикл рендеринга вызывает следующие методы по порядку:

1.  **model.dispatchEvent('beforeRender')** - событие `beforeRender`
2.  **model.render()** - выполнение метода рендера модели
3.  **model.onMount()** - хук монтирования компонента
4.  **model.onUnmount()** - хук размонтирования компонента

## Примеры использования

### Базовый рендер

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Loading...</div>}
    />
  );
}
```

### Рендер с настройками Flow

```tsx pure
// Показать настройки, но скрыть кнопку удаления
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Показать настройки и заголовок
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// Использовать режим контекстного меню
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### Кастомный Toolbar

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: 'Пользовательское действие',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('Пользовательское действие');
      }
    }
  ]}
/>
```

### Пропуск Auto Flows

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Рендер Field Model

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

## Обработка ошибок (Error Handling)

Рендерер FlowModel (`FlowModelRenderer`) имеет встроенный комплексный механизм обработки ошибок:

-   **Автоматический Error Boundary**: `showErrorFallback={true}` включен по умолчанию
-   **Ошибки Auto Flow**: перехватывает и обрабатывает ошибки во время выполнения auto flows
-   **Ошибки рендеринга**: показывает fallback-контент, если рендер модели завершился ошибкой

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Сбой рендеринга, попробуйте снова</div>}
/>
```

## Оптимизация производительности

### Пропуск Auto Flows

Для сценариев, где auto flows не нужны, их можно пропустить для повышения производительности:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Реактивные обновления (Reactive Updates)

Рендерер FlowModel (`FlowModelRenderer`) использует `observer` из `@formily/reactive-react` для реактивных обновлений, чтобы компонент автоматически перерендеривался при изменении состояния модели.

## Примечания

1.  **Валидация модели**: убедитесь, что переданная `model` имеет корректный метод `render`.
2.  **Управление жизненным циклом**: хуки жизненного цикла модели будут вызваны в соответствующие моменты.
3.  **Предохранитель**: в рабочей среде рекомендуется использовать error boundary для повышения удобства работы.
4.  **Производительность**: в сценариях с большим количеством рендеров моделей рассмотрите использование `skipApplyAutoFlows`.