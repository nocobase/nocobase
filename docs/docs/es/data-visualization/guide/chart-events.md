:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Eventos de interacción personalizados

Escriba código JavaScript en el editor de eventos y registre interacciones a través de la instancia de ECharts `chart` para habilitar la vinculación. Por ejemplo, puede navegar a una nueva página o abrir un diálogo para un análisis más detallado (drill-down).

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Registro y anulación de eventos
- Registrar: `chart.on(eventName, handler)`
- Anular registro: `chart.off(eventName, handler)` o `chart.off(eventName)` para limpiar eventos por nombre.

**Nota:**
Por motivos de seguridad, ¡se recomienda encarecidamente anular el registro de un evento antes de volver a registrarlo!

## Estructura de datos de los parámetros `params` de la función `handler`

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Los campos comunes incluyen `params.data` y `params.name`.

## Ejemplo: Clic para resaltar una selección
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Resaltar el punto de datos actual
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Desactivar el resaltado de otros
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Ejemplo: Clic para navegar a una página
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Opción 1: Navegación interna sin recarga completa de la página (recomendado), solo necesita la ruta relativa
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Opción 2: Navegar a una página externa, se requiere la URL completa
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Opción 3: Abrir una página externa en una nueva pestaña, se requiere la URL completa
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Ejemplo: Clic para abrir un diálogo de detalles (análisis drill-down)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // registrar variables de contexto para el nuevo diálogo
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

En el diálogo recién abierto, utilice las variables de contexto declaradas en el gráfico a través de `ctx.view.inputArgs.XXX`.

## Previsualizar y guardar
- Haga clic en "Previsualizar" para cargar y ejecutar el código del evento.
- Haga clic en "Guardar" para conservar la configuración actual del evento.
- Haga clic en "Cancelar" para volver al último estado guardado.

**Recomendaciones:**
- Utilice siempre `chart.off('event')` antes de vincular un evento para evitar ejecuciones duplicadas o un aumento del uso de memoria.
- Dentro de los manejadores de eventos, utilice operaciones ligeras (por ejemplo, `dispatchAction`, `setOption`) para evitar bloquear el proceso de renderizado.
- Valide con las opciones del gráfico y las consultas de datos para asegurarse de que los campos manejados en el evento sean consistentes con los datos actuales.