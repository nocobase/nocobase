---
pkg: "@nocobase/plugin-kanban"
title: "Block de kanban"
description: "Block de kanban: muestra registros de datos por columnas agrupadas, soporta cambio de estilo, creación rápida, configuración de ventanas emergentes, ordenación por arrastre y apertura mediante clic en la tarjeta."
keywords: "Block de kanban,Kanban,agrupación de datos,ordenación por arrastre,creación rápida,configuración de ventanas emergentes,disposición de tarjetas,Interface Builder,NocoBase"
---

# Kanban

## Introducción

El Block de kanban muestra registros de datos por columnas agrupadas, ideal para escenarios donde es necesario consultar y avanzar datos por etapas, como flujo de estados de tareas, seguimiento de fases de venta, gestión de tickets, etc.

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_51_PM.png)

## Elementos de configuración del Block

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM.png)

### Configuración de agrupación

El Block de kanban debe especificar primero un campo de agrupación; el sistema asignará los registros a diferentes columnas según el valor del campo.

- El campo de agrupación admite campos de selección única y campos de muchos a uno.
- El título y el color de la columna del campo de selección única se reutilizan directamente de las etiquetas y colores configurados en las opciones del campo.
- Las opciones de agrupación de un campo de muchos a uno se cargan desde los registros de la Collection relacionada.
- Cuando el campo de agrupación es un campo de muchos a uno, se pueden configurar adicionalmente:
	- Campo de título: determina qué valor del campo relacionado se muestra en el encabezado de columna.
	- Campo de color: determina el color de fondo del encabezado y del contenedor de columna.
- Mediante "Seleccionar valores de agrupación" se puede controlar qué columnas se muestran y el orden de visualización de las columnas.
- Los registros con valor de agrupación vacío se muestran en la columna "Desconocido".

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_53_PM%20(1).png)
![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM.png)

### Estilo

El kanban admite dos estilos de columna:

- `Classic`: mantiene un fondo de columna predeterminado más ligero.
- `Filled`: utiliza el color de la columna para renderizar el fondo del encabezado y del contenedor de columna, adecuado para escenarios con colores de estado más definidos.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_54_PM%20(1).png)

### Configuración de arrastre

Una vez activado el arrastre, se pueden arrastrar directamente las tarjetas para ajustar su orden.

- Tras activar "Activar ordenación por arrastre", se puede seleccionar también el "Campo de ordenación por arrastre".
- La ordenación por arrastre depende del campo de ordenación, y el campo de ordenación debe coincidir con el campo de agrupación actual.
- Al arrastrar una tarjeta a otra columna, se actualizará simultáneamente el valor del campo de agrupación y la posición de ordenación del registro.

Para más información, consulte [Campo de ordenación](/data-sources/field-sort)

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_55_PM.png)

### Creación rápida

Una vez activada la "Creación rápida", se mostrará un botón con el signo más a la derecha del título de cada columna.

- Al hacer clic en el signo más del encabezado de columna, se abrirá la ventana emergente de creación con la columna actual como contexto.
- El formulario de creación rellenará automáticamente el valor de agrupación correspondiente a la columna actual.
- Si la columna actual es la columna "Desconocido", el campo de agrupación se rellenará previamente con un valor vacío.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_57_PM.png)

### Configuración de ventana emergente

La "Configuración de ventana emergente" a nivel de Block se utiliza para controlar el comportamiento de la ventana emergente que se abre con el botón de creación rápida del encabezado de columna.

- Permite configurar el modo de apertura, por ejemplo cajón, diálogo o página.
- Permite configurar el tamaño de la ventana emergente.
- Permite vincular una plantilla de ventana emergente o seguir añadiendo contenido de Block dentro de la ventana emergente.

### Cantidad por página por columna

Se utiliza para controlar la cantidad de registros que se cargan inicialmente en cada columna. Cuando una columna tiene muchos registros, se puede continuar cargando mediante desplazamiento.

### Ancho de columna

Se utiliza para establecer el ancho de cada columna, facilitando el ajuste del efecto de visualización según la densidad del contenido de las tarjetas.

### Configurar el rango de datos

Se utiliza para limitar el rango de datos mostrados en el Block de kanban.

Por ejemplo: mostrar solo las tareas creadas por el responsable actual o solo los registros de un proyecto específico.

Para más información, consulte [Configurar el rango de datos](/interface-builder/blocks/block-settings/data-scope)


## Configurar campos

El interior de la tarjeta de kanban utiliza un diseño de campos al estilo de detalles para mostrar información de resumen del registro.

### Añadir campo

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM.png)

Para los elementos de configuración del campo, consulte [Campos de detalles](/interface-builder/fields/generic/detail-form-item)

### Configuración de la tarjeta

La propia tarjeta admite las siguientes configuraciones:

- Activar clic para abrir: una vez activado, al hacer clic en la tarjeta se abre el registro actual.
- Configuración de ventana emergente: permite configurar individualmente el modo de apertura, el tamaño y la plantilla de la ventana emergente al hacer clic en la tarjeta.
- Diseño: permite ajustar la disposición de los campos dentro de la tarjeta.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_09_56_PM.png)

![](https://static-docs.nocobase.com/Kanban-04-17-2026_01_55_PM%20(2).png)

## Configurar Actions

El Block de kanban admite la configuración de Actions globales en la parte superior; los tipos de Actions visibles cambian según las capacidades de Action habilitadas en el entorno actual.

![](https://static-docs.nocobase.com/Kanban-04-22-2026_10_02_PM.png)

### Actions globales

- [Crear nuevo](/interface-builder/actions/types/add-new)
- [Ventana emergente](/interface-builder/actions/types/pop-up)
- [Enlace](/interface-builder/actions/types/link)
- [Refrescar](/interface-builder/actions/types/refresh)
- [Solicitud personalizada](/interface-builder/actions/types/custom-request)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)
