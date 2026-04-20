:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/form).
:::

# ctx.form

La instancia de Ant Design Form dentro del bloque actual, utilizada para leer y escribir campos del formulario, activar la validación y realizar el envío. Es equivalente a `ctx.blockModel?.form` y se puede utilizar directamente en bloques relacionados con formularios (Formulario, Formulario de edición, subformularios, etc.).

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSField** | Leer/escribir otros campos del formulario para implementar vinculaciones (linkage), o realizar cálculos y validaciones basados en otros valores de campos. |
| **JSItem** | Leer/escribir campos de la misma fila u otros campos dentro de elementos de una subtabla para lograr vinculaciones dentro de la tabla. |
| **JSColumn** | Leer los valores de la fila actual o de campos asociados en una columna de tabla para su renderización. |
| **Acciones de formulario / Flujo de eventos** | Validación previa al envío, actualización masiva de campos, restablecimiento de formularios, etc. |

> Nota: `ctx.form` solo está disponible en contextos de RunJS relacionados con bloques de formulario (Formulario, Formulario de edición, subformularios, etc.). Es posible que no esté presente en escenarios que no sean de formulario (como bloques JS independientes o bloques de tabla). Se recomienda realizar una comprobación de valor nulo antes de su uso: `ctx.form?.getFieldsValue()`.

## Definición de tipo

```ts
form: FormInstance<any>;
```

`FormInstance` es el tipo de instancia de Ant Design Form. Los métodos comunes son los siguientes.

## Métodos comunes

### Lectura de valores del formulario

```ts
// Leer valores de los campos registrados actualmente (por defecto solo campos renderizados)
const values = ctx.form.getFieldsValue();

// Leer valores de todos los campos (incluyendo campos registrados pero no renderizados, ej. ocultos o en secciones colapsadas)
const allValues = ctx.form.getFieldsValue(true);

// Leer un solo campo
const email = ctx.form.getFieldValue('email');

// Leer campos anidados (ej. en una subtabla)
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### Escritura de valores del formulario

```ts
// Actualización masiva (comúnmente utilizada para vinculaciones)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// Actualizar un solo campo
ctx.form.setFieldValue('remark', 'Comentario actualizado');
```

### Validación y envío

```ts
// Activar la validación del formulario
await ctx.form.validateFields();

// Activar el envío del formulario
ctx.form.submit();
```

### Restablecer

```ts
// Restablecer todos los campos
ctx.form.resetFields();

// Restablecer solo campos específicos
ctx.form.resetFields(['status', 'remark']);
```

## Relación con otros contextos

### ctx.getValue / ctx.setValue

| Escenario | Uso recomendado |
|------|----------|
| **Leer/escribir el campo actual** | `ctx.getValue()` / `ctx.setValue(v)` |
| **Leer/escribir otros campos** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

Dentro del campo JS actual, priorice el uso de `getValue`/`setValue` para leer o escribir el propio campo; use `ctx.form` cuando necesite acceder a otros campos.

### ctx.blockModel

| Requisito | Uso recomendado |
|------|----------|
| **Leer/escribir campos de formulario** | `ctx.form` (Equivalente a `ctx.blockModel?.form`, más conveniente) |
| **Acceder al bloque padre** | `ctx.blockModel` (Contiene `colección`, `recurso`, etc.) |

### ctx.getVar('ctx.formValues')

Los valores del formulario deben obtenerse a través de `await ctx.getVar('ctx.formValues')` y no se exponen directamente como `ctx.formValues`. En un contexto de formulario, es preferible usar `ctx.form.getFieldsValue()` para leer los valores más recientes en tiempo real.

## Notas

- `getFieldsValue()` devuelve solo los campos renderizados por defecto. Para incluir campos no renderizados (ej. en secciones colapsadas u ocultos por reglas condicionales), pase `true`: `getFieldsValue(true)`.
- Las rutas para campos anidados como subtablas son arreglos (arrays), ej. `['orders', 0, 'amount']`. Puede usar `ctx.namePath` para obtener la ruta del campo actual y construir rutas para otras columnas en la misma fila.
- `validateFields()` lanza un objeto de error que contiene `errorFields` y otra información. Si la validación falla antes del envío, puede usar `ctx.exit()` para terminar los pasos posteriores.
- En escenarios asíncronos como flujos de trabajo o reglas de vinculación, es posible que `ctx.form` aún no esté listo. Se recomienda usar el encadenamiento opcional (optional chaining) o comprobaciones de nulos.

## Ejemplos

### Vinculación de campos: Mostrar contenido diferente según el tipo

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### Calcular el campo actual basado en otros campos

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### Leer/escribir otras columnas en la misma fila dentro de una subtabla

```ts
// ctx.namePath es la ruta del campo actual en el formulario, ej. ['orders', 0, 'amount']
// Leer 'status' en la misma fila: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### Validación previa al envío

```ts
try {
  await ctx.form.validateFields();
  // La validación pasó, continuar con la lógica de envío
} catch (e) {
  ctx.message.error('Por favor, verifique los campos del formulario');
  ctx.exit();
}
```

### Envío tras confirmación

```ts
const confirmed = await ctx.modal.confirm({
  title: 'Confirmar envío',
  content: 'No podrá modificar esto después del envío. ¿Continuar?',
  okText: 'Confirmar',
  cancelText: 'Cancelar',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // Terminar si el usuario cancela
}
```

## Relacionado

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): Leer y escribir el valor del campo actual.
- [ctx.blockModel](./block-model.md): Modelo del bloque padre; `ctx.form` es equivalente a `ctx.blockModel?.form`.
- [ctx.modal](./modal.md): Diálogos de confirmación, a menudo usados con `ctx.form.validateFields()` y `ctx.form.submit()`.
- [ctx.exit()](./exit.md): Terminar el proceso ante un fallo de validación o cancelación del usuario.
- `ctx.namePath`: La ruta (arreglo) del campo actual en el formulario, utilizada para construir nombres para `getFieldValue` / `setFieldValue` en campos anidados.