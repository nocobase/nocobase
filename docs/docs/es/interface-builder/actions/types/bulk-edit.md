---
pkg: "@nocobase/plugin-action-bulk-edit"
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/actions/types/bulk-edit).
:::

# Edición masiva

## Introducción

La edición masiva es adecuada para escenarios que requieren actualizaciones por lotes de datos de manera flexible. Después de hacer clic en el botón de edición masiva, usted puede configurar el formulario de edición masiva en una ventana emergente y establecer diferentes estrategias de actualización para cada campo.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM.png)


## Configuración de la acción

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM%20(1).png)


## Guía de uso

### Configuración del formulario de edición masiva

1. Añada un botón de edición masiva.

2. Establezca el alcance de la edición masiva: Seleccionados / Todos; por defecto es Seleccionados.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_14_AM.png)

3. Añada un formulario de edición masiva.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_14_AM.png)

4. Configure los campos que desea editar y añada un botón de envío.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM%20(1).png)

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM.png)

### Envío del formulario

1. Seleccione las filas de datos que desea editar.

2. Seleccione el modo de edición para los campos y complete los valores que se enviarán.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_10_33_AM.png)

:::info{title="Modos de edición disponibles"}
* **No actualizar**: El campo permanece sin cambios.
* **Cambiar a**: Actualiza el campo con el valor enviado.
* **Limpiar**: Borra los datos del campo.

:::

3. Envíe el formulario.