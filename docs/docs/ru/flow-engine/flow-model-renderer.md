:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# Рендеринг FlowModel

`FlowModelRenderer` — это основной React-компонент для рендеринга `FlowModel`. Он отвечает за преобразование экземпляра `FlowModel` в визуальный React-компонент.

## Основное использование

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// Основное использование
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

Для рендеринга управляемых моделей полей (FieldModel) используйте `FieldModelRenderer`:

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// Рендеринг управляемого поля
<FieldModelRenderer model={fieldModel} />
```

## Параметры Props

### FlowModelRendererProps

| Параметр | Тип | Значение по умолчанию | Описание |
|------|------|--------|------|
| `model` | `FlowModel` | - | Экземпляр FlowModel для рендеринга |
| `uid` | `string` | - | Уникальный идентификатор для FlowModel |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | Резервное содержимое, отображаемое при ошибке рендеринга |
| `showFlowSettings` | `boolean \| object` | `false` | Показывать ли вход для настроек рабочего процесса |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | Стиль взаимодействия для настроек рабочего процесса |
| `hideRemoveInSettings` | `boolean` | `false` | Скрывать ли кнопку удаления в настройках |
| `showTitle` | `boolean` | `false` | Показывать ли заголовок модели в левом верхнем углу рамки |
| `skipApplyAutoFlows` | `boolean` | `false` | Пропускать ли автоматическое применение рабочих процессов |
| `inputArgs` | `Record<string, any>` | - | Дополнительный контекст, передаваемый в `useApplyAutoFlows` |
| `showErrorFallback` | `boolean` | `true` | Оборачивать ли внешний слой компонентом `FlowErrorFallback` |
| `settingsMenuLevel` | `number` | - | Уровень меню настроек: 1 = только текущая модель, 2 = включая дочерние модели |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | Дополнительные элементы панели инструментов |

### Детальная конфигурация `showFlowSettings`

Когда `showFlowSettings` является объектом, поддерживаются следующие конфигурации:

```tsx pure
showFlowSettings={{
  showBackground: true,    // Показывать фон
  showBorder: true,        // Показывать границу
  showDragHandle: true,    // Показывать маркер перетаскивания
  style: {},              // Пользовательский стиль панели инструментов
  toolbarPosition: 'inside' // Позиция панели инструментов: 'inside' | 'above' | 'below'
}}
```

## Жизненный цикл рендеринга

Полный цикл рендеринга вызывает следующие методы в указанном порядке:

1.  **model.dispatchEvent('beforeRender')** - Событие 'beforeRender'
2.  **model.render()** - Выполняет метод рендеринга модели
3.  **model.onMount()** - Хук монтирования компонента
4.  **model.onUnmount()** - Хук размонтирования компонента

## Примеры использования

### Базовый рендеринг

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>Загрузка...</div>}
    />
  );
}
```

### Рендеринг с настройками рабочего процесса

```tsx pure
// Показывать настройки, но скрывать кнопку удаления
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// Показывать настройки и заголовок
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

### Пользовательская панель инструментов

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

### Пропуск автоматических рабочих процессов

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### Рендеринг модели поля

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

## Обработка ошибок

`FlowModelRenderer` имеет встроенный комплексный механизм обработки ошибок:

-   **Автоматический обработчик ошибок**: `showErrorFallback={true}` включен по умолчанию
-   **Ошибки автоматических рабочих процессов**: Перехватывает и обрабатывает ошибки во время выполнения автоматических рабочих процессов
-   **Ошибки рендеринга**: Отображает резервное содержимое при сбое рендеринга модели

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>Ошибка рендеринга, пожалуйста, попробуйте снова</div>}
/>
```

## Оптимизация производительности

### Пропуск автоматических рабочих процессов

В сценариях, где автоматические рабочие процессы не требуются, вы можете пропустить их для повышения производительности:

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### Реактивные обновления

`FlowModelRenderer` использует `observer` из `@formily/reactive-react` для реактивных обновлений, гарантируя, что компонент автоматически перерендерится при изменении состояния модели.

## Примечания

1.  **Валидация модели**: Убедитесь, что переданная `model` имеет действительный метод `render`.
2.  **Управление жизненным циклом**: Хуки жизненного цикла модели будут вызываться в соответствующее время.
3.  **Границы ошибок**: Рекомендуется включать границы ошибок в производственной среде для обеспечения лучшего пользовательского опыта.
4.  **Соображения производительности**: Для сценариев, включающих рендеринг большого количества моделей, рассмотрите возможность использования опции `skipApplyAutoFlows`.