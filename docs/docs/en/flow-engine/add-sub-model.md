---
title: "AddSubModelButton"
description: "AddSubModelButton: Add subModels to a specified FlowModel, supporting async menus, grouping, submenus, class inheritance filtering, and toggle mode."
keywords: "AddSubModelButton,subModel,sub model,FlowModel,FlowEngine,async menu,grouped menu"
---

# AddSubModelButton

Used to add sub-models (subModel) to a specified `FlowModel`. Supports async loading, grouping, submenus, custom model inheritance rules, and various other configuration options.

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

| Parameter | Type | Description |
| --- | --- | --- |
| `model` | `FlowModel` | **Required**. The target model to add sub-models to. |
| `subModelKey` | `string` | **Required**. The key name of the sub-model in `model.subModels`. |
| `subModelType` | `'object' \| 'array'` | The data structure type of the sub-model, defaults to `'array'`. |
| `items` | `SubModelItem[]` \| `(ctx) => SubModelItem[] \| Promise<...>` | Menu item definitions, supports static or async generation. |
| `subModelBaseClass` | `string` \| `ModelConstructor` | Specify a base class to list all models inheriting from it as menu items. |
| `subModelBaseClasses` | `(string \| ModelConstructor)[]` | Specify multiple base classes to automatically list inheriting models by group. |
| `afterSubModelInit` | `(subModel) => Promise<void>` | Callback after sub-model initialization. |
| `afterSubModelAdd` | `(subModel) => Promise<void>` | Callback after sub-model is added. |
| `afterSubModelRemove` | `(subModel) => Promise<void>` | Callback after sub-model is removed. |
| `children` | `React.ReactNode` | Button content, can be customized as text or an icon. |
| `keepDropdownOpen` | `boolean` | Whether to keep the dropdown menu open after adding. Automatically closes by default. |

## SubModelItem Type Definition

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

| Field | Type | Description |
| --- | --- | --- |
| `key` | `string` | Unique identifier. |
| `label` | `string` | Display text. |
| `type` | `'group' \| 'divider'` | Group or divider. Omitted for regular items or submenus. |
| `disabled` | `boolean` | Whether to disable the current item. |
| `hide` | `boolean` \| `(ctx) => boolean \| Promise<boolean>` | Dynamic hiding (returns `true` to hide). |
| `icon` | `React.ReactNode` | Icon content. |
| `children` | `SubModelItemsType` | Submenu items, used for nested groups or submenus. |
| `useModel` | `string` | Specify the Model type (registered name) to use. |
| `createModelOptions` | `object` | Parameters for model initialization. |
| `toggleable` | `boolean` \| `(model: FlowModel) => boolean` | Toggle mode — removes if already added, adds if not (only allows one instance). |

## Examples

### Using `<AddSubModelButton />` to Add subModels

```tsx file="./_demos/add-sub-model/add-sub-model-basic.tsx" preview
```

- Use `<AddSubModelButton />` to add subModels; the button must be placed inside a FlowModel to work;
- Use `model.mapSubModels()` to iterate over subModels; the `mapSubModels` method handles missing items, sorting, and other issues;
- Use `<FlowModelRenderer />` to render subModels.

### Different Styles of AddSubModelButton

```tsx file="./_demos/add-sub-model/add-sub-model-icon.tsx" preview
```

- You can use a button component like `<Button>Add block</Button>`, which can be placed anywhere;
- You can also use an icon like `<PlusOutlined />`;
- Or place it in the top-right Flow Settings area.

### Toggle Mode Support

```tsx file="./_demos/add-sub-model/add-sub-model-toggleable.tsx" preview
```

- For simple scenarios, `toggleable: true` is sufficient — it searches by class name by default, allowing only one instance of the same class;
- Custom search rules: `toggleable: (model: FlowModel) => boolean`.

### Async Items

```tsx file="./_demos/add-sub-model/add-sub-model-async-items.tsx" preview
```

You can get dynamic items from the context, for example:

- It can be a remote `ctx.api.request()`;
- Or data obtained from APIs provided by `ctx.dataSourceManager`;
- Or custom context properties or methods;
- Both `items` and `children` support async calls.

### Dynamically Hiding Menu Items (hide)

```tsx file="./_demos/add-sub-model/add-sub-model-hide.tsx" preview
```

- `hide` supports `boolean` or a function (supports async); returns `true` to hide;
- Applies recursively to groups and children.

### Using Groups, Submenus, and Dividers

```tsx file="./_demos/add-sub-model/add-sub-model-basic-children.tsx" preview
```

- `type: divider` renders a divider;
- `type: group` with `children` renders a menu group;
- Has `children` but no `type` renders a submenu.

### Auto-generating Items via Inheritance Classes

```tsx file="./_demos/add-sub-model/add-sub-model-base-class.tsx" preview
```

- All FlowModels inheriting from `subModelBaseClass` will be listed;
- Related metadata can be defined via `Model.define()`;
- Items marked with `hide: true` are automatically hidden.

### Implementing Grouping via Inheritance Classes

```tsx file="./_demos/add-sub-model/add-sub-model-base-class-group.tsx" preview
```

- All FlowModels inheriting from `subModelBaseClasses` will be listed;
- Automatically grouped by `subModelBaseClasses` with deduplication.

### Implementing Two-level Menus via Inheritance Classes + `menuType=submenu`

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-base-class.tsx" preview
```

- Set the display style for the base class via `Model.define({ menuType: 'submenu' })`;
- Appears as a first-level item that expands into a second-level menu; can be sorted alongside other groups using `meta.sort`.

### Customizing Submenus via `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-define-children.tsx" preview
```

### Customizing Group Children via `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-group-children.tsx" preview
```

### Enabling Search in Submenus

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-search.tsx" preview
```

- Any menu item with `children` that sets `searchable: true` will display a search box at that level;
- Supports mixed structures with both group and non-group items at the same level; search only applies to the current level.
