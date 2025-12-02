---
pkg: "@nocobase/plugin-action-export-pro"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Exportar Archivos Adjuntos

## Introducción

La exportación de archivos adjuntos permite exportar los campos relacionados con archivos adjuntos en formato de paquete comprimido.

#### Configuración de Exportación de Archivos Adjuntos

![20251029173251](https://static-docs.nocobase.com/20251029173251.png)

![20251029173425](https://static-docs.nocobase.com/20251029173425.png)

![20251029173345](https://static-docs.nocobase.com/20251029173345.png)

- Configure los campos de archivos adjuntos que desea exportar; se admite la selección múltiple.
- Puede elegir si desea generar una carpeta para cada registro.

Reglas de nomenclatura de archivos:

- Si elige generar una carpeta para cada registro, la regla de nomenclatura de archivos es: `{valor del campo de título del registro}/{nombre del campo de archivo adjunto}[-{número de secuencia del archivo}].{extensión del archivo}`.
- Si elige no generar una carpeta, la regla de nomenclatura de archivos es: `{valor del campo de título del registro}-{nombre del campo de archivo adjunto}[-{número de secuencia del archivo}].{extensión del archivo}`.

El número de secuencia del archivo se genera automáticamente cuando un campo de archivo adjunto contiene múltiples archivos adjuntos.

- [Regla de Vinculación](/interface-builder/actions/action-settings/linkage-rule): Muestra/oculta el botón dinámicamente;
- [Editar Botón](/interface-builder/actions/action-settings/edit-button): Edite el título, tipo e icono del botón;