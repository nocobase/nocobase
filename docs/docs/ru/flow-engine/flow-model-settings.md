# Потоки событий и конфигурация FlowModel

FlowModel предоставляет подход на основе потока для реализации логики конфигурации компонентов, делая поведение и настройку компонентов более расширяемыми и визуальными.

## Пользовательская модель

Вы можете создать пользовательскую модель компонента, расширив FlowModel. Модель должна реализовать метод `render()` для определения логики рендеринга компонента.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Регистрация потока

Каждая модель может зарегистрировать один или несколько **потоков** (Flow), чтобы описать логику конфигурации компонента и шаги взаимодействия.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Button Settings',
  steps: {
    general: {
      title: 'General Configuration',
      uiSchema: {
        title: {
          type: 'string',
          title: 'Button Title',
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

Описание

-   `key`: уникальный идентификатор Flow.
-   `title`: имя Flow, используемое для отображения в UI.
-   `steps`: определяет шаги конфигурации. Каждый шаг включает:
    -   `title`: заголовок шага.
    -   `uiSchema`: структуру формы конфигурации (совместима с Formily Schema).
    -   `defaultParams`: параметры по умолчанию.
    -   `handler(ctx, params)`: вызывается при сохранении для обновления состояния модели.

## Рендеринг модели

При рендеринге модели компонента вы можете использовать параметр `showFlowSettings`, чтобы включать или выключать функцию конфигурации. Если `showFlowSettings` включен, в правом верхнем углу компонента автоматически появится вход в настройки (например, иконка или кнопка настроек).

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Ручное открытие формы конфигурации через openFlowSettings

Помимо открытия формы конфигурации через встроенную точку взаимодействия, вы также можете вручную вызвать `openFlowSettings()`.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Определение параметров (Parameter Definitions)

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Обязательный параметр: экземпляр связанной модели
  preset?: boolean;               // Рендерить только шаги с preset=true (по умолчанию false)
  flowKey?: string;               // Указать один Flow
  flowKeys?: string[];            // Указать несколько Flows (игнорируется, если задан flowKey)
  stepKey?: string;               // Указать один шаг (обычно вместе с flowKey)
  uiMode?: 'dialog' | 'drawer';   // Контейнер для отображения формы, по умолчанию 'dialog'
  onCancel?: () => void;          // Колбэк при нажатии отмены
  onSaved?: () => void;           // Колбэк после успешного сохранения конфигурации
}
```

### Пример: открытие формы настройки конкретного Flow в режиме выдвижной панели

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Button settings saved');
  },
});
```