---
pkg: "@nocobase/plugin-calendar"
title: "Tabla de calendario"
description: "La tabla de calendario se utiliza para guardar datos con rangos de tiempo, como reuniones, programaciones, cursos y turnos, y permite mostrar y editar registros de eventos mediante el bloque de calendario."
keywords: "Tabla de calendario,Calendar Collection,Eventos de calendario,Eventos recurrentes,Bloque de calendario,NocoBase"
---

# Tabla de calendario

## Introducción

La tabla de calendario es adecuada para guardar datos con rangos de tiempo, como reservas de salas de reuniones, programaciones de proyectos, horarios de cursos, planes de turnos y calendarios de actividades. En esencia, sigue siendo una tabla de datos, pero incluye de forma predeterminada campos relacionados con los eventos de calendario, lo que facilita su uso posterior con el bloque de calendario.

Las tablas de calendario solo se pueden crear desde la página de la base de datos principal. Las bases de datos externas, las fuentes de datos de la API REST y las fuentes de datos externas de NocoBase no admiten la creación de tablas de calendario.

## Casos de uso

La tabla de calendario es adecuada para los siguientes casos de negocio:

- Reservas de salas de reuniones, vehículos y equipos
- Programación de proyectos, planificación de tareas y organización de hitos
- Horarios de cursos, planes de capacitación y calendarios de actividades
- Planes de turnos, registros de asignaciones y planes de inspección
- Registros de eventos que deben consultarse por día, semana o mes

## Creación y configuración

En la base de datos principal, haz clic en «Create collection» y selecciona «Calendar collection» para crear una tabla de calendario.

La configuración de creación de una tabla de calendario es básicamente igual que la de una tabla normal. `Preset fields` se utiliza para controlar los campos del sistema más habituales; además, la tabla de calendario incluye de forma predeterminada campos para guardar eventos recurrentes.

| Configuración | Descripción |
| --- | --- |
| Collection display name | Nombre con el que la tabla de datos se muestra en la interfaz, por ejemplo, «Reservas de salas de reuniones», «Horario de cursos» o «Plan de turnos». |
| Collection name | Nombre identificativo de la tabla de datos, utilizado para las referencias internas de la API, los campos de relación, los permisos, los flujos de trabajo, etc. |
| Inherits | Selecciona la tabla principal que se heredará. Solo está disponible cuando la base de datos principal es PostgreSQL. |
| Categories | Categoría de la tabla de datos. La categoría solo afecta a la forma en que se organizan las tablas en la interfaz de administración y no modifica su estructura. |
| Description | Descripción de la tabla de datos. Puedes indicar qué eventos se guardan en esta tabla de calendario, quién la mantiene y con qué procesos de negocio está relacionada. |
| Preset fields | Campos preestablecidos. Al crear una tabla de calendario, se recomienda conservar los campos del sistema y los campos integrados de la tabla de calendario. |

### Campos integrados

Una vez creada, la tabla de calendario normalmente contiene los siguientes campos integrados. `cron` y `exclude` se utilizan para guardar las reglas de recurrencia y las fechas excluidas.

| Campo | Nombre del campo | Descripción |
| --- | --- | --- |
| ID | `id` | Campo de clave primaria predeterminado, utilizado para identificar de forma única un registro de evento. |
| Hora de creación | `createdAt` | Registra automáticamente la hora de creación del registro de evento. |
| Creador | `createdBy` | Registra automáticamente el usuario que creó el registro de evento. |
| Hora de actualización | `updatedAt` | Registra automáticamente la hora de la última actualización del registro de evento. |
| Actualizador | `updatedBy` | Registra automáticamente el usuario que realizó la última actualización del registro de evento. |
| Orden | `sort` | Guarda el valor de orden del registro de evento y permite funciones como la ordenación mediante arrastrar y soltar. |
| Repeats | `cron` | Guarda las reglas de recurrencia de los eventos, como la repetición diaria, semanal, mensual o anual. |
| Exclude | `exclude` | Guarda las fechas excluidas de los eventos recurrentes; normalmente se mantiene automáticamente mediante la interacción con el calendario. |
| Espacio | `space` | Disponible tras habilitar el [plugin de múltiples espacios](../../multi-app/multi-space/index.md); se utiliza para aislar los datos por espacio. No aparece cuando no está habilitado el uso de múltiples espacios. |

