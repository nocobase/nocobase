---
pkg: "@nocobase/plugin-calendar"
title: "Bloque de calendario"
description: "El bloque de calendario muestra eventos y datos de fechas en una vista de calendario, adecuada para programar reuniones, planificar actividades y configurar el campo de título, las horas de inicio y finalización, el calendario lunar y el alcance de los datos."
keywords: "bloque de calendario,vista de calendario,eventos,programación de reuniones,Calendar,NocoBase"
---
# Bloque de calendario

## Introducción

El bloque de calendario muestra datos relacionados con eventos y fechas en una vista de calendario, lo que resulta adecuado para escenarios como la programación de reuniones y la planificación de actividades.

## Instalación

Es un plugin integrado y no requiere instalación.

## Añadir bloque

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. Campo de título: información que se muestra en la barra del calendario; actualmente admite campos de tipo `input`, `select`, `phone`, `email`, `radioGroup` y `sequence`. Puedes ampliar los tipos de campos de título compatibles con el bloque de calendario mediante plugins.
2. Hora de inicio: hora de inicio de la tarea;
3. Hora de finalización: hora de finalización de la tarea;

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>


Haz clic en la barra de una tarea para resaltarla y abrir una ventana emergente.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Opciones de configuración del bloque

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Mostrar calendario lunar

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Configurar el alcance de los datos

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Consulta más información en

### Configurar la altura del bloque

Ejemplo: ajustar la altura del bloque de calendario de pedidos para que no aparezca una barra de desplazamiento dentro del bloque de calendario.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Consulta más información en

### Campo de color de fondo

:::info{title=Nota}
Se requiere una versión de NocoBase v1.4.0-beta o posterior.
:::

Esta opción permite configurar el color de fondo de los eventos del calendario. Sigue estos pasos:

1. La tabla de datos del calendario debe incluir un campo de tipo **selección única (Single select)** o **grupo de opciones (Radio group)**, y dicho campo debe tener colores configurados.
2. Después, vuelve a la interfaz de configuración del bloque de calendario y selecciona, en **Campo de color de fondo**, el campo al que acabas de asignar colores.
3. Por último, prueba a seleccionar un color para un evento del calendario y haz clic en enviar. Verás que el color se ha aplicado correctamente.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Día de inicio de la semana

> Compatible con la versión v1.7.7 y posteriores

El bloque de calendario permite configurar el día de inicio de cada semana. Puedes elegir **domingo** o **lunes** como primer día de la semana.
El día de inicio predeterminado es el **lunes**, lo que facilita ajustar la visualización del calendario según las costumbres de cada región y se adapta mejor a las necesidades reales de uso.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)
## Operaciones de configuración

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Hoy

El botón "Hoy" del bloque de calendario ofrece una función de navegación práctica que permite volver rápidamente a la página del calendario correspondiente a la fecha actual después de navegar a otras fechas.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Cambiar vista

La vista predeterminada es mensual

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)