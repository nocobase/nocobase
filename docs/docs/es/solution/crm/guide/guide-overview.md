---
title: "Introducción al sistema y paneles"
description: "Visión general de CRM 2.0: estructura del menú, multilingüe y temas, panel de Analytics y panel de trabajo Overview."
keywords: "introducción al CRM,paneles,análisis de datos,KPI,NocoBase CRM"
---

# Introducción al sistema y paneles

> Este capítulo se centra en los dos paneles: Analytics (análisis de datos) y Overview (mesa de trabajo diaria).

## Visión general del sistema

CRM 2.0 es un sistema completo de gestión de ventas que cubre todo el proceso, desde la captación de Leads hasta la entrega de Pedidos. Tras iniciar sesión, la barra de menú superior es la entrada principal de navegación.


### Multilingüe y temas

El sistema admite cambio de idioma (esquina superior derecha); todos los JS Blocks y gráficos se han adaptado para ser multilingües.

En cuanto a los temas, se admiten tanto el claro como el oscuro, pero actualmente **recomendamos usar el modo claro + compacto**, que ofrece mayor densidad de información; algunos problemas de visualización en el tema oscuro se corregirán más adelante.

![00-overview-2026-04-01-23-38-28](https://static-docs.nocobase.com/00-overview-2026-04-01-23-38-28.png)

---

## Analytics — Centro de análisis de datos

Analytics es la primera página del menú y la primera interfaz que verá al abrir el sistema cada día.

### Filtro global

En la parte superior de la página hay una barra de filtros con dos condiciones: **rango de fechas** y **responsable (Owner)**. Tras filtrar, todas las tarjetas KPI y gráficos de la página se actualizan de forma vinculada.

![00-overview-2026-04-01-23-40-45](https://static-docs.nocobase.com/00-overview-2026-04-01-23-40-45.png)


### Tarjetas KPI

Bajo la barra de filtros hay 4 tarjetas KPI:

| Tarjeta | Significado | Comportamiento al hacer clic |
|------|------|---------|
| **Ingresos totales** | Importe acumulado de ingresos | Ventana emergente: gráfico circular de estado de pago + tendencia mensual de ingresos |
| **Nuevos Leads** | Número de Leads nuevos del periodo | Salta a la página de Leads filtrada automáticamente por estado «New» |
| **Tasa de conversión** | Proporción de Lead a cierre | Ventana emergente: gráfico circular de distribución por etapas + gráfico de barras de importes |
| **Ciclo medio de cierre** | Días medios desde la creación hasta el cierre | Ventana emergente: distribución del ciclo + tendencia mensual de Oportunidades ganadas |

Cada tarjeta **es navegable mediante drill-down**: la ventana emergente muestra gráficos de análisis más detallados. Si se dispone de capacidad de personalización, se puede seguir profundizando (empresa → departamento → individuo).

![00-overview-2026-04-01-23-42-33](https://static-docs.nocobase.com/00-overview-2026-04-01-23-42-33.gif)

:::tip[¿Los datos disminuyen tras el salto?]
Al hacer clic en un KPI para saltar a la página de la lista, la URL incluye los parámetros de filtrado (por ejemplo, `?status=new`). Si observa que los datos de la lista son menores, es porque ese parámetro sigue activo. Vuelva al panel y acceda de nuevo a la página de la lista para recuperar los datos completos.
:::

![00-overview-2026-04-01-23-44-19](https://static-docs.nocobase.com/00-overview-2026-04-01-23-44-19.png)


### Zona de gráficos

Bajo los KPI se encuentran 5 gráficos principales:

| Gráfico | Tipo | Descripción | Comportamiento al hacer clic |
|------|------|------|---------|
| **Distribución de Oportunidades por etapa** | Gráfico de barras | Cantidad, importe y probabilidad ponderada por etapa | Ventana emergente: drill-down tridimensional por Cliente/responsable/mes |
| **Embudo de ventas** | Gráfico de embudo | Conversión Lead → Oportunidad → Cotización → Pedido | Salta a la página de la entidad correspondiente |
| **Tendencia mensual de ventas** | Barra + línea | Ingresos mensuales, número de Pedidos, ticket medio | Salta a la página de Pedidos (con parámetro de mes) |
| **Tendencia de crecimiento de Clientes** | Barra + línea | Clientes nuevos por mes, Clientes acumulados | Salta a la página de Clientes |
| **Distribución por sector** | Gráfico circular | Distribución de Clientes por sector | Salta a la página de Clientes |

![00-overview-2026-04-01-23-46-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-46-36.png)

#### Embudo de ventas

Muestra la tasa de conversión del pipeline completo Lead → Oportunidad → Cotización → Pedido. Cada nivel se puede pulsar y salta a la página de listado de la entidad correspondiente (por ejemplo, al hacer clic en el nivel Opportunity → salta a la lista de Oportunidades).

#### Tendencia mensual de ventas

El gráfico de barras muestra los ingresos de cada mes; la línea superpuesta muestra el número de Pedidos y el ticket medio. Al hacer clic en la barra de un mes → salta a la página de Pedidos con el filtro temporal de ese mes (por ejemplo, `?month=2026-02`), permitiéndole ver directamente el detalle de los Pedidos de ese mes.

#### Tendencia de crecimiento de Clientes

El gráfico de barras muestra el número de Clientes nuevos por mes; la línea muestra el total acumulado. Al hacer clic en la barra de un mes → salta a la página de Clientes y filtra los Clientes nuevos de ese mes.

#### Distribución por sector

El gráfico circular muestra la distribución de Clientes por sector y los importes de los Pedidos asociados. Al hacer clic en un sector del gráfico → salta a la página de Clientes y filtra los Clientes de ese sector.

### Drill-down de etapas de Oportunidad

Al hacer clic en la barra de una etapa en la distribución de Oportunidades por etapa, se abre un análisis en profundidad de esa etapa:

- **Tendencia mensual**: variación mensual de las Oportunidades en esa etapa
- **Por responsable**: quién está dando seguimiento a esas Oportunidades
- **Por Cliente**: qué Clientes tienen Oportunidades en esa etapa
- **Resumen inferior**: al seleccionar Clientes se puede ver el importe acumulado

![00-overview-2026-04-01-23-49-04](https://static-docs.nocobase.com/00-overview-2026-04-01-23-49-04.png)


El contenido del drill-down de cada etapa (Prospecting / Analysis / Proposal / Negotiation / Won / Lost) es distinto, reflejando los puntos de atención específicos de cada etapa.

La pregunta principal que responde este gráfico es: **¿en qué etapa del embudo se pierden más Oportunidades?** Si en la etapa Proposal se acumulan muchas Oportunidades pero pocas pasan a Negotiation, indica que puede haber problemas en la fase de cotización.

![00-overview-2026-04-01-23-48-21](https://static-docs.nocobase.com/00-overview-2026-04-01-23-48-21.gif)

### Configuración de gráficos (avanzado)

Detrás de cada gráfico hay tres dimensiones de configuración:

1. **Origen de datos SQL**: determina qué datos muestra el gráfico; se puede ejecutar la consulta en el constructor de SQL para validarla
2. **Estilo del gráfico**: configuración JSON del área personalizada, controla el aspecto del gráfico
3. **Eventos**: comportamiento al hacer clic (ventana emergente OpenView / salto a la página)

![00-overview-2026-04-01-23-51-00](https://static-docs.nocobase.com/00-overview-2026-04-01-23-51-00.png)


### Vinculación de filtros

Al modificar cualquier condición de la barra de filtros superior, **todas las tarjetas KPI y gráficos de la página se actualizan al mismo tiempo**, sin necesidad de configurarlos uno a uno. Usos típicos:

- **Ver el rendimiento de una persona**: seleccione Owner = «Juan Pérez» → todos los datos de la página cambian a los Leads, Oportunidades y Pedidos a cargo de Juan Pérez
- **Comparar periodos**: cambie las fechas de «Este mes» a «Este trimestre» → el rango de los gráficos de tendencia cambia en consecuencia

La vinculación entre la barra de filtros y los gráficos se implementa mediante el **flujo de eventos de la página**: antes del renderizado se inyectan las variables del formulario y los gráficos referencian los valores de filtrado mediante variables en la SQL.

![00-overview-2026-04-01-23-52-29](https://static-docs.nocobase.com/00-overview-2026-04-01-23-52-29.png)

![00-overview-2026-04-01-23-53-57](https://static-docs.nocobase.com/00-overview-2026-04-01-23-53-57.png)
:::note
Las plantillas SQL solo admiten actualmente la sintaxis `if` para condicionales. Le recomendamos basarse en las plantillas existentes del sistema o pedir asistencia a la IA para realizar las modificaciones.
:::

---

## Overview — Mesa de trabajo diaria

Overview es la segunda página de panel; está orientada al trabajo diario más que al análisis de datos. La pregunta principal que resuelve es: **¿qué debo hacer hoy? ¿qué Leads merecen seguimiento?**

![00-overview-2026-04-01-23-56-07](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-07.png)


### Leads con puntuación alta

Filtra automáticamente los Leads con puntuación de IA ≥ 75 y estado New / Working (Top 5); cada uno muestra:

- **Indicador de puntuación con IA**: medidor circular que muestra de forma intuitiva la calidad del Lead (verde = puntuación alta = prioridad de seguimiento)
- **Siguiente acción recomendada por la IA**: acción de seguimiento que el sistema recomienda automáticamente según las características del Lead (por ejemplo, «Schedule a demo»)
- **Información básica del Lead**: nombre, empresa, origen, fecha de creación

Al hacer clic en el nombre del Lead se accede a sus detalles; al hacer clic en «Ver todo» se accede a la lista de Leads. Una mirada cada mañana a esta tabla le indica con quién debe ponerse en contacto en primer lugar hoy.

![00-overview-2026-04-01-23-56-36](https://static-docs.nocobase.com/00-overview-2026-04-01-23-56-36.png)

### Tareas de hoy

Lista de actividades del día (reuniones, llamadas, tareas, etc.); admite:

- **Completar con un clic**: haga clic en «Done» para marcar la tarea como completada; al completarla se atenúa
- **Aviso de retraso**: las tareas atrasadas no completadas se resaltan en rojo
- **Ver detalles**: haga clic en el nombre de la tarea para ver los detalles
- **Crear tarea**: cree directamente desde aquí un nuevo registro de actividad

![00-overview-2026-04-01-23-57-09](https://static-docs.nocobase.com/00-overview-2026-04-01-23-57-09.png)

### Calendario de actividades

Vista de calendario FullCalendar, con los tipos de actividad diferenciados por color (reunión/llamada/tarea/correo/nota). Admite vistas mes/semana/día, arrastre para cambiar de fecha y clic para ver los detalles.

![00-overview-2026-04-01-23-58-02](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-02.gif)

---

## Otros paneles (More Charts)

El menú incluye además tres paneles para distintos roles, a modo de referencia, que pueden conservarse u ocultarse según se necesite:

| Panel | Usuario objetivo | Características |
|--------|---------|------|
| **SalesManager** | Gerente de ventas | Ranking del equipo, gráfico de dispersión de riesgos, objetivos mensuales |
| **SalesRep** | Representante de ventas | Datos filtrados automáticamente por el usuario actual; solo se ve el rendimiento propio |
| **Executive** | Ejecutivo | Previsión de ingresos, salud de Clientes, tendencia Win/Loss |

![00-overview-2026-04-01-23-58-39](https://static-docs.nocobase.com/00-overview-2026-04-01-23-58-39.png)

Los paneles que no necesite se pueden ocultar en el menú sin afectar a la funcionalidad del sistema.

![00-overview-2026-04-02-00-02-39](https://static-docs.nocobase.com/00-overview-2026-04-02-00-02-39.png)

---

## Drill-through de KPI

Quizás ya lo haya notado: casi todos los números y gráficos presentados arriba son «pulsables». Este es el patrón de interacción más importante del CRM: **drill-through de KPI**: pulse en un número agregado → vea los datos detallados detrás de ese número.

El drill-through tiene dos formatos:

| Formato | Escenario aplicable | Ejemplo |
|------|---------|------|
| **Drill-through con ventana emergente** | Análisis comparativo multidimensional | Pulse en «Ingresos totales» → la ventana emergente muestra gráfico circular + tendencia |
| **Salto de página** | Ver y operar registros detallados | Pulse en «Nuevos Leads» → salta a la lista de Leads |

**Ejemplo operativo**: en el gráfico «Tendencia mensual de ventas» de Analytics descubre que la barra de ingresos de febrero es notablemente baja → pulse en esa barra → el sistema salta a la página de Pedidos con `mes = 2026-02` aplicado automáticamente → ve directamente todos los Pedidos de febrero y puede investigar la causa.

> El panel no es solo para «mirar», es el centro de navegación de todo el sistema. Cada número es una entrada que le guía de lo macro a lo micro, capa por capa, hasta llegar al origen del problema.

---

Tras conocer la visión general del sistema y los paneles, pasemos al proceso de negocio principal: comencemos por la [Gestión de Leads](./guide-leads).

## Páginas relacionadas

- [Guía de uso del CRM](./index.md)
- [Gestión de Leads](./guide-leads)
- [Empleados de IA](./guide-ai)
