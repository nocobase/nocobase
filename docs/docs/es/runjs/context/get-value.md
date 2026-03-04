:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/get-value).
:::

# ctx.getValue()

En escenarios de campos editables como JSField y JSItem, utilice este método para obtener el valor más reciente del campo actual. En combinación con `ctx.setValue(v)`, permite la vinculación bidireccional (two-way binding) con el formulario.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSField** | Lectura de la entrada del usuario o del valor actual del formulario en campos personalizados editables. |
| **JSItem** | Lectura del valor de la celda actual en elementos editables de tablas o subtablas. |
| **JSColumn** | Lectura del valor del campo de la fila correspondiente durante el renderizado de columnas de la tabla. |

> **Nota**: `ctx.getValue()` solo está disponible en contextos de RunJS con vinculación a formularios; no existe en escenarios sin vinculación de campos, como flujos de trabajo o reglas de enlace.

## Definición de tipo

```ts
getValue<T = any>(): T | undefined;
```

- **Valor de retorno**: El valor actual del campo, cuyo tipo está determinado por el tipo de elemento de formulario del campo; puede ser `undefined` si el campo no está registrado o no se ha completado.

## Orden de obtención

`ctx.getValue()` obtiene los valores en el siguiente orden:

1. **Estado del formulario**: Prioriza la lectura del estado actual del Ant Design Form.
2. **Valor de reserva (Fallback)**: Si el campo no está en el formulario, recurre al valor inicial del campo o a las props.

> Si el formulario no ha terminado de renderizarse o el campo no está registrado, puede devolver `undefined`.

## Ejemplos

### Renderizado basado en el valor actual

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>Por favor, ingrese contenido primero</span>);
} else {
  ctx.render(<span>Valor actual: {current}</span>);
}
```

### Vinculación bidireccional con setValue

```tsx
const { Input } = ctx.libs.antd;

// Lee el valor actual como valor por defecto
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## Relacionado

- [ctx.setValue()](./set-value.md) - Establece el valor del campo actual, se usa con `getValue` para la vinculación bidireccional.
- [ctx.form](./form.md) - Instancia de Ant Design Form, para leer o escribir en otros campos.
- `js-field:value-change` - Evento de contenedor que se activa cuando cambian los valores externos, utilizado para actualizar la visualización.