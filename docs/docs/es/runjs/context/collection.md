:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/collection).
:::

# ctx.collection

La instancia de la colección (Collection) asociada al contexto de ejecución actual de RunJS, utilizada para acceder a los metadatos de la colección, definiciones de campos, claves primarias y otras configuraciones. Generalmente proviene de `ctx.blockModel.collection` o `ctx.collectionField?.collection`.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock** | La colección vinculada al bloque; permite acceder a `name`, `getFields`, `filterTargetKey`, etc. |
| **JSField / JSItem / JSColumn** | La colección a la que pertenece el campo actual (o la colección del bloque padre), utilizada para obtener listas de campos, claves primarias, etc. |
| **Columna de tabla / Bloque de detalles** | Se utiliza para el renderizado basado en la estructura de la colección o para pasar `filterByTk` al abrir ventanas emergentes. |

> Nota: `ctx.collection` está disponible en escenarios donde un bloque de datos, bloque de formulario o bloque de tabla está vinculado a una colección. En un JSBlock independiente que no esté vinculado a una colección, puede ser `null`. Se recomienda realizar una comprobación de valores nulos antes de su uso.

## Definición de tipo

```ts
collection: Collection | null | undefined;
```

## Propiedades comunes

| Propiedad | Tipo | Descripción |
|------|------|------|
| `name` | `string` | Nombre de la colección (ej. `users`, `orders`) |
| `title` | `string` | Título de la colección (incluye internacionalización) |
| `filterTargetKey` | `string \| string[]` | Nombre del campo de la clave primaria, utilizado para `filterByTk` y `getFilterByTK` |
| `dataSourceKey` | `string` | Clave de la fuente de datos (ej. `main`) |
| `dataSource` | `DataSource` | La instancia de la fuente de datos a la que pertenece |
| `template` | `string` | Plantilla de la colección (ej. `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Lista de campos que pueden mostrarse como títulos |
| `titleCollectionField` | `CollectionField` | Instancia del campo de título |

## Métodos comunes

| Método | Descripción |
|------|------|
| `getFields(): CollectionField[]` | Obtiene todos los campos (incluyendo los heredados) |
| `getField(name: string): CollectionField \| undefined` | Obtiene un solo campo por su nombre |
| `getFieldByPath(path: string): CollectionField \| undefined` | Obtiene un campo por su ruta (admite asociaciones, ej. `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Obtiene campos de asociación; `types` puede ser `['one']`, `['many']`, etc. |
| `getFilterByTK(record): any` | Extrae el valor de la clave primaria de un registro, utilizado para el `filterByTk` de la API |

## Relación con ctx.collectionField y ctx.blockModel

| Requisito | Uso recomendado |
|------|----------|
| **Colección asociada al contexto actual** | `ctx.collection` (equivalente a `ctx.blockModel?.collection` o `ctx.collectionField?.collection`) |
| **Definición de colección del campo actual** | `ctx.collectionField?.collection` (la colección a la que pertenece el campo) |
| **Colección de destino de la asociación** | `ctx.collectionField?.targetCollection` (la colección de destino de un campo de asociación) |

En escenarios como subtablas, `ctx.collection` podría ser la colección de destino de la asociación; en formularios o tablas estándar, suele ser la colección vinculada al bloque.

## Ejemplos

### Obtener la clave primaria y abrir una ventana emergente

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Iterar a través de los campos para validación o vinculación

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} es obligatorio`);
    return;
  }
}
```

### Obtener campos de asociación

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Se utiliza para construir subtablas, recursos asociados, etc.
```

## Notas

- `filterTargetKey` es el nombre del campo de la clave primaria de la colección. Algunas colecciones pueden usar un `string[]` para claves primarias compuestas. Si no está configurado, comúnmente se utiliza `'id'` como alternativa.
- En escenarios como **subtablas o campos de asociación**, `ctx.collection` puede apuntar a la colección de destino de la asociación, lo cual difiere de `ctx.blockModel.collection`.
- `getFields()` fusiona los campos de las colecciones heredadas; los campos locales sobrescriben a los campos heredados con el mismo nombre.

## Relacionado

- [ctx.collectionField](./collection-field.md): La definición del campo de la colección del campo actual
- [ctx.blockModel](./block-model.md): El bloque padre que aloja el JS actual, contiene `collection`
- [ctx.model](./model.md): El modelo actual, que puede contener `collection`