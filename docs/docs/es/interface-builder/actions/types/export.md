---
pkg: "@nocobase/plugin-action-export"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Exportar

## Introducción

La función de exportación le permite exportar registros filtrados en formato **Excel** y configurar los campos a exportar. Usted puede seleccionar los campos que necesita para su posterior análisis, procesamiento o archivo de datos. Esta función mejora la flexibilidad de las operaciones con datos, especialmente en escenarios donde los datos necesitan ser transferidos a otras plataformas o procesados adicionalmente.

### Características destacadas:
- **Selección de campos**: Usted puede configurar y seleccionar los campos a exportar, asegurando que los datos exportados sean precisos y concisos.
- **Soporte de formato Excel**: Los datos exportados se guardarán como un archivo Excel estándar, facilitando su integración y análisis con otros datos.

Con esta función, usted puede exportar fácilmente datos clave de su trabajo para uso externo, mejorando la eficiencia laboral.

![20251029170811](https://static-docs.nocobase.com/20251029170811.png)

## Configuración de la acción

![20251029171452](https://static-docs.nocobase.com/20251029171452.png)

### Campos exportables

- Primer nivel: Todos los campos de la colección actual;
- Segundo nivel: Si es un campo de relación, necesita seleccionar campos de la colección asociada;
- Tercer nivel: Solo se procesan tres niveles; los campos de relación del último nivel no se muestran;

![20251029171557](https://static-docs.nocobase.com/20251029171557.png)

- [Regla de vinculación](/interface-builder/actions/action-settings/linkage-rule): Muestra/oculta el botón dinámicamente;
- [Editar botón](/interface-builder/actions/action-settings/edit-button): Edite el título, el tipo y el icono del botón;