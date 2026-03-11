:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/set-value).
:::

# ctx.setValue()

Establece el valor del campo actual en escenarios de campos editables como JSField y JSItem. En combinación con `ctx.getValue()`, permite la vinculación bidireccional con el formulario.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSField** | Escribir valores seleccionados por el usuario o calculados en campos personalizados editables. |
| **JSItem** | Actualizar el valor de la celda actual en elementos editables de tablas o subtablas. |
| **JSColumn** | Actualizar el valor del campo de la fila correspondiente según la lógica durante el renderizado de columnas de tabla. |

> **Nota**: `ctx.setValue(v)` solo está disponible en contextos de RunJS con vinculación a formularios. No está disponible en escenarios sin vinculación de campos, como flujos de trabajo, reglas de enlace o JSBlock. Se recomienda utilizar el encadenamiento opcional antes de su uso: `ctx.setValue?.(value)`.

## Definición de tipos

```ts
setValue<T = any>(value: T): void;
```

- **Parámetros**: `value` es el valor del campo que se va a escribir. El tipo está determinado por el tipo de elemento de formulario del campo.

## Comportamiento

- `ctx.setValue(v)` actualiza el valor del campo actual en el formulario de Ant Design y activa la lógica de enlace y validación del formulario relacionada.
- Si el formulario aún no se ha renderizado completamente o el campo no está registrado, es posible que la llamada no sea efectiva. Se recomienda utilizar `ctx.getValue()` para confirmar el resultado de la escritura.

## Ejemplos

### Vinculación bidireccional con getValue

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### Establecer valores predeterminados según condiciones

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### Escritura en el campo actual al vincular con otros campos

```ts
// Actualizar sincrónicamente el campo actual cuando cambia otro campo
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: 'Personalizado', value: 'custom' });
}
```

## Notas

- En campos no editables (por ejemplo, JSField en modo de solo lectura, JSBlock), `ctx.setValue` puede ser `undefined`. Se recomienda usar `ctx.setValue?.(value)` para evitar errores.
- Al establecer valores para campos de asociación (M2O, O2M, etc.), debe pasar una estructura que coincida con el tipo de campo (por ejemplo, `{ id, [titleField]: label }`), dependiendo de la configuración específica del campo.

## Relacionado

- [ctx.getValue()](./get-value.md) - Obtiene el valor del campo actual, se usa con setValue para la vinculación bidireccional.
- [ctx.form](./form.md) - Instancia de Ant Design Form, utilizada para leer o escribir en otros campos.
- `js-field:value-change` - Un evento de contenedor que se activa cuando cambia un valor externo, utilizado para actualizar la visualización.