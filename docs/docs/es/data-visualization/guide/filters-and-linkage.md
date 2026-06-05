:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Filtros de página y vinculación

El filtro de página (bloque de filtro) le permite introducir condiciones de filtro de forma unificada a nivel de página y las combina con las consultas de los gráficos. Esto asegura que múltiples gráficos se filtren de manera consistente y estén vinculados entre sí.

## Resumen de características
- Añada un "bloque de filtro" a la página para ofrecer un punto de entrada de filtro unificado para todos los gráficos de la página actual.
- Utilice los botones "Filtrar", "Restablecer" y "Contraer" para aplicar, borrar y ocultar los filtros.
- Si el filtro selecciona campos asociados a un gráfico, sus valores se combinarán automáticamente en la consulta del gráfico, lo que activará una actualización del mismo.
- Los filtros también pueden crear campos personalizados y registrarlos como variables de contexto, de modo que puedan ser referenciados en gráficos, tablas, formularios y otros bloques de datos.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Para obtener más información sobre cómo utilizar los filtros de página y su vinculación con gráficos u otros bloques de datos, consulte la documentación sobre filtros de página.

## Cómo usar los valores de los filtros de página en las consultas de gráficos
- Modo Constructor (recomendado)
  - **Fusión automática:** Cuando la fuente de datos y la colección coinciden, no necesita escribir variables adicionales en la consulta del gráfico; los filtros de página se fusionarán con `$and`.
  - **Selección manual:** También puede seleccionar activamente los valores de los "campos personalizados" del filtro de página en las condiciones de filtro del gráfico.

- Modo SQL (mediante inyección de variables)
  - En las sentencias SQL, utilice "Seleccionar variable" para insertar los valores de los "campos personalizados" del filtro de página.