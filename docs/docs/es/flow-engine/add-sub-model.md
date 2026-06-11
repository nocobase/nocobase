---
title: "AddSubModelButton"
description: "AddSubModelButton: añade subModel en un FlowModel determinado, con soporte para menús asíncronos, agrupaciones, submenús, filtrado por clase base y modo conmutable."
keywords: "AddSubModelButton,subModel,submodelo,FlowModel,FlowEngine,menú asíncrono,menú agrupado"
---

# AddSubModelButton

Se utiliza para añadir submodelos (subModel) dentro de un `FlowModel` determinado. Admite múltiples formas de configuración: carga asíncrona, agrupaciones, submenús, reglas personalizadas de herencia de modelos, entre otras.

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

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `model` | `FlowModel` | **Obligatorio**. El modelo de destino al que se va a añadir el submodelo. |
| `subModelKey` | `string` | **Obligatorio**. Nombre de la clave del submodelo en `model.subModels`. |
| `subModelType` | `'object' \| 'array'` | Tipo de estructura de datos del submodelo; el valor por defecto es `'array'`. |
| `items` | `SubModelItem[]` \| `(ctx) => SubModelItem[] \| Promise<...>` | Definición de los elementos del menú; admite generación estática o asíncrona. |
| `subModelBaseClass` | `string` \| `ModelConstructor` | Especifica una clase base; lista todos los modelos que heredan de ella como elementos del menú. |
| `subModelBaseClasses` | `(string \| ModelConstructor)[]` | Especifica varias clases base; lista automáticamente los modelos heredados agrupados. |
| `afterSubModelInit` | `(subModel) => Promise<void>` | Callback que se ejecuta tras la inicialización del submodelo. |
| `afterSubModelAdd` | `(subModel) => Promise<void>` | Callback que se ejecuta tras añadir el submodelo. |
| `afterSubModelRemove` | `(subModel) => Promise<void>` | Callback que se ejecuta tras eliminar el submodelo. |
| `children` | `React.ReactNode` | Contenido del botón; puede personalizarse como texto o icono. |
| `keepDropdownOpen` | `boolean` | Indica si el menú desplegable permanece abierto después de añadir un elemento. Por defecto se cierra automáticamente. |

## Definición del tipo SubModelItem

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

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `key` | `string` | Identificador único. |
| `label` | `string` | Texto que se muestra. |
| `type` | `'group' \| 'divider'` | Agrupación o separador. Si se omite, se trata de un elemento normal o un submenú. |
| `disabled` | `boolean` | Indica si el elemento está deshabilitado. |
| `hide` | `boolean` \| `(ctx) => boolean \| Promise<boolean>` | Ocultación dinámica (devolver `true` para ocultar). |
| `icon` | `React.ReactNode` | Contenido del icono. |
| `children` | `SubModelItemsType` | Elementos del submenú; se utiliza para agrupar o anidar submenús. |
| `useModel` | `string` | Especifica el tipo de Model que se va a utilizar (nombre registrado). |
| `createModelOptions` | `object` | Parámetros que se utilizan al inicializar el modelo. |
| `toggleable` | `boolean` \| `(model: FlowModel) => boolean` | Modo conmutable: si ya está añadido, se elimina; si no lo está, se añade (solo se permite uno). |

## Ejemplos

### Añadir subModels con `<AddSubModelButton />`

```tsx file="./_demos/add-sub-model/add-sub-model-basic.tsx" preview
```

- Para utilizar `<AddSubModelButton />` y añadir subModels, el botón debe colocarse dentro de algún FlowModel;
- Utilice `model.mapSubModels()` para recorrer los subModels; el método `mapSubModels` se encarga de los elementos faltantes, del orden, etc.;
- Utilice `<FlowModelRenderer />` para renderizar los subModels.

### Distintas formas de AddSubModelButton

```tsx file="./_demos/add-sub-model/add-sub-model-icon.tsx" preview
```

- Puede usar el componente botón `<Button>Add block</Button>` y colocarlo donde desee;
- También puede usar un icono `<PlusOutlined />`;
- También puede ubicarlo en la zona de Flow Settings, en la esquina superior derecha.

### Soporte para el modo conmutable

```tsx file="./_demos/add-sub-model/add-sub-model-toggleable.tsx" preview
```

- Para escenarios sencillos basta con `toggleable: true`; por defecto se busca por nombre de clase y solo se permite una instancia de la misma clase;
- Para reglas de búsqueda personalizadas: `toggleable: (model: FlowModel) => boolean`.

### Items asíncronos

```tsx file="./_demos/add-sub-model/add-sub-model-async-items.tsx" preview
```

Puede obtener items dinámicos a partir del contexto, por ejemplo:

- Pueden venir de una llamada remota `ctx.api.request()`;
- También pueden obtenerse de las API que ofrece `ctx.dataSourceManager`;
- También pueden ser propiedades o métodos personalizados del contexto;
- Tanto `items` como `children` admiten llamadas asíncronas.

### Ocultar elementos del menú dinámicamente (hide)

```tsx file="./_demos/add-sub-model/add-sub-model-hide.tsx" preview
```

- `hide` admite `boolean` o una función (incluida async); devolver `true` significa ocultar;
- Se aplica de forma recursiva sobre group y children.

### Uso de agrupaciones, submenús y separadores

```tsx file="./_demos/add-sub-model/add-sub-model-basic-children.tsx" preview
```

- Cuando `type: divider`, se trata de un separador;
- Cuando `type: group` y se proporcionan `children`, se trata de una agrupación de menú;
- Cuando hay `children` pero no `type`, se trata de un submenú.

### Generar items automáticamente mediante una clase base

```tsx file="./_demos/add-sub-model/add-sub-model-base-class.tsx" preview
```

- Se listan todos los FlowModel que heredan de `subModelBaseClass`;
- Mediante `Model.define()` puede definir los metadatos correspondientes;
- Los marcados con `hide: true` se ocultan automáticamente.

### Implementar agrupaciones mediante clases base

```tsx file="./_demos/add-sub-model/add-sub-model-base-class-group.tsx" preview
```

- Se listan todos los FlowModel que heredan de `subModelBaseClasses`;
- Se agrupan automáticamente por `subModelBaseClasses` y se eliminan duplicados.

### Implementar un submenú mediante clase base + `menuType=submenu`

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-base-class.tsx" preview
```

- Indique la forma de presentación de la clase base con `Model.define({ menuType: 'submenu' })`;
- Aparece como elemento de primer nivel y se despliega como submenú; puede ordenarse junto con otras agrupaciones según `meta.sort`.

### Personalizar el submenú mediante `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-define-children.tsx" preview
```

### Personalizar los children de un grupo mediante `Model.defineChildren()`

```tsx file="./_demos/add-sub-model/add-sub-model-group-children.tsx" preview
```

### Habilitar la búsqueda en submenús

```tsx file="./_demos/add-sub-model/add-sub-model-submenu-search.tsx" preview
```

- Cualquier elemento de menú que contenga `children` mostrará un cuadro de búsqueda en ese nivel cuando se establezca `searchable: true`;
- Se admite una mezcla de elementos de tipo group y no group en el mismo nivel; la búsqueda solo afecta al nivel actual.
