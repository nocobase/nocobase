---
pkg: '@nocobase/plugin-gantt'
title: 'Bloque de Gantt'
description: 'El bloque de Gantt muestra en una línea de tiempo las fechas de inicio y fin, así como el progreso de los registros. Es útil para planificación de proyectos, programación de tareas y seguimiento de hitos, y admite campo de título, campos de fecha, campo de progreso, campo de color, escala de tiempo, tabla izquierda y popup de evento.'
keywords: 'Bloque de Gantt,Gantt,planificación de proyectos,programación de tareas,línea de tiempo,gestión de progreso,construcción de interfaz,NocoBase'
---

# Bloque de Gantt

## Introducción

El bloque de Gantt muestra en una línea de tiempo las fechas de inicio y fin, así como el progreso de los registros. Es adecuado para planificación de proyectos, programación de tareas, seguimiento de hitos y otros escenarios donde necesitas ver la duración de las tareas en el tiempo.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_30_AM.png)

## Instalación

Este bloque es un plugin integrado y no requiere instalación adicional.

## Añadir bloque

Después de seleccionar el bloque de Gantt y elegir una tabla de datos, configura en el popup los campos que necesita el bloque:

1. Selecciona el campo de título, que se usa para mostrar el nombre de la tarea
2. Selecciona el campo de fecha de inicio, que se usa para determinar cuándo empieza la tarea
3. Selecciona el campo de fecha de fin, que se usa para determinar cuándo termina la tarea
4. Opcionalmente, selecciona el campo de progreso, que se usa para mostrar y actualizar el progreso mediante arrastre
5. Opcionalmente, selecciona el campo de color, que se usa para distinguir diferentes tareas
6. Selecciona la escala de tiempo, que controla la granularidad de la línea de tiempo

Una vez completada la configuración, puedes crear el bloque de Gantt.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM%20(1).png>)

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_27_AM.png)

## Configuración del bloque

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_28_AM.png)

### Campos de Gantt

Los campos de Gantt determinan cómo se asignan los registros a las tareas de la línea de tiempo.

Incluyen:

- El campo de título determina el nombre que se muestra en la barra de tarea
- El campo de fecha de inicio determina dónde empieza la barra de tarea
- El campo de fecha de fin determina dónde termina la barra de tarea
- El campo de progreso determina el progreso mostrado dentro de la barra de tarea
- El campo de color determina el color de la barra de tarea
- La escala de tiempo determina si la línea de tiempo se muestra por hora, día, semana, mes, etc.

### Campo de título

Se usa para mostrar el nombre de la tarea. Normalmente puedes seleccionar un campo de texto, como nombre de tarea, nombre de proyecto o título.

### Campo de fecha de inicio

Se usa para especificar la hora de inicio de la tarea. El bloque de Gantt usa este campo para colocar la tarea en la línea de tiempo.

### Campo de fecha de fin

Se usa para especificar la hora de fin de la tarea. Cuando la fecha de inicio y la fecha de fin son iguales, la tarea se muestra como un intervalo más corto.

### Campo de progreso

Se usa para mostrar el progreso de finalización de la tarea y permite actualizarlo arrastrando el control de progreso en la barra de tarea.

El campo de progreso usa un campo flotante. Los datos se almacenan de `0` a `1` y se muestran como porcentaje en el bloque de Gantt. Por ejemplo, `0.6` se muestra como `60%`.

### Campo de color

Se usa para definir el color de la barra de tarea, lo que facilita distinguir tipos, estados o prioridades de tareas.

El campo de color admite:

- Campo de selección única
- Campo de color

Si se usa un campo de selección única, el bloque de Gantt reutiliza primero el color configurado para la opción seleccionada.

### Escala de tiempo

Se usa para controlar la granularidad de la línea de tiempo.

Actualmente admite:

- Hora
- Cuarto de día
- Medio día
- Día
- Semana
- Mes
- Año
- Trimestre

Para tareas de corta duración, puedes usar hora, medio día o día. Para tareas de mayor duración, puedes usar semana, mes, trimestre o año.

### Mostrar tabla

Al activarlo, el bloque de Gantt muestra un área de tabla a la izquierda. Puedes configurar columnas de tabla para mostrar atributos clave de las tareas.

Al desactivarlo, el bloque solo muestra la línea de tiempo de la derecha. Es adecuado cuando el espacio de la página es limitado o solo necesitas ver la planificación.

### Ancho de tabla

Se usa para definir el ancho del área de tabla izquierda. Esta opción solo aparece cuando Mostrar tabla está activado.

Si hay muchos campos en la tabla, puedes aumentar el ancho. Si solo conservas pocos campos, puedes reducirlo y dejar más espacio para la línea de tiempo.

### Activar arrastre para reprogramar

Al activarlo, puedes arrastrar barras de tarea en la línea de tiempo para ajustar las fechas de inicio y fin.

Detalles:

- Arrastra toda la barra de tarea para ajustar la fecha de inicio y la fecha de fin al mismo tiempo
- Arrastra los controles de ambos lados de la barra para ajustar la fecha de inicio o la fecha de fin
- Arrastra el control de progreso para actualizar el campo de progreso

Si no quieres que los usuarios modifiquen la planificación directamente en el bloque de Gantt, desactiva esta opción.

### Desplazarse a hoy al mostrarse por primera vez

Al activarlo, el bloque de Gantt se desplaza automáticamente hasta hoy cuando se muestra por primera vez.

Esta opción es adecuada para proyectos con tareas de larga duración. Al abrir la página, los usuarios pueden ver primero las tareas cercanas a la fecha actual.

### Configuración del popup de evento

Se usa para configurar cómo se abre una barra de tarea después de hacer clic en ella.

Puedes configurar:

- Modo de apertura, como cajón, diálogo o página
- Tamaño del popup
- Plantilla del popup

Después de hacer clic en una barra de tarea, NocoBase abre el registro actual según esta configuración, lo que facilita ver o editar los detalles de la tarea.

### Alcance de datos

Se usa para limitar los datos mostrados en el bloque de Gantt.

Por ejemplo: mostrar solo tareas del proyecto actual o solo tareas pendientes.

Para más detalles, consulta [Alcance de datos](../block-settings/data-scope).

### Tamaño de página

Se usa para controlar el número de registros cargados por página. Cuando hay muchos registros, los usuarios pueden cambiar de página para ver más tareas.

### Mostrar números de fila

Al activarlo, la tabla izquierda muestra números de fila, lo que ayuda a ubicar registros cuando hay muchas tareas.

### Tabla de árbol

Si la tabla actual es una tabla de árbol, el bloque de Gantt puede activar el modo de tabla de árbol. Al activarlo, la tabla izquierda muestra registros con jerarquía padre-hijo, y la línea de tiempo de la derecha muestra las tareas con la misma jerarquía.

En el modo de tabla de árbol también puedes configurar Expandir todas las filas por defecto.

## Configurar campos

El área de tabla izquierda usa columnas de tabla para mostrar campos de registros.

![](https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM.png)

### Añadir campos

Después de activar Mostrar tabla, puedes añadir columnas de campo a la tabla izquierda. La configuración de campos puede consultar [Columna de tabla](../../fields/generic/table-column).

### Columna de acciones

El bloque de Gantt incluye una columna de acciones por defecto. Puedes añadir acciones de registro como ver, editar y eliminar.

Si ya configuraste el popup de evento, también puedes hacer clic en la barra de tarea de la derecha para abrir los detalles del registro.

## Configurar acciones

El bloque de Gantt permite configurar acciones globales en la parte superior. Los tipos de acción disponibles dependen de las capacidades habilitadas en el entorno actual.

![](<https://static-docs.nocobase.com/Project-tasks-06-11-2026_11_29_AM%20(1).png>)

### Acciones integradas

- Hoy: desplazarse rápidamente hasta hoy
- Expandir/Contraer: expandir o contraer todas las filas en modo de tabla de árbol

### Acciones globales

- [Añadir nuevo](../../actions/types/add-new)
- [Popup](../../actions/types/pop-up)
- [Enlace](../../actions/types/link)
- [Actualizar](../../actions/types/refresh)
- [Filtro](../../actions/types/filter)
- [Edición masiva](../../actions/types/bulk-edit)
- [Actualización masiva](../../actions/types/bulk-update)
- [Activar flujo de trabajo](../../actions/types/trigger-workflow)
- [Solicitud personalizada](../../actions/types/custom-request)
- [JS Item](../../actions/types/js-item)
- [JS Action](../../actions/types/js-action)
- [Empleado de IA](../../actions/types/ai-employee)
