---
pkg: '@nocobase/plugin-record-history'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Historial de Registros

## Introducción

El **plugin** de **Historial de Registros** rastrea los cambios en los datos, guardando automáticamente instantáneas y diferencias de las operaciones de creación, actualización y eliminación. Esto le ayuda a revisar rápidamente las modificaciones de los datos y a auditar las actividades operativas.

![](https://static-docs.nocobase.com/202511011338499.png)

## Habilitar el Historial de Registros

### Añadir Colecciones y Campos

Primero, diríjase a la página de configuración del **plugin** de Historial de Registros para añadir las **colecciones** y los campos de los que desea registrar el historial. Para mejorar la eficiencia del registro y evitar la redundancia de datos, le recomendamos configurar solo las **colecciones** y campos esenciales. Campos como el **ID único**, `createdAt`, `updatedAt`, `createdBy` y `updatedBy` normalmente no necesitan ser registrados.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Sincronizar Instantáneas de Datos Históricos

- Para los registros creados antes de habilitar el historial, los cambios solo se registrarán después de que la primera actualización genere una instantánea; por lo tanto, la actualización o eliminación inicial no se registrará.
- Si necesita conservar el historial de datos existentes, puede realizar una sincronización única de instantáneas.
- El tamaño de la instantánea por **colección** se calcula como: número de registros × número de campos a registrar.
- Si el volumen de datos es grande, le recomendamos filtrar por alcance de datos y sincronizar solo los registros importantes.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Haga clic en el botón **“Sincronizar Instantáneas Históricas”**, configure los campos y el alcance de los datos, y podrá iniciar la sincronización.

![](https://static-docs.nocobase.com/202511011320958.png)

La tarea de sincronización se pondrá en cola y se ejecutará en segundo plano. Puede actualizar la lista para verificar su estado de finalización.

## Usar el Bloque de Historial de Registros

### Añadir un Bloque

Seleccione el **Bloque de Historial de Registros** y elija una **colección** para añadir el bloque de historial correspondiente a su página.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

Si está añadiendo un bloque de historial dentro de una ventana emergente de detalles de un registro, puede seleccionar **“Registro Actual”** para mostrar el historial específico de ese registro.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Editar Plantillas de Descripción

Haga clic en **“Editar Plantilla”** en la configuración del bloque para configurar el texto de descripción de los registros de operaciones.

![](https://static-docs.nocobase.com/202511011340406.png)

Actualmente, puede configurar plantillas de descripción separadas para las operaciones de **creación**, **actualización** y **eliminación**. Para las operaciones de actualización, también puede configurar la plantilla de descripción para los cambios de campo, ya sea como una plantilla única para todos los campos o para campos específicos individualmente.

![](https://static-docs.nocobase.com/202511011346400.png)

Se pueden usar variables al configurar el texto.

![](https://static-docs.nocobase.com/202511011347163.png)

Una vez configurado, puede elegir aplicar la plantilla a **Todos los bloques de historial de registros de la colección actual** o **Solo a este bloque de historial de registros**.

![](https://static-docs.nocobase.com/202511011348885.png)