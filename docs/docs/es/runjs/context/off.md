:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/off).
:::

# ctx.off()

Elimina los escuchadores de eventos registrados a través de `ctx.on(eventName, handler)`. Se utiliza frecuentemente en conjunto con [ctx.on](./on.md) para cancelar la suscripción en el momento adecuado, evitando fugas de memoria o activaciones duplicadas.

## Casos de uso

| Escenario | Descripción |
|------|------|
| **Limpieza en useEffect de React** | Se llama dentro de la función de limpieza de `useEffect` para eliminar los escuchadores cuando el componente se desmonta. |
| **JSField / JSEditableField** | Cancela la suscripción a `js-field:value-change` durante la vinculación bidireccional de datos de los campos. |
| **Relacionado con recursos (resource)** | Cancela la suscripción a escuchadores como `refresh` o `saved` registrados a través de `ctx.resource.on`. |

## Definición de tipos

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Ejemplos

### Uso conjunto en useEffect de React

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Cancelación de suscripción a eventos de recursos

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// En el momento adecuado
ctx.resource?.off('refresh', handler);
```

## Notas importantes

1. **Referencia consistente del handler**: El `handler` pasado a `ctx.off` debe ser la misma referencia que la utilizada en `ctx.on`; de lo contrario, no podrá eliminarse correctamente.
2. **Limpieza oportuna**: Llame a `ctx.off` antes de que el componente se desmonte o el contexto se destruya para evitar fugas de memoria.

## Documentación relacionada

- [ctx.on](./on.md) - Suscribirse a eventos
- [ctx.resource](./resource.md) - Instancia de recurso y sus métodos `on`/`off`