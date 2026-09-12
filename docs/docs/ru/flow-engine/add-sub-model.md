---
title: "AddSubModelButton"
description: "AddSubModelButton: добавление subModel в указанный FlowModel с поддержкой асинхронного меню, групп, подменю, фильтрации по базовому классу и режима переключателя."
keywords: "AddSubModelButton,subModel,дочерняя модель,FlowModel,FlowEngine,асинхронное меню,групповое меню"
---

# AddSubModelButton

Используется для добавления дочерней модели (subModel) в указанный `FlowModel`. Поддерживает множество вариантов настройки: асинхронную загрузку, группы, подменю, правила наследования моделей и другие.

## Props

```ts pure
interface AddSubModelButtonProps {
  model: FlowModel;
  subModelKey: string;
  subModelType?: 'object' | 'array';
  items?: SubModelItemsType;
  subModelBaseClass?: string | ModelConstructor;
  subModelBaseClasses?: Array<string | ModelConstructor>;
  afterSubModelInit?: (subModel: FlowModel) => Promise<void>;
  afterSubModelAdd?: (subModel: FlowModel) => Promise<void>;
  afterSubModelRemove?: (subModel: FlowModel) => Promise<void>;
  children?: React.ReactNode;
  keepDropdownOpen?: boolean;
}
```

| Параметр | Тип | Описание |
| --- | --- | --- |
| `model` | `FlowModel` | **Обязательный**. Целевая модель, в которую добавляется дочерняя модель. |
| `subModelKey` | `string` | **Обязательный**. Имя ключа дочерней модели в `model.subModels`. |
| `subModelType` | `'object' \| 'array'` | Тип структуры данных дочерней модели, по умолчанию `'array'`. |
| `items` | `SubModelItem[]` \| `(ctx) => SubModelItem[] \| Promise<...>` | Определение пунктов меню, поддерживает статическую или асинхронную генерацию. |
| `subModelBaseClass` | `string` \| `ModelConstructor` | Указывает базовый класс — все наследующие его модели будут перечислены как пункты меню. |
| `subModelBaseClasses` | `(string \| ModelConstructor)[]` | Указывает несколько базовых классов — наследующие модели автоматически группируются. |
| `afterSubModelInit` | `(subModel) => Promise<void>` | Колбэк, вызываемый после инициализации дочерней модели. |
| `afterSubModelAdd` | `(subModel) => Promise<void>` | Колбэк, вызываемый после добавления дочерней модели. |
| `afterSubModelRemove` | `(subModel) => Promise<void>` | Колбэк, вызываемый после удаления дочерней модели. |
| `children` | `React.ReactNode` | Содержимое кнопки — можно настроить как текст или иконку. |
| `keepDropdownOpen` | `boolean` | Оставлять ли раскрытым выпадающее меню после добавления. По умолчанию закрывается автоматически. |

## Описание типа SubModelItem

```ts pure
interface SubModelItem {
  key?: string;
  label?: string;
  type?: 'group' | 'divider';
  disabled?: boolean;
  hide?: boolean | ((ctx: FlowModelContext) => boolean | Promise<boolean>);
  icon?: React.ReactNode;
  children?: SubModelItemsType;
  useModel?: string;
  createModelOptions?: {
    props?: Record<string, any>;
    stepParams?: Record<string, any>;
  };
  toggleable?: boolean | ((model: FlowModel) => boolean);
}
```

| Поле | Тип | Описание |
| --- | --- | --- |
| `key` | `string` | Уникальный идентификатор. |
| `label` | `string` | Отображаемый текст. |
| `type` | `'group' \| 'divider'` | Группа или разделитель. Если опущено — обычный пункт или подменю. |
| `disabled` | `boolean` | Отключён ли текущий пункт. |
| `hide` | `boolean` \| `(ctx) => boolean \| Promise<boolean>` | Динамическое скрытие (возврат `true` означает скрыть). |
| `icon` | `React.ReactNode` | Содержимое иконки. |
| `children` | `SubModelItemsType` | Пункты подменю — для вложенных групп или подменю. |
| `useModel` | `string` | Указывает используемый тип Model (зарегистрированное имя). |
| `createModelOptions` | `object` | Параметры инициализации модели. |
| `toggleable` | `boolean` \| `(model: FlowModel) => boolean` | Режим переключателя: если уже добавлена — удалить, иначе — добавить (допускается только один экземпляр). |

## Примеры

### Добавление subModels через `<AddSubModelButton />`

```tsx file="./_demos/add-sub-model/add-sub-model-basic.tsx" preview
```

- Кнопка `<AddSubModelButton />` используется для добавления subModels и должна находиться внутри какого-либо FlowModel;
- Используйте `model.mapSubModels()` для обхода subModels — этот метод решает проблемы пропусков, сортировки и т. д.;
- Используйте `<FlowModelRenderer />` для рендеринга subModels.

### Различные формы AddSubModelButton

```tsx file="./_demos/add-sub-model/add-sub-model-icon.tsx" preview
```

- Можно использовать компонент кнопки `<Button>Add block</Button>` и размещать его где угодно;
- Можно использовать иконку `<PlusOutlined />`;
- Можно поместить его в верхнем правом углу — рядом с Flow Settings.

### Поддержка режима переключателя

```tsx file="./_demos/add-sub-model/add-sub-model-toggleable.tsx" preview
```

- В простых случаях достаточно `toggleable: true` — по умолчанию поиск ведётся по имени класса, допускается только один экземпляр одного класса;
- Пользовательское правило поиска: `toggleable: (model: FlowModel) => boolean`.

### Асинхронные items

```tsx file="./_demos/add-sub-model/add-sub-model-async-items.tsx" preview
```

Динамические items можно получить из контекста, например:

- Из удалённого источника через `ctx.api.request()`;
- Из API, предоставляемого `ctx.dataSourceManager`;
- Из пользовательских свойств или методов контекста;
- Как `items`, так и `children` поддерживают асинхронные вызовы.

### Динамическое скрытие пунктов меню (hide)

```tsx file="./_demos/add-sub-model/add-sub-model-hide.tsx" preview
```

- `hide` поддерживает `boolean` или функцию (в том числе async); возврат `true` означает скрыть;
- Применяется рекурсивно к group и children.

### Использование групп, подменю и разделителей

```tsx file="./_demos/add-sub-model/add-sub-model-basic-children.tsx" preview
```

- При `type: divider` — это разделитель;
- При `type: group` с `children` — это группа меню;
- При наличии `children`, но без `type` — это подменю.

### Автоматическая генерация items через наследование

```tsx file="./_demos/add-sub-model/add-sub-model-base-class.tsx" preview
```

- Все FlowModel, наследующие `subModelBaseClass`, будут перечислены;
- Метаданные можно задать через `Model.define()`;
- Помеченные `hide: true` будут автоматически скрыты.

### Группировка через наследование

```tsx file="./_demos/add-sub-model/add-sub-model-base-class-group.tsx" preview
```

- Все FlowModel, наследующие `subModelBaseClasses`, будут перечислены;
- Они автоматически группируются по `subModelBaseClasses` с устранением дубликатов.

### Двухуровневое меню через наследование + `menuType=submenu`

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-base-class.tsx" preview
```

- Форма отображения базового класса задаётся через `Model.define({ menuType: 'submenu' })`;
- Появляется как пункт первого уровня и разворачивается во вложенное меню; может смешиваться с другими группами и сортироваться по `meta.sort`.

### Пользовательское подменю через `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-define-children.tsx" preview
```

### Пользовательские group children через `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-group-children.tsx" preview
```

### Включение поиска в подменю

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-search.tsx" preview
```

- В любом пункте меню, содержащем `children`, при `searchable: true` на этом уровне отображается поле поиска;
- Поддерживается смешанная структура group и не-group на одном уровне; поиск работает только на текущем уровне.
