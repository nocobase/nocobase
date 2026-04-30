---
title: "Oportunidades y cotizaciones"
description: "Guía de uso de la gestión de Oportunidades del CRM: vista Kanban, avance de etapas, creación de cotizaciones, soporte multidivisa y flujo de aprobación."
keywords: "gestión de Oportunidades,embudo de ventas,Kanban,aprobación de cotizaciones,multidivisa,NocoBase CRM"
---

# Oportunidades y cotizaciones

> La Oportunidad es el núcleo de todo el proceso de ventas: representa una posible operación. En este capítulo aprenderá a usar el Kanban para hacer avanzar las etapas de las Oportunidades, crear cotizaciones, completar el flujo de aprobación y, finalmente, convertir la cotización en un Pedido formal.

![cn_02-opportunities](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_02-opportunities.png)

## Vista general de la página de Oportunidades

Acceda a **Ventas → Opportunities** desde el menú izquierdo; verá dos pestañas en la parte superior de la página:

- **Kanban Pipeline**: muestra todas las Oportunidades organizadas por etapa en formato Kanban; ideal para el seguimiento diario y para hacer avanzar las Oportunidades rápidamente.
- **Vista de tabla**: muestra las Oportunidades en formato de lista; ideal para filtrar por lotes y exportar datos.

Por defecto se abre el Kanban Pipeline, que es la vista más utilizada por el personal de ventas.

