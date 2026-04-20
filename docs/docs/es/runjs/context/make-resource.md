:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Crea** y devuelve una nueva instancia de resource **sin** escribir ni modificar `ctx.resource`. Es adecuado para escenarios que requieren múltiples recursos independientes o un uso temporal.

## Casos de uso

| Escenario | Descripción |
|------|------|
| **Múltiples recursos** | Carga de múltiples fuentes de datos simultáneamente (por ejemplo, lista de usuarios + lista de pedidos), utilizando un recurso independiente para cada una. |
| **Consultas temporales** | Consultas de un solo uso que se descartan después de utilizarse, sin necesidad de vincularlas a `ctx.resource`. |
| **Datos auxiliares** | Uso de `ctx.resource` para los datos principales y `makeResource` para crear instancias de datos adicionales. |

Si solo necesita un único recurso y desea vincularlo a `ctx.resource`, es más apropiado utilizar [ctx.initResource()](./init-resource.md).

## Definición de tipos

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parámetro | Tipo | Descripción |
|------|------|------|
| `resourceType` | `string` | Tipo de recurso: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Valor de retorno**: La instancia de recurso recién creada.

## Diferencia con ctx.initResource()

| Método | Comportamiento |
|------|------|
| `ctx.makeResource(type)` | Solo crea y devuelve una nueva instancia, **no** escribe en `ctx.resource`. Puede llamarse varias veces para obtener múltiples recursos independientes. |
| `ctx.initResource(type)` | Crea y vincula si `ctx.resource` no existe; lo devuelve directamente si ya existe. Garantiza que `ctx.resource` esté disponible. |

## Ejemplos

### Un solo recurso

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource conserva su valor original (si lo tiene)
```

### Múltiples recursos

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Número de usuarios: {usersRes.getData().length}</p>
    <p>Número de pedidos: {ordersRes.getData().length}</p>
  </div>
);
```

### Consulta temporal

```ts
// Consulta de un solo uso, no contamina ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Notas

- El recurso recién creado debe llamar a `setResourceName(name)` para especificar la colección y luego cargar los datos mediante `refresh()`.
- Cada instancia de recurso es independiente y no afecta a las demás; es adecuada para cargar múltiples fuentes de datos en paralelo.

## Relacionado

- [ctx.initResource()](./init-resource.md): Inicializa y vincula a `ctx.resource`
- [ctx.resource](./resource.md): La instancia de recurso en el contexto actual
- [MultiRecordResource](../resource/multi-record-resource) — Múltiples registros/Lista
- [SingleRecordResource](../resource/single-record-resource) — Un solo registro
- [APIResource](../resource/api-resource) — Recurso de API general
- [SQLResource](../resource/sql-resource) — Recurso de consulta SQL