---
pkg: "@nocobase/plugin-action-bulk-update"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Actualización Masiva

## Introducción

La acción de actualización masiva se utiliza cuando necesita aplicar la misma actualización a un grupo de registros. Antes de realizar una actualización masiva, usted debe definir previamente la lógica de asignación de campos para la actualización. Esta lógica se aplicará a todos los registros seleccionados cuando haga clic en el botón de actualizar.

![20251029195320](https://static-docs.nocobase.com/20251029195320.png)

## Configuración de la Acción

![20251029195729](https://static-docs.nocobase.com/20251029195729.png)

### Datos a actualizar

Seleccionados/Todos, por defecto es Seleccionados.

![20251029200034](https://static-docs.nocobase.com/20251029200034.png)

### Asignación de campos

Configure los campos para la actualización masiva. Solo se actualizarán los campos que usted defina.

Como se muestra en la imagen, configure la acción de actualización masiva en la tabla de pedidos para actualizar masivamente los datos seleccionados a «Pendiente de aprobación».

![20251029200109](https://static-docs.nocobase.com/20251029200109.png)

- [Editar botón](/interface-builder/actions/action-settings/edit-button): Edite el título, el tipo y el icono del botón;
- [Regla de vinculación](/interface-builder/actions/action-settings/linkage-rule): Muestre/oculte el botón dinámicamente;
- [Doble confirmación](/interface-builder/actions/action-settings/double-check)