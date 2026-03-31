---
pkg: "@nocobase/plugin-calendar"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Bloque de Calendario

## Introducción

El Bloque de Calendario le permite visualizar y gestionar eventos y datos relacionados con fechas en un formato de calendario. Es ideal para programar reuniones, planificar actividades y organizar su tiempo de manera eficiente.

## Instalación

Este plugin viene preinstalado, por lo que no requiere ninguna configuración adicional.

## Cómo añadir un bloque

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1.  Campo de título: Se utiliza para mostrar información en las barras del calendario. Actualmente, es compatible con tipos de campo como `Texto de una sola línea`, `Selección única`, `Teléfono`, `Correo electrónico`, `Grupo de radio` y `Secuencia`. Los tipos de campo de título compatibles con el bloque de calendario se pueden ampliar mediante plugins.
2.  Hora de inicio: Indica cuándo comienza la tarea.
3.  Hora de finalización: Marca cuándo termina la tarea.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Al hacer clic en una barra de tarea, esta se resaltará y se abrirá una ventana emergente con los detalles.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Configuración del bloque

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Mostrar calendario lunar

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Establecer rango de datos

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Para más información, consulte.

### Establecer altura del bloque

Ejemplo: Ajuste la altura del bloque de calendario de pedidos. No aparecerá ninguna barra de desplazamiento dentro del bloque de calendario.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Para más información, consulte.

### Campo de color de fondo

:::info{title=Consejo}
La versión de NocoBase debe ser v1.4.0-beta o superior.
:::

Esta opción le permite configurar el color de fondo de los eventos del calendario. A continuación, le mostramos cómo usarla:

1.  La tabla de datos del calendario debe tener un campo de tipo **Selección única** o **Grupo de radio**, y este campo debe tener colores configurados.
2.  Luego, regrese a la interfaz de configuración del bloque de calendario y seleccione el campo que acaba de configurar con colores en el **Campo de color de fondo**.
3.  Finalmente, puede intentar seleccionar un color para un evento del calendario y hacer clic en enviar. Verá que el color se ha aplicado.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Día de inicio de la semana

> Compatible con la versión v1.7.7 y superiores

El bloque de calendario permite configurar el día de inicio de la semana, pudiendo elegir entre **Domingo** o **Lunes** como el primer día de la semana.
El día de inicio predeterminado es el **Lunes**, lo que facilita a los usuarios ajustar la visualización del calendario según las costumbres regionales para una mejor experiencia de uso.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)

## Configurar acciones

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Hoy

El botón "Hoy" en el Bloque de Calendario ofrece una navegación rápida, permitiéndole regresar instantáneamente a la fecha actual después de explorar otras fechas.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Cambiar vista

La vista predeterminada es Mensual.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)