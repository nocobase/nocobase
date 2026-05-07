:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/collection-field).
:::

# ctx.collectionField

La instancia del campo de la colección (`CollectionField`) asociada al contexto de ejecución actual de RunJS, utilizada para acceder a los metadatos, tipos, reglas de validación e información de asociación del campo. Solo existe cuando el campo está vinculado a la definición de una colección; los campos personalizados o virtuales pueden ser `null`.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSField** | Realizar vinculaciones o validaciones en campos de formulario basadas en `interface`, `enum`, `targetCollection`, etc. |
| **JSItem** | Acceder a los metadatos del campo correspondiente a la columna actual en elementos de una subtabla. |
| **JSColumn** | Seleccionar métodos de renderizado basados en `collectionField.interface` o acceder a `targetCollection` en columnas de una tabla. |

> Nota: `ctx.collectionField` solo está disponible cuando el campo está vinculado a la definición de una colección; suele ser `undefined` en escenarios como bloques independientes (JSBlock) o eventos de acción sin vinculación a campos. Se recomienda realizar una comprobación de valores nulos antes de su uso.

## Definición de tipo

```ts
collectionField: CollectionField | null | undefined;
```

## Propiedades comunes

| Propiedad | Tipo | Descripción |
|------|------|------|
| `name` | `string` | Nombre del campo (ej. `status`, `userId`) |
| `title` | `string` | Título del campo (incluye internacionalización) |
| `type` | `string` | Tipo de dato del campo (`string`, `integer`, `belongsTo`, etc.) |
| `interface` | `string` | Tipo de interfaz del campo (`input`, `select`, `m2o`, `o2m`, `m2m`, etc.) |
| `collection` | `Collection` | La colección a la que pertenece el campo |
| `targetCollection` | `Collection` | La colección de destino del campo de asociación (solo para tipos de asociación) |
| `target` | `string` | Nombre de la colección de destino (para campos de asociación) |
| `enum` | `array` | Opciones de enumeración (select, radio, etc.) |
| `defaultValue` | `any` | Valor por defecto |
| `collectionName` | `string` | Nombre de la colección a la que pertenece |
| `foreignKey` | `string` | Nombre del campo de clave foránea (belongsTo, etc.) |
| `sourceKey` | `string` | Clave de origen de la asociación (hasMany, etc.) |
| `targetKey` | `string` | Clave de destino de la asociación |
| `fullpath` | `string` | Ruta completa (ej. `main.users.status`), utilizada para la API o referencias de variables |
| `resourceName` | `string` | Nombre del recurso (ej. `users.status`) |
| `readonly` | `boolean` | Indica si es de solo lectura |
| `titleable` | `boolean` | Indica si puede mostrarse como un título |
| `validation` | `object` | Configuración de las reglas de validación |
| `uiSchema` | `object` | Configuración de la interfaz de usuario (UI) |
| `targetCollectionTitleField` | `CollectionField` | El campo de título de la colección de destino (para campos de asociación) |

## Métodos comunes

| Método | Descripción |
|------|------|
| `isAssociationField(): boolean` | Indica si es un campo de asociación (belongsTo, hasMany, hasOne, belongsToMany, etc.) |
| `isRelationshipField(): boolean` | Indica si es un campo de relación (incluyendo o2o, m2o, o2m, m2m, etc.) |
| `getComponentProps(): object` | Obtiene las propiedades (props) por defecto del componente del campo |
| `getFields(): CollectionField[]` | Obtiene la lista de campos de la colección de destino (solo campos de asociación) |
| `getFilterOperators(): object[]` | Obtiene los operadores de filtrado compatibles con este campo (ej. `$eq`, `$ne`, etc.) |

## Ejemplos

### Renderizado condicional basado en el tipo de interfaz

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Campo de asociación: mostrar registros asociados
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Determinar si es un campo de asociación y acceder a la colección de destino

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Procesar según la estructura de la colección de destino
}
```

### Obtener opciones de enumeración

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Renderizado condicional basado en el modo de solo lectura/visualización

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Obtener el campo de título de la colección de destino

```ts
// Al mostrar un campo de asociación, use targetCollectionTitleField para obtener el nombre del campo de título
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Relación con ctx.collection

| Necesidad | Uso recomendado |
|------|----------|
| **Colección a la que pertenece el campo actual** | `ctx.collectionField?.collection` o `ctx.collection` |
| **Metadatos del campo (nombre, tipo, interfaz, enumeración, etc.)** | `ctx.collectionField` |
| **Colección de destino de la asociación** | `ctx.collectionField?.targetCollection` |

`ctx.collection` normalmente representa la colección vinculada al bloque actual; `ctx.collectionField` representa la definición del campo actual dentro de la colección. En escenarios como subtablas o campos de asociación, ambos pueden diferir.

## Notas

- En escenarios como **JSBlock** o **JSAction (sin vinculación a campos)**, `ctx.collectionField` suele ser `undefined`. Se recomienda utilizar el encadenamiento opcional (optional chaining) antes de acceder a él.
- Si un campo JS personalizado no está vinculado a un campo de la colección, `ctx.collectionField` puede ser `null`.
- `targetCollection` solo existe para campos de tipo asociación (ej. m2o, o2m, m2m); `enum` solo existe para campos con opciones como select o radioGroup.

## Relacionado

- [ctx.collection](./collection.md): Colección asociada al contexto actual
- [ctx.model](./model.md): Modelo donde se encuentra el contexto de ejecución actual
- [ctx.blockModel](./block-model.md): Bloque padre que contiene el JS actual
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Leer y escribir el valor del campo actual