---
pkg: "@nocobase/plugin-calendar"
title: "Block de calendario"
description: "El Block de calendario muestra eventos y datos de fechas en una vista de calendario, adecuado para programación de reuniones, planes de actividades, etc.; permite configurar campos de título, fechas de inicio y fin, visualización del calendario lunar y rango de datos."
keywords: "Block de calendario, vista de calendario, gestión de eventos, programación de reuniones, Calendar, NocoBase"
---

# Block de calendario

## Introducción

El Block de calendario muestra de forma intuitiva eventos y datos relacionados con fechas en una vista de calendario, adecuado para escenarios típicos como programación de reuniones, planes de actividades, etc.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_27_PM.png)

## Instalación

Este Block es un Plugin integrado, no requiere instalación adicional.

## Añadir Block

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_39_PM.png)

Seleccione el Block "Calendario" y especifique la Collection correspondiente para completar la creación.

## Elementos de configuración del Block

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_38_AM.png)

### Campo de título

Se utiliza para mostrar la información del título en la barra de eventos del calendario.

Los tipos de campo actualmente admitidos incluyen: `input`, `select`, `phone`, `email`, `radioGroup`, `sequence`, etc.; también admite la extensión a más tipos mediante Plugins.

### Campo de fecha de inicio

Se utiliza para especificar la fecha de inicio del evento.

### Campo de fecha de fin

Se utiliza para especificar la fecha de fin del evento.

### Creación rápida de eventos

Al hacer clic en un área de fecha vacía del calendario, aparecerá rápidamente una capa flotante para crear un evento.

![](https://static-docs.nocobase.com/Add-new-04-23-2026_10_39_AM.png)

Al hacer clic en un evento existente:
- El evento actual se resaltará
- Al mismo tiempo, aparecerá una ventana de detalles para facilitar su consulta o edición

### Mostrar calendario lunar

Si se activa, el calendario mostrará la información del calendario lunar correspondiente.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM.png)

### Rango de datos

Se utiliza para limitar el rango de datos mostrados en el Block de calendario.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM.png)

Para más información, consulte: [Configurar el rango de datos](/interface-builder/blocks/block-settings/data-scope)

### Altura del Block

Permite personalizar la altura del Block de calendario, evitando barras de desplazamiento internas y mejorando la experiencia general de la disposición.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM%20(1).png)

Para más información, consulte: [Altura del Block](/interface-builder/blocks/block-settings/block-height)

### Campo de color

Se utiliza para configurar el color de fondo de los eventos del calendario, mejorando la diferenciación visual.

Pasos de uso:

1. Añadir un campo **Selección única (Single select)** o **Botón de radio (Radio group)** en la Collection y configurar colores para las opciones;
2. En la configuración del Block de calendario, establecer ese campo como "Campo de color";
3. Al crear o editar un evento, seleccionar el color para que surta efecto en el calendario.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM%20(1).png)

### Día de inicio de la semana

Permite configurar el día de inicio de cada semana, con las siguientes opciones:
- Domingo
- Lunes (por defecto)

Puede ajustarse según los hábitos de uso de cada región, haciendo que la visualización del calendario sea más acorde con las necesidades reales.


## Configuración de Actions

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_32_PM.png)

### Hoy

Al hacer clic en el botón "Hoy", se vuelve rápidamente a la vista del calendario en la fecha actual.

### Cambiar de página

Cambio temporal según el modo de vista actual:
- Vista mensual: mes anterior / mes siguiente
- Vista semanal: semana anterior / semana siguiente
- Vista diaria: ayer / mañana

### Seleccionar vista

Permite cambiar entre las siguientes vistas:
- Vista mensual (por defecto)
- Vista semanal
- Vista diaria

### Título

Se utiliza para mostrar la fecha correspondiente a la vista actual.
