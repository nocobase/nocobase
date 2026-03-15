:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/on).
:::

# ctx.on()

Suscríbase a eventos de contexto (como cambios en el valor de los campos, cambios de propiedades, actualizaciones de recursos, etc.) en RunJS. Los eventos se mapean a eventos DOM personalizados en `ctx.element` o al bus de eventos interno de `ctx.resource` según su tipo.

## Escenarios de uso

| Escenario | Descripción |
|------|------|
| **JSField / JSEditableField** | Escuche los cambios en el valor de los campos desde fuentes externas (formularios, vinculaciones, etc.) para actualizar la interfaz de usuario de forma sincrónica, logrando una vinculación bidireccional. |
| **JSBlock / JSItem / JSColumn** | Escuche eventos personalizados en el contenedor para responder a cambios de datos o de estado. |
| **Relacionado con resource** | Escuche eventos del ciclo de vida del recurso, como actualización o guardado, para ejecutar lógica después de la actualización de los datos. |

## Definición de tipo

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Eventos comunes

| Nombre del evento | Descripción | Fuente del evento |
|--------|------|----------|
| `js-field:value-change` | Valor del campo modificado externamente (por ejemplo, vinculación de formulario, actualización de valor por defecto) | CustomEvent en `ctx.element`, donde `ev.detail` es el nuevo valor |
| `resource:refresh` | Los datos del recurso se han actualizado | Bus de eventos de `ctx.resource` |
| `resource:saved` | Guardado del recurso completado | Bus de eventos de `ctx.resource` |

> Reglas de mapeo de eventos: Los eventos con el prefijo `resource:` pasan por `ctx.resource.on`, mientras que los demás suelen pasar por eventos DOM en `ctx.element` (si existe).

## Ejemplos

### Vinculación bidireccional de campos (React useEffect + Limpieza)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Escucha de DOM nativo (Alternativa cuando ctx.on no está disponible)

```ts
// Cuando ctx.on no está disponible, puede usar ctx.element directamente
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Durante la limpieza: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Actualización de la interfaz de usuario tras la actualización del recurso

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Actualizar el renderizado basado en los datos
});
```

## Coordinación con ctx.off

- Los escuchadores registrados mediante `ctx.on` deben eliminarse en el momento adecuado a través de [ctx.off](./off.md) para evitar fugas de memoria o activaciones duplicadas.
- En React, `ctx.off` se llama habitualmente dentro de la función de limpieza de `useEffect`.
- `ctx.off` podría no existir; se recomienda utilizar el encadenamiento opcional: `ctx.off?.('eventName', handler)`.

## Notas

1. **Cancelación emparejada**: Cada `ctx.on(eventName, handler)` debe tener un `ctx.off(eventName, handler)` correspondiente, y la referencia del `handler` pasada debe ser idéntica.
2. **Ciclo de vida**: Elimine los escuchadores antes de que el componente se desmonte o el contexto se destruya para evitar fugas de memoria.
3. **Disponibilidad de eventos**: Los diferentes tipos de contexto admiten eventos distintos. Consulte la documentación específica de cada componente para obtener más detalles.

## Documentación relacionada

- [ctx.off](./off.md) - Eliminar escuchadores de eventos
- [ctx.element](./element.md) - Contenedor de renderizado y eventos DOM
- [ctx.resource](./resource.md) - Instancia de recurso y sus métodos `on`/`off`
- [ctx.setValue](./set-value.md) - Establecer el valor del campo (activa `js-field:value-change`)