Al utilizar una tabla de calendario con el bloque de calendario, también debes especificar los campos de negocio que se utilizarán para mostrar los eventos:

| Configuración | Descripción |
| --- | --- |
| Campo de título | Determina el título del evento en el calendario, por ejemplo, «Tema de la reunión» o «Nombre del curso». |
| Campo de fecha de inicio | Determina la hora de inicio del evento. Normalmente se utiliza un campo de fecha y hora. |
| Campo de fecha de finalización | Determina la hora de finalización del evento. Normalmente se utiliza un campo de fecha y hora. |

:::warning Atención

`cron` y `exclude` normalmente son mantenidos por las funciones del calendario; no se recomienda editarlos directamente como campos de negocio ordinarios. Los campos de título, fecha de inicio y fecha de finalización deben crearse y configurarse según las necesidades del negocio; de lo contrario, el bloque de calendario no podrá mostrar correctamente los eventos.

:::

### Campo de clave primaria

Al igual que una tabla normal, una tabla de calendario necesita un campo de clave primaria. Al crear la tabla, se recomienda conservar el campo preestablecido ID; el tipo de clave primaria predeterminado es `Snowflake ID (53-bit)`.

Si la tabla de calendario no tiene una clave primaria, debes establecer «Record unique key» al editar la tabla de datos; de lo contrario, es posible que el bloque de calendario no pueda abrir, editar o localizar correctamente los registros de eventos.

## Edición de la configuración

En la lista de tablas de datos, haz clic en «Edit», a la derecha de la tabla de calendario, para modificar configuraciones como el nombre mostrado de la tabla, la categoría, la descripción, el modo de paginación simple y «Record unique key».

Los campos integrados `cron`, `exclude`, entre otros, de la tabla de calendario normalmente se utilizan para las funciones del calendario; no se recomienda asignarles otros significados de negocio. Si necesitas ampliar la información de los eventos, puedes añadir campos de negocio ordinarios, como ubicación, participantes, sala de reuniones o estado.

## Eliminación de la tabla de datos

En la lista de tablas de datos, haz clic en «Delete», a la derecha de la tabla de calendario, para eliminarla.

Eliminar una tabla de calendario eliminará los registros de eventos, los datos de los campos integrados del calendario y los metadatos relacionados de la colección. Antes de eliminarla, confirma que los bloques de calendario y de tabla, los permisos, los flujos de trabajo y las API ya no dependan de esta tabla.

:::danger Advertencia

Las tablas de calendario normalmente guardan datos temporales, como programaciones, reservas y turnos. Tras eliminarlas, se perderán los eventos históricos y las reglas de recurrencia. Antes de realizar esta operación, confirma que los datos se hayan respaldado o que ya no sean necesarios.

:::

## Uso en la configuración de páginas

Las tablas de calendario pueden utilizar la mayoría de los bloques de datos de la [tabla normal](../data-source-main/general-collection.md) para realizar operaciones de creación, consulta, actualización y eliminación. Además, normalmente se utilizan junto con el bloque de calendario:

| Bloque | Uso |
| --- | --- |
| [Bloque de calendario](../../interface-builder/blocks/data-blocks/calendar.md) | Muestra los registros de eventos en vistas diarias, semanales, mensuales, etc., y permite crear, consultar y editar eventos en el calendario. |
| [Bloque de tabla](../../interface-builder/blocks/data-blocks/table.md) | Permite consultar, filtrar y mantener en lote los registros de eventos en forma de lista. |
| [Bloque de formulario](../../interface-builder/blocks/data-blocks/form.md) | Permite añadir o editar un único registro de evento. |
| [Bloque de detalles](../../interface-builder/blocks/data-blocks/details.md) | Permite consultar la información detallada de un único evento. |

## Enlaces relacionados

- [Tabla normal](../data-source-main/general-collection.md) — Consulta la configuración general y el uso de los bloques
- [Campos de fecha y hora](../data-modeling/collection-fields/datetime/datetime.md) — Crea los campos de hora de inicio y hora de finalización de los eventos
- [Bloque de calendario](../../interface-builder/blocks/data-blocks/calendar.md) — Muestra los datos en la página con una vista de calendario
- [Múltiples espacios](../../multi-app/multi-space/index.md) — Obtén más información sobre los campos de espacio y las funciones de aislamiento por espacio