:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/fields/specific/sub-table-popup).
:::

# Subtabla (edición en ventana emergente)

## Introducción

La subtabla (edición en ventana emergente) se utiliza para gestionar múltiples datos de asociación (como uno a muchos o muchos a muchos) dentro de un formulario. La tabla solo muestra los registros asociados actualmente. La adición o edición de registros se realiza en una ventana emergente, y los datos se envían a la base de datos de forma conjunta cuando se envía el formulario principal.

## Instrucciones de uso

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Escenarios de aplicación:**

- Campos de asociación: O2M / M2M / MBM
- Usos típicos: Detalles de pedidos, listas de subelementos, etiquetas/miembros asociados, etc.

## Configuración del campo

### Permitir seleccionar datos existentes (Predeterminado: Activado)

Permite seleccionar asociaciones a partir de registros ya existentes.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Componente de campo

[Componente de campo](/interface-builder/fields/association-field): Cambie a otros componentes de campo de relación, como selección simple, selector de colección, etc.

### Permitir desvincular datos existentes (Predeterminado: Activado)

> Controla si se permite desvincular los datos ya asociados en el formulario de edición. Los datos recién añadidos siempre se pueden eliminar.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Permitir añadir (Predeterminado: Activado)

Controla si se muestra el botón "Añadir". Si el usuario no tiene permisos de creación (`create`) para la colección de destino, el botón se deshabilitará y mostrará un aviso de falta de permisos.

### Permitir edición rápida (Predeterminado: Desactivado)

Cuando está activado, al pasar el ratón sobre una celda aparecerá un icono de edición que permite modificar rápidamente el contenido de la misma.

Puede activar la edición rápida para todos los campos a través de la configuración del componente de campo de asociación.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

También se puede activar para campos de columna individuales.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Tamaño de página (Predeterminado: 10)

Establece el número de registros que se muestran por página en la subtabla.

## Notas de comportamiento

- Al seleccionar registros existentes, se realiza una eliminación de duplicados basada en la clave primaria para evitar que el mismo registro se asocie varias veces.
- Los registros recién añadidos se completan directamente en la subtabla y la vista salta automáticamente a la página que contiene el nuevo registro.
- La edición en línea solo modifica los datos de la fila actual.
- Eliminar un registro solo desvincula la asociación dentro del formulario actual; no elimina los datos de origen de la base de datos.
- Los datos se guardan en la base de datos de forma unificada solo cuando se envía el formulario principal.