![02-opportunities-2026-04-07-00-56-47](https://static-docs.nocobase.com/02-opportunities-2026-04-07-00-56-47.png)

## Kanban Pipeline

### Barra de filtros

La parte superior del Kanban tiene una fila de botones de filtrado que le ayudan a centrarse rápidamente en distintos rangos de Oportunidades:

| Botón | Función |
|------|------|
| **All Pipeline** | Muestra todas las Oportunidades en curso |
| **My Deals** | Solo las Oportunidades asignadas a usted |
| **Big Deals** | Operaciones grandes con un importe ≥ $50K |
| **Closing Soon** | Oportunidades previstas que cierran en 30 días |

La barra de filtros también incluye **2 tarjetas de estadísticas**: Open Deals (número de Oportunidades en curso) y Pipeline Value (valor total del pipeline), así como un **cuadro de búsqueda en tiempo real**: introduzca el nombre de la Oportunidad, del Cliente o del responsable para localizarla rápidamente.

:::tip
Estos botones de filtrado utilizan la capacidad de vinculación entre bloques de NocoBase (`initResource` + `addFilterGroup`), lo que permite filtrar los datos del Kanban en tiempo real sin necesidad de actualizar la página.
:::

![02-opportunities-2026-04-07-01-00-37](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-00-37.gif)

### Columnas del Kanban

El Kanban se divide en **6 columnas**, correspondientes a las 6 etapas de la Oportunidad:

```
Prospecting → Analysis → Proposal → Negotiation → Won → Lost
  Contacto inicial    Análisis de necesidades    Presentación de propuesta     Negociación comercial     Cerrada    Perdida
```

La barra de título de cada columna muestra: el nombre de la etapa, el número de Oportunidades en esa etapa, el importe total y un botón «+» de adición rápida.

Cada tarjeta muestra la siguiente información:

- **Nombre de la Oportunidad**: por ejemplo, «Proyecto ERP de XYZ Tech»
- **Nombre del Cliente**: la empresa Cliente asociada
- **Importe previsto**: por ejemplo, $50K
- **Probabilidad de éxito**: se muestra con etiquetas de colores (verde = alta probabilidad, amarillo = media, rojo = baja)
- **Avatar del responsable**: quién está dando seguimiento a esta Oportunidad

### Avanzar etapas mediante arrastre

La forma más intuitiva: **arrastrar la tarjeta directamente de una columna a otra**; el sistema actualizará automáticamente la etapa de la Oportunidad.

Por ejemplo, cuando haya completado el análisis de necesidades y esté listo para presentar la propuesta, arrastre la tarjeta de Analysis a Proposal.

![02-opportunities-2026-04-07-01-02-09](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-02-09.gif)

## Vista de tabla

Cambie a la pestaña de vista de tabla y verá una tabla de datos estándar.

### Botones de filtrado

Encima de la tabla también hay un grupo de botones de filtrado, que incluyen:

- **All**: todas las Oportunidades
- **In Pipeline**: Oportunidades en curso (excluye cerradas y perdidas)
- **Closing Soon**: próximas a vencer
- **Won**: cerradas
- **Lost**: perdidas

Cada botón va acompañado de una **estadística de cantidad**, lo que le permite ver de un vistazo la distribución de las Oportunidades por estado.

En la parte inferior de la tabla hay una **fila de resumen**: muestra el total del importe de las Oportunidades seleccionadas / totales, así como las etiquetas de distribución por etapas, lo que facilita comprender la situación global rápidamente.

### Ver detalles

Haga clic en cualquier fila de la tabla para abrir la ventana de detalles de la Oportunidad: es la interfaz principal para gestionar una Oportunidad concreta.

![02-opportunities-2026-04-07-01-05-05](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-05.png)

## Detalles de la Oportunidad

La ventana de detalles de la Oportunidad es la interfaz con mayor densidad de información. De arriba abajo, contiene los siguientes módulos:

![02-opportunities-2026-04-07-01-05-42](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-05-42.png)


### Barra de flujo de etapas

En la parte superior de los detalles hay una **barra de etapas interactiva** (componente Steps) que muestra claramente la etapa actual de la Oportunidad.

Puede **hacer clic directamente en una etapa de la barra** para hacer avanzar la Oportunidad. Al hacer clic en **Won** o **Lost**, el sistema mostrará un cuadro de confirmación, ya que estas dos son operaciones de estado terminal y, una vez confirmadas, no pueden revertirse a la ligera.

![02-opportunities-2026-04-07-01-06-54](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-06-54.gif)

### Indicadores clave

Bajo la barra de etapas se muestran cuatro indicadores principales:

| Indicador | Descripción |
|------|------|
| **Importe previsto** | Importe estimado de cierre de esta Oportunidad |
| **Fecha de cierre prevista** | Cuándo se planea cerrar |
| **Días en la etapa actual** | Cuánto tiempo lleva en la etapa actual (sirve para identificar Oportunidades estancadas) |
| **Probabilidad de éxito IA** | Probabilidad de cierre calculada por el sistema a partir de datos multidimensionales |

### Análisis de riesgos con IA

Es una de las funcionalidades destacadas del CRM. El sistema analiza automáticamente la salud de la Oportunidad y muestra:

- **Anillo de probabilidad de éxito**: gráfico circular intuitivo que muestra la probabilidad de cierre
- **Lista de factores de riesgo**: por ejemplo, «Han pasado más de 14 días desde el último contacto con el Cliente», «La cotización del competidor es más baja», etc.
- **Acción recomendada**: sugerencia siguiente que ofrece la IA, por ejemplo, «Programar una demostración del Producto»


### Lista de cotizaciones
![02-opportunities-2026-04-07-01-16-19](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-16-19.png)
La parte central de los detalles muestra **todas las cotizaciones asociadas a esta Oportunidad** en forma de subtabla. Cada fila muestra el número de cotización, el importe, el estado y otra información, con el estado de aprobación mostrado mediante etiquetas visuales (borrador, en aprobación, aprobada, rechazada).

### Comentarios y adjuntos

A la derecha de los detalles está la zona de comentarios y la zona de adjuntos; los miembros del equipo pueden intercambiar avances y subir archivos relevantes aquí.
![02-opportunities-2026-04-07-01-17-01](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-17-01.png)

## Crear una cotización

¿Listo para enviar una cotización al Cliente? El proceso es el siguiente:

**Paso 1**: abra los detalles de la Oportunidad y localice la zona de la lista de cotizaciones.

**Paso 2**: haga clic en el botón **Add new** (nuevo) y el sistema mostrará el formulario de la cotización.

**Paso 3**: complete la información básica de la cotización, incluyendo el nombre de la cotización, la fecha de validez, etc.

**Paso 4**: añada las líneas de la cotización en la **subtabla de detalles del Producto**:

| Campo | Descripción |
|------|------|
| **Producto** | Selecciónelo del catálogo de Productos |
| **Especificación** | Solo lectura, se rellena automáticamente al seleccionar el Producto |
| **Unidad** | Solo lectura, se rellena automáticamente |
| **Cantidad** | Cantidad cotizada |
| **Precio de lista** | Solo lectura, precio de lista del catálogo de Productos |
| **Precio unitario** | Solo lectura, se ajusta automáticamente al precio escalonado según la cantidad |
| **Tasa de descuento** | Solo lectura, descuento del precio escalonado |
| **Importe de la línea** | Calculado automáticamente |

El sistema completa automáticamente la cadena de cálculo del importe: subtotal → descuento → impuestos → envío → importe total → importe equivalente en USD. En el formulario hay un bloque JS de información que muestra las reglas de relleno automático y las fórmulas de cálculo.

**Paso 5**: si el Cliente comercia en una moneda distinta del dólar estadounidense, seleccione la divisa correspondiente. El sistema **bloqueará el tipo de cambio actual** al crear la cotización y la convertirá automáticamente al importe equivalente en USD, garantizando que la conciliación posterior no se vea afectada por las fluctuaciones del tipo de cambio.

**Paso 6**: tras confirmar que la información es correcta, haga clic en enviar para guardar la cotización. En este momento, el estado de la cotización es **Draft (borrador)**.

![02-opportunities-2026-04-07-01-09-11](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-11.gif)

## Flujo de aprobación de cotizaciones

Tras crearse, la cotización no surte efecto directamente: debe pasar por un flujo de aprobación que garantice que la cotización es razonable y que el descuento está dentro del rango autorizado.

### Visión general del flujo de aprobación

```
Draft (borrador) → Pending Approval (pendiente de aprobación) → Manager Review (revisión del gerente) → Approved / Rejected / Returned
```

![02-opportunities-2026-04-07-01-09-38](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-09-38.png)

### Enviar a aprobación

**Paso 1**: en los detalles de la Oportunidad, localice una cotización con estado Draft y haga clic en el botón **Submit for Approval** (enviar a aprobación).

:::note
Este botón **solo es visible cuando el estado de la cotización es Draft**. Las cotizaciones ya enviadas o aprobadas no muestran este botón.
:::

**Paso 2**: el sistema actualiza automáticamente el estado de la cotización a **Pending Approval** y activa el workflow de aprobación.

**Paso 3**: el gerente de aprobación designado recibe en el sistema la notificación de la tarea de aprobación.

![02-opportunities-2026-04-07-01-12-20](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-12-20.png)

### Aprobación por el gerente

Cuando el gerente de aprobación abre la tarea de aprobación, ve lo siguiente:

**Tarjeta de aprobación**: muestra la información clave de la cotización: número de cotización, nombre, importe (en moneda local + equivalente en USD) y estado actual.

**Detalles de aprobación**: muestra el contenido completo de la cotización en formato de solo lectura, incluyendo:
- Información básica (nombre de la cotización, validez, divisa)
- Asociación con el Cliente y la Oportunidad
- Subtabla de detalles del Producto (Producto, cantidad, precio unitario, descuento, subtotal)
- Resumen de importes
- Términos y observaciones

**Botones de operación**: el gerente de aprobación puede ejecutar las siguientes operaciones:

| Operación | Efecto |
|------|------|
| **Approve (aprobar)** | El estado de la cotización pasa a Approved |
| **Reject (rechazar)** | El estado pasa a Rejected; debe indicarse el motivo |
| **Return (devolver)** | La cotización se devuelve al creador para su modificación; el estado vuelve a Draft |
| **Add Approver (añadir aprobador)** | Se añade un aprobador adicional |
| **Transfer (transferir)** | La tarea de aprobación se transfiere a otra persona |

![02-opportunities-2026-04-07-01-13-04](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-04.png)

### Tratamiento del resultado de la aprobación

- **Aprobada**: el estado de la cotización pasa a Approved y se puede pasar al siguiente paso: convertirla en un Pedido formal.
- **Rechazada / Devuelta**: el estado de la cotización vuelve a Draft; el creador puede modificarla y volver a enviarla a aprobación.

![02-opportunities-2026-04-07-01-13-25](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-13-25.png)

## Convertir cotización en Pedido

Cuando el estado de la cotización es **Approved (aprobada)**, verá un botón **New Order** (crear Pedido) en la zona de operaciones de la cotización.

:::note
Este botón **solo es visible cuando el estado de la cotización es Approved**. Las cotizaciones en borrador o en aprobación no muestran este botón.
:::

Al hacer clic en **New Order**, el sistema crea automáticamente un borrador de Pedido a partir de los datos de la cotización, incluyendo los detalles del Producto, importes, información del Cliente, etc., evitando la introducción duplicada de datos.

![02-opportunities-2026-04-07-01-14-41](https://static-docs.nocobase.com/02-opportunities-2026-04-07-01-14-41.png)

---

Una vez aprobada la cotización, ya se puede convertir en un Pedido formal. A continuación, vaya a [Gestión de Pedidos](./guide-products-orders) para conocer el proceso posterior del Pedido.

## Páginas relacionadas

- [Guía de uso del CRM](./index.md)
- [Gestión de Leads](./guide-leads)
- [Gestión de Pedidos](./guide-products-orders)
