:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/init-resource).
:::

# ctx.initResource()

**Inicializa** el recurso para el contexto actual. Si `ctx.resource` aún no existe, crea uno del tipo especificado y lo vincula al contexto; si ya existe, se utiliza directamente. Posteriormente, se puede acceder a él a través de `ctx.resource`.

## Escenarios de uso

Generalmente se utiliza en escenarios de **JSBlock** (bloque independiente). La mayoría de los bloques, ventanas emergentes y otros componentes tienen `ctx.resource` vinculado previamente y no requieren llamadas manuales. JSBlock no tiene un recurso por defecto, por lo que debe llamar a `ctx.initResource(type)` antes de cargar datos a través de `ctx.resource`.

## Definición de tipo

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `type` | `string` | Tipo de recurso: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Valor de retorno**: La instancia del recurso en el contexto actual (es decir, `ctx.resource`).

## Diferencia con ctx.makeResource()

| Método | Comportamiento |
|--------|----------------|
| `ctx.initResource(type)` | Crea y vincula si `ctx.resource` no existe; devuelve el existente si ya existe. Garantiza que `ctx.resource` esté disponible. |
| `ctx.makeResource(type)` | Solo crea y devuelve una nueva instancia, **no** escribe en `ctx.resource`. Adecuado para escenarios que requieren múltiples recursos independientes o uso temporal. |

## Ejemplos

### Datos de lista (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Registro único (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Especificar clave primaria
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Especificar fuente de datos

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Notas

- En la mayoría de los escenarios de bloques (formularios, tablas, detalles, etc.) y ventanas emergentes, `ctx.resource` ya está vinculado previamente por el entorno de ejecución, por lo que no es necesario llamar a `ctx.initResource`.
- La inicialización manual solo es necesaria en contextos como JSBlock, donde no hay un recurso por defecto.
- Después de la inicialización, debe llamar a `setResourceName(name)` para especificar la colección y luego llamar a `refresh()` para cargar los datos.

## Relacionado

- [ctx.resource](./resource.md) — La instancia del recurso en el contexto actual
- [ctx.makeResource()](./make-resource.md) — Crea una nueva instancia de recurso sin vincularla a `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Múltiples registros/Lista
- [SingleRecordResource](../resource/single-record-resource.md) — Registro único
- [APIResource](../resource/api-resource.md) — Recurso de API general
- [SQLResource](../resource/sql-resource.md) — Recurso de consulta SQL