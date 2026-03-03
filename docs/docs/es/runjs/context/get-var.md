:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/get-var).
:::

# ctx.getVar()

Lee de forma **asíncrona** el valor de una variable desde el contexto de ejecución actual. La resolución de variables es consistente con el análisis de `{{ctx.xxx}}` en SQL y plantillas, proviniendo generalmente del usuario actual, el registro actual, parámetros de vista, contexto de ventanas emergentes, etc.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSBlock / JSField** | Obtener información sobre el registro actual, usuario, recursos, etc., para renderizado o lógica. |
| **Reglas de enlace / Flujo de trabajo** | Leer `ctx.record`, `ctx.formValues`, etc., para evaluar condiciones lógicas. |
| **Fórmulas / Plantillas** | Utiliza las mismas reglas de resolución de variables que `{{ctx.xxx}}`. |

## Definición de tipos

```ts
getVar(path: string): Promise<any>;
```

| Parámetro | Tipo | Descripción |
|------|------|------|
| `path` | `string` | Ruta de la variable; **debe comenzar con `ctx.`**. Admite notación de puntos e índices de arreglos. |

**Valor de retorno**: `Promise<any>`. Debe usar `await` para obtener el valor resuelto; devuelve `undefined` si la variable no existe.

> Si se pasa una ruta que no comienza con `ctx.`, se lanzará un error: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## Rutas de variables comunes

| Ruta | Descripción |
|------|------|
| `ctx.record` | Registro actual (disponible cuando un bloque de formulario/detalles está vinculado a un registro) |
| `ctx.record.id` | Clave primaria del registro actual |
| `ctx.formValues` | Valores actuales del formulario (común en reglas de enlace y flujos de trabajo; en escenarios de formulario, se prefiere `ctx.form.getFieldsValue()` para lectura en tiempo real) |
| `ctx.user` | Usuario actual con sesión iniciada |
| `ctx.user.id` | ID del usuario actual |
| `ctx.user.nickname` | Apodo del usuario actual |
| `ctx.user.roles.name` | Nombres de los roles del usuario actual (arreglo) |
| `ctx.popup.record` | Registro dentro de una ventana emergente |
| `ctx.popup.record.id` | Clave primaria del registro dentro de una ventana emergente |
| `ctx.urlSearchParams` | Parámetros de consulta de la URL (analizados desde `?key=value`) |
| `ctx.token` | Token de API actual |
| `ctx.role` | Rol actual |

## ctx.getVarInfos()

Obtiene la **información estructural** (tipo, título, subpropiedades, etc.) de las variables resolubles en el contexto actual, facilitando la exploración de las rutas disponibles. El valor devuelto es una descripción estática basada en `meta` y no incluye los valores reales de ejecución.

### Definición de tipos

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

En el valor de retorno, cada clave es una ruta de variable y el valor es la información estructural de esa ruta (incluyendo `type`, `title`, `properties`, etc.).

### Parámetros

| Parámetro | Tipo | Descripción |
|------|------|------|
| `path` | `string \| string[]` | Ruta de recorte; solo recopila la estructura de variables bajo esta ruta. Admite `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`; un arreglo representa la combinación de múltiples rutas. |
| `maxDepth` | `number` | Nivel máximo de expansión, por defecto `3`. Cuando no se proporciona `path`, las propiedades de nivel superior tienen `depth=1`. Cuando se proporciona `path`, el nodo correspondiente a la ruta tiene `depth=1`. |

### Ejemplo

```ts
// Obtener la estructura de variables bajo record (expandido hasta 3 niveles)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// Obtener la estructura de popup.record
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// Obtener la estructura completa de variables de nivel superior (maxDepth=3 por defecto)
const vars = await ctx.getVarInfos();
```

## Diferencia con ctx.getValue

| Método | Escenario | Descripción |
|------|----------|------|
| `ctx.getValue()` | Campos editables como JSField o JSItem | Obtiene de forma síncrona el valor del **campo actual**; requiere vinculación al formulario. |
| `ctx.getVar(path)` | Cualquier contexto de RunJS | Obtiene de forma asíncrona **cualquier variable de ctx**; la ruta debe comenzar con `ctx.`. |

En un JSField, use `getValue`/`setValue` para leer o escribir el campo actual; use `getVar` para acceder a otras variables de contexto (como `record`, `user`, `formValues`).

## Notas

- **La ruta debe comenzar con `ctx.`**: por ejemplo, `ctx.record.id`, de lo contrario se lanzará un error.
- **Método asíncrono**: Debe usar `await` para obtener el resultado, por ejemplo, `const id = await ctx.getVar('ctx.record.id')`.
- **Variable inexistente**: Devuelve `undefined`. Puede usar `??` después del resultado para establecer un valor predeterminado: `(await ctx.getVar('ctx.user.nickname')) ?? 'Invitado'`.
- **Valores de formulario**: `ctx.formValues` debe obtenerse mediante `await ctx.getVar('ctx.formValues')`; no se expone directamente como `ctx.formValues`. En un contexto de formulario, prefiera usar `ctx.form.getFieldsValue()` para leer los valores más recientes en tiempo real.

## Ejemplos

### Obtener el ID del registro actual

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`Registro actual: ${recordId}`);
}
```

### Obtener un registro dentro de una ventana emergente

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`Registro de la ventana emergente actual: ${recordId}`);
}
```

### Leer subelementos de un campo de tipo arreglo

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// Devuelve un arreglo de nombres de roles, p. ej., ['admin', 'member']
```

### Establecer un valor predeterminado

```ts
// getVar no tiene un parámetro defaultValue; use ?? después del resultado
const userName = (await ctx.getVar('ctx.user.nickname')) ?? 'Invitado';
```

### Leer valores de campos de formulario

```ts
// Tanto ctx.formValues como ctx.form son para escenarios de formulario; use getVar para leer campos anidados
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### Leer parámetros de consulta de la URL

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // Corresponde a ?id=xxx
```

### Explorar variables disponibles

```ts
// Obtener la estructura de variables bajo record (expandido hasta 3 niveles)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars se ve como { 'record.id': { type: 'string', title: 'id' }, ... }
```

## Relacionado

- [ctx.getValue()](./get-value.md) - Obtiene de forma síncrona el valor del campo actual (solo JSField/JSItem)
- [ctx.form](./form.md) - Instancia del formulario; `ctx.form.getFieldsValue()` puede leer valores del formulario en tiempo real
- [ctx.model](./model.md) - El modelo donde reside el contexto de ejecución actual
- [ctx.blockModel](./block-model.md) - El bloque padre donde se encuentra el JS actual
- [ctx.resource](./resource.md) - La instancia del recurso en el contexto actual
- `{{ctx.xxx}}` en SQL / Plantillas - Utiliza las mismas reglas de resolución que `ctx.getVar('ctx.xxx')`