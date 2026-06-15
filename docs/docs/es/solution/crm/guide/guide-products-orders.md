---
title: "Productos, cotizaciones y Pedidos"
description: "Guía de uso del catálogo de Productos del CRM, las cotizaciones (con flujo de aprobación) y la gestión de Pedidos: el proceso completo desde el mantenimiento de Productos hasta la aprobación de cotizaciones y la entrega del Pedido."
keywords: "gestión de Productos,cotizaciones,gestión de Pedidos,flujo de aprobación,multidivisa,NocoBase CRM"
---

# Productos, cotizaciones y Pedidos

> Este capítulo cubre la segunda mitad del proceso de ventas: mantenimiento del catálogo de Productos, creación y aprobación de cotizaciones, así como la entrega y el seguimiento de cobros de los Pedidos. Las cotizaciones también se tratan en [Gestión de Oportunidades](./guide-opportunities) (desde la perspectiva de la Oportunidad); este capítulo se centra en la perspectiva de los Productos y los Pedidos.

![cn_03-products-orders](https://yifan2-500g.oss-cn-hangzhou.aliyuncs.com/crm-guide-mermaid/cn_03-products-orders.png)

## Catálogo de Productos

Acceda a la página **Productos** desde el menú superior; contiene dos pestañas:

### Lista de Productos

A la izquierda hay un árbol de categorías (filtro JS); a la derecha, la tabla de Productos. Cada Producto incluye: nombre, código, categoría, especificación, unidad, precio de lista, coste y divisa.

![03-products-orders-2026-04-07-01-18-03](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-03.png)

Al crear un Producto, además de la información básica, se puede configurar la **subtabla de precios escalonados**:

| Campo | Descripción |
|------|------|
| Divisa | Divisa de la tarifa |
| Cantidad mínima | Cantidad inicial de este tramo de precio |
| Cantidad máxima | Cantidad superior de este tramo de precio |
| Precio unitario | Precio unitario correspondiente al rango de cantidades |
| Tasa de descuento | Porcentaje de descuento por volumen |


![03-products-orders-2026-04-07-01-18-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-18-51.png)

Al crear una cotización, tras seleccionar el Producto el sistema ajustará automáticamente el precio escalonado según la cantidad.

![03-products-orders-2026-04-07-01-19-39](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-19-39.png)

### Gestión de categorías

La segunda pestaña es la tabla en árbol de las categorías de Productos, que admite anidación de categorías a varios niveles. Al hacer clic en «Añadir subcategoría», se crea una subcategoría bajo el nodo actual.

![03-products-orders-2026-04-07-01-20-19](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-20-19.png)

---

## Cotizaciones

Las cotizaciones se crean normalmente desde los detalles de la Oportunidad (consulte el apartado «Crear una cotización» de [Oportunidades y cotizaciones](./guide-opportunities)); aquí se complementa la información sobre los detalles del Producto y el flujo de aprobación.

### Detalles del Producto

En la subtabla de líneas de detalle de la cotización, al seleccionar un Producto se rellenan automáticamente varios campos:

| Campo | Descripción |
|------|------|
| **Producto** | Selecciónelo del catálogo de Productos |
| **Especificación** | Solo lectura, se rellena automáticamente al seleccionar el Producto |
| **Unidad** | Solo lectura, se rellena automáticamente |
| **Cantidad** | Se introduce manualmente |
| **Precio de lista** | Solo lectura, precio de lista del catálogo de Productos |
| **Precio unitario** | Solo lectura, se ajusta automáticamente al precio escalonado según la cantidad |
| **Tasa de descuento** | Solo lectura, descuento del precio escalonado |
| **Importe de la línea** | Calculado automáticamente |

![03-products-orders-2026-04-07-01-22-22](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-22-22.gif)

El sistema completa automáticamente la cadena de cálculo del importe: subtotal → descuento → impuestos → envío → importe total → importe equivalente en USD.

![03-products-orders-2026-04-07-01-23-13](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-23-13.gif)

### Soporte multidivisa

Si el Cliente comercia en una moneda distinta del dólar estadounidense, seleccione la divisa correspondiente. El sistema **bloquea el tipo de cambio actual** al crear la cotización y la convierte automáticamente al importe equivalente en USD. La gestión de tipos de cambio se mantiene en la página **Configuración → Tipos de cambio**.

### Aprobación

Una vez creada, la cotización debe pasar por una aprobación; tras aprobarla se crea un nuevo Pedido.

---

## Gestión de Pedidos

Acceda a la página **Pedidos** desde el menú superior. También se puede crear directamente un Pedido en los detalles de la Oportunidad haciendo clic en «New Order» desde una cotización aprobada.

### Lista de Pedidos

La parte superior de la página tiene botones de filtrado:

| Botón | Significado |
|------|------|
| **Todos** | Todos los Pedidos |
| **En proceso** | Pedidos en ejecución |
| **Pendiente de pago** | Pedidos a la espera de que el Cliente pague |
| **Enviado** | Pedidos enviados, pendientes de confirmación de recepción |
| **Completado** | Pedidos cuyo proceso ha finalizado |

![03-products-orders-2026-04-07-01-25-09](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-09.png)

### Columna de progreso del Pedido

La columna «Progreso del Pedido» de la tabla muestra el estado actual mediante una barra de progreso visual con puntos y líneas:

```
Pendiente de confirmar → Confirmado → En proceso → Enviado → Completado
```

Los pasos completados se resaltan; los pasos no alcanzados aparecen atenuados.

### Fila de resumen

Información de resumen en la parte inferior de la tabla:

- **Importe de los Pedidos seleccionados / totales**
- **Distribución del estado de pago** (en forma de etiquetas)
- **Distribución del estado del Pedido** (en forma de etiquetas)

![03-products-orders-2026-04-07-01-25-51](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-25-51.png)

### Crear un Pedido

**Convertir una cotización en Pedido (recomendado)**: en los detalles de la Oportunidad, las cotizaciones con estado Approved muestran el botón «New Order»; al pulsarlo, el sistema rellena automáticamente el Cliente, los detalles del Producto, los importes, la divisa, el tipo de cambio y otros datos.

![03-products-orders-2026-04-07-01-27-16](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-16.png)

**Creación manual**: en la página de la lista de Pedidos, haga clic en «Nuevo» y rellene Cliente, detalles del Producto, importe del Pedido y condiciones de pago.

### Avance del estado del Pedido

Haga clic en el Pedido para abrir la ventana de detalles; en la parte superior hay un flujo de estado interactivo: pulse el siguiente nodo de estado para hacer avanzar el Pedido. Cada cambio de estado queda registrado en el sistema.

![03-products-orders-2026-04-07-01-27-50](https://static-docs.nocobase.com/03-products-orders-2026-04-07-01-27-50.png)

### Seguimiento de pagos

El estado del Pedido y el estado del pago son dos pistas independientes:

- **Estado del Pedido**: Confirmar → Procesar → Enviar → Completar (proceso de entrega)
- **Estado del pago**: Pendiente de pago → Pago parcial → Pagado (proceso de cobro)

Actualmente nos centramos en el flujo de front-end del CRM y no aplicamos restricciones condicionales al estado del Pedido; sirve solo como elemento de registro. Si lo necesita, puede controlarlo mediante reglas de vinculación o eventos de la tabla de datos.

---

Una vez completado el Pedido, se cierra todo el ciclo de ventas. A continuación, conozca la gestión de [Clientes, contactos y correos](./guide-customers-emails).

## Páginas relacionadas

- [Guía de uso del CRM](./index.md)
- [Gestión de Oportunidades](./guide-opportunities) — operaciones de cotización desde la perspectiva de la Oportunidad
- [Clientes, contactos y correos](./guide-customers-emails)
- [Paneles](./guide-overview) — drill-down de los datos de Pedidos
