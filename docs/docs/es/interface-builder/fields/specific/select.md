:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Selector Desplegable

## Introducción

El selector desplegable le permite asociar datos seleccionándolos de registros existentes en la **colección** de destino, o añadiendo nuevos datos a la misma para su asociación. Las opciones del desplegable admiten la búsqueda difusa.

![20251029205901](https://static-docs.nocobase.com/20251029205901.png)

## Configuración del Campo

### Establecer Alcance de Datos

Controla el alcance de los datos que se muestran en la lista desplegable.

![20251029210025](https://static-docs.nocobase.com/20251029210025.png)

Para más información, consulte [Establecer Alcance de Datos](/interface-builder/fields/field-settings/data-scope)

### Establecer Reglas de Ordenación

Controla la ordenación de los datos en el selector desplegable.

Ejemplo: Ordenar por fecha de servicio en orden descendente.

![20251029210105](https://static-docs.nocobase.com/20251029210105.png)

### Permitir Añadir/Asociar Múltiples Registros

Restringe una relación de "uno a muchos" para permitir asociar solo un registro.

![20251029210145](https://static-docs.nocobase.com/20251029210145.png)

### Campo de Título

El campo de título es el campo de etiqueta que se muestra en las opciones.

![20251029210507](https://static-docs.nocobase.com/20251029210507.gif)

> Permite la búsqueda rápida basada en el campo de título.

Para más información, consulte [Campo de Título](/interface-builder/fields/field-settings/title-field)

### Creación Rápida: Añadir Primero, Luego Seleccionar

![20251125220046](https://static-docs.nocobase.com/20251125220046.png)

#### Añadir a través del Desplegable

Después de crear un nuevo registro en la **colección** de destino, el sistema lo selecciona automáticamente y lo asocia cuando se envía el formulario.

En el ejemplo siguiente, la **colección** de Pedidos tiene un campo de relación de "muchos a uno" llamado **"Account"**.

![20251125220447](https://static-docs.nocobase.com/20251125220447.gif)

#### Añadir a través de una Ventana Modal

La creación a través de una ventana modal es adecuada para escenarios de entrada de datos más complejos y permite configurar un formulario personalizado para crear nuevos registros.

![20251125220607](https://static-docs.nocobase.com/20251125220607.gif)

[Componente de Campo](/interface-builder/fields/association-field)