:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Previsualizar y Guardar

*   **Previsualizar**: Muestra temporalmente los cambios realizados en el panel de configuración en el gráfico de la página para verificar el resultado.
*   **Guardar**: Guarda de forma permanente los cambios del panel de configuración en la base de datos.

## Puntos de Acceso

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

*   En el modo de configuración visual (Básico), los cambios se aplican automáticamente a la previsualización por defecto.
*   En los modos SQL y Custom, haga clic en el botón **Previsualizar** a la derecha para aplicar los cambios a la previsualización.
*   En la parte inferior del panel de configuración, encontrará un botón unificado de **Previsualizar**.

## Comportamiento de la Previsualización
*   Muestra temporalmente la configuración en la página, pero no la guarda en la base de datos. Después de actualizar la página o cancelar la operación, el resultado de la previsualización no se conserva.
*   **Antirrebote integrado**: Si se activan múltiples actualizaciones en un corto período, solo se ejecuta la última para evitar solicitudes frecuentes.
*   Al hacer clic en **Previsualizar** de nuevo, se sobrescribe el resultado de la previsualización anterior.

## Mensajes de Error
*   **Errores de consulta o fallos de validación**: Se muestran en el área de **Ver datos**.
*   **Errores de configuración del gráfico** (falta de mapeo Básico, errores en Custom JS): Se muestran en el área del gráfico o en la consola, manteniendo la página operativa.
*   Confirme los nombres de las columnas y los tipos de datos en **Ver datos** antes de realizar el mapeo de campos o escribir código Custom, esto ayudará a reducir los errores de manera efectiva.

## Guardar y Cancelar
*   **Guardar**: Escribe los cambios actuales en la configuración del bloque y los aplica inmediatamente a la página.
*   **Cancelar**: Descarta los cambios no guardados del panel actual y revierte al último estado guardado.
*   **Alcance del guardado**:
    *   **Consulta de datos**: Parámetros del Builder; en el modo SQL, también se guarda el texto SQL.
    *   **Opciones del gráfico**: Tipo Básico, mapeo de campos y propiedades; texto JS de Custom.
    *   **Eventos de interacción**: Texto JS y lógica de vinculación de eventos.
*   Después de guardar, el bloque surte efecto para todos los visitantes (sujeto a la configuración de permisos de la página).

## Flujo de Operación Recomendado
*   Configure la consulta de datos → Ejecute la consulta → **Ver datos** para confirmar los nombres y tipos de las columnas → Configure las opciones del gráfico para mapear los campos principales → Previsualice para validar → Guarde para aplicar los cambios.