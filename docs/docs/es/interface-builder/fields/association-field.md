:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Componentes de Campo de Relación

## Introducción

Los componentes de campo de relación de NocoBase están diseñados para ayudarle a mostrar y gestionar mejor los datos asociados. Independientemente del tipo de relación, estos componentes son flexibles y versátiles, lo que le permite seleccionarlos y configurarlos según sus necesidades específicas.

### Desplegable

Para todos los campos de relación, excepto cuando la colección de destino es una colección de archivos, el componente predeterminado en modo de edición es el desplegable. Las opciones del desplegable muestran el valor del campo de título, lo que lo hace ideal para escenarios donde los datos asociados se pueden seleccionar rápidamente mostrando información clave del campo.

![20240429205659](https://static-docs.nocobase.com/20240429205659.png)

Para más detalles, consulte [Desplegable](/interface-builder/fields/specific/select)

### Selector de datos

El selector de datos presenta la información en una ventana emergente (modal). Usted puede configurar los campos que desea mostrar en el selector (incluyendo campos de relaciones anidadas), lo que le permite una selección más precisa de los datos asociados.

![20240429210824](https://static-docs.nocobase.com/20240429210824.png)

Para más detalles, consulte [Selector de datos](/interface-builder/fields/specific/picker)

### Subformulario

Al trabajar con datos de relación más complejos, el uso de un desplegable o un selector de datos puede resultar poco práctico. En estas situaciones, tendría que abrir ventanas emergentes con frecuencia. Para estos casos, puede utilizar el subformulario. Este le permite mantener directamente los campos de la colección asociada en la página actual o en el bloque de la ventana emergente actual, sin necesidad de abrir repetidamente nuevas ventanas emergentes, lo que agiliza el flujo de trabajo. Las relaciones multinivel se muestran como formularios anidados.

![20251029122948](https://static-docs.nocobase.com/20251029122948.png)

Para más detalles, consulte [Subformulario](/interface-builder/fields/specific/sub-form)

### Subtabla

La subtabla muestra registros de relaciones uno a muchos o muchos a muchos en formato de tabla. Ofrece una forma clara y estructurada de visualizar y gestionar datos asociados, y permite crear nuevos datos en masa o seleccionar datos existentes para asociar.

![20251029123042](https://static-docs.nocobase.com/20251029123042.png)

Para más detalles, consulte [Subtabla](/interface-builder/fields/specific/sub-table)

### Subdetalle

El subdetalle es el componente correspondiente al subformulario en modo de solo lectura. Permite mostrar datos con relaciones multinivel anidadas.

![20251030213050](https://static-docs.nocobase.com/20251030213050.png)

Para más detalles, consulte [Subdetalle](/interface-builder/fields/specific/sub-detail)

### Gestor de archivos

El gestor de archivos es un componente de campo de relación diseñado específicamente para cuando la colección de destino de la relación es una colección de archivos.

![20240429222753](https://static-docs.nocobase.com/20240429222753.png)

Para más detalles, consulte [Gestor de archivos](/interface-builder/fields/specific/file-manager)

### Título

El componente de campo de título es un componente de campo de relación utilizado en modo de solo lectura. Al configurar el campo de título, usted puede configurar el componente de campo correspondiente.

![20251030213327](https://static-docs.nocobase.com/20251030213327.png)

Para más detalles, consulte [Título](/interface-builder/fields/specific/title)