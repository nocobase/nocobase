:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::

# FlowModel: Потоки событий и конфигурирование

FlowModel предлагает подход, основанный на «потоках событий» (Flow), для реализации логики конфигурирования компонентов. Это делает поведение и настройку компонентов более расширяемыми и наглядными.

## Пользовательская модель

Вы можете создать пользовательскую модель компонента, унаследовав её от `FlowModel`. Модель должна реализовать метод `render()`, чтобы определить логику рендеринга компонента.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## Регистрация потока (Flow)

Каждая модель может зарегистрировать один или несколько **потоков** (Flow), которые описывают логику конфигурирования и шаги взаимодействия компонента.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: 'Настройки кнопки',
  steps: {
    general: {
      title: 'Общие настройки',
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

Описание

-   `key`: Уникальный идентификатор потока.
-   `title`: Название потока, используемое для отображения в пользовательском интерфейсе.
-   `steps`: Определяет шаги конфигурации (Step). Каждый шаг включает:
    -   `title`: Заголовок шага.
    -   `uiSchema`: Структура формы конфигурации (совместима с Formily Schema).
    -   `defaultParams`: Параметры по умолчанию.
    -   `handler(ctx, params)`: Вызывается при сохранении для обновления состояния модели.

## Рендеринг модели

При рендеринге модели компонента вы можете использовать параметр `showFlowSettings`, чтобы контролировать, следует ли включать функцию конфигурирования. Если `showFlowSettings` включен, в правом верхнем углу компонента автоматически появится точка входа для настроек (например, значок или кнопка настроек).

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## Открытие формы конфигурации вручную с помощью openFlowSettings

Помимо открытия формы конфигурации через встроенную точку входа для взаимодействия, вы также можете вызвать
`openFlowSettings()` вручную в коде.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### Определение параметров

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // Обязательно, экземпляр модели, к которой относится
  preset?: boolean;               // Отображает только шаги, помеченные как preset=true (по умолчанию false)
  flowKey?: string;               // Указывает один поток (Flow)
  flowKeys?: string[];            // Указывает несколько потоков (игнорируется, если также указан flowKey)
  stepKey?: string;               // Указывает один шаг (обычно используется в сочетании с flowKey)
  uiMode?: 'dialog' | 'drawer';   // Контейнер для отображения формы, по умолчанию 'dialog'
  onCancel?: () => void;          // Коллбэк при нажатии кнопки «Отмена»
  onSaved?: () => void;           // Коллбэк после успешного сохранения конфигурации
}
```

### Пример: Открытие формы конфигурации для конкретного потока в режиме Drawer

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('Настройки кнопки сохранены');
  },
});
```