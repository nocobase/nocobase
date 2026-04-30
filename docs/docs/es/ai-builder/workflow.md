---
title: "Gestión de flujos de trabajo"
description: "El Skill de gestión de flujos de trabajo sirve para crear, editar, activar y diagnosticar flujos de trabajo de NocoBase."
keywords: "Constructor de IA, flujos de trabajo, disparadores, nodos, aprobaciones, automatización"
---

# Gestión de flujos de trabajo

:::tip Requisitos previos

Antes de leer esta página, asegúrese de haber instalado el NocoBase CLI y de haber completado la inicialización siguiendo la guía de [Inicio rápido del Constructor de IA](./index.md).

:::

## Introducción

El Skill de gestión de flujos de trabajo sirve para crear, editar, activar y diagnosticar flujos de trabajo de NocoBase: cubre el ciclo de vida completo del uso de un flujo, desde la elección del disparador hasta la construcción de la cadena de nodos y la resolución de problemas en los resultados de ejecución.


## Capacidades

Lo que puede hacer:

- Crear flujos de trabajo: elegir el tipo de disparador y añadir uno a uno los nodos de procesamiento
- Editar flujos de trabajo: modificar la configuración del disparador, añadir, modificar o eliminar nodos, y mover y copiar nodos
- Gestión de versiones: las versiones que ya se hayan ejecutado generan automáticamente una nueva revisión, sin afectar al historial
- Activar y ejecutar manualmente flujos de trabajo
- Diagnosticar ejecuciones fallidas: localizar el nodo fallido y la información del error

Lo que no puede hacer:

- No puede diseñar el modelo de datos (utilice el [Skill de modelado de datos](./data-modeling))
- No puede instalar MCP ni resolver problemas del entorno (utilice el [Skill de gestión de entornos](./env-bootstrap))
- No puede eliminar un flujo de trabajo completo (es una operación de alto riesgo que requiere confirmación específica)
- No puede inventarse tipos de nodo ni tipos de disparador

## Ejemplos de prompts

### Caso A: crear un nuevo flujo de trabajo

```
Ayúdame a orquestar un flujo de trabajo que descuente automáticamente el inventario de productos después de crear un pedido
```

El Skill confirmará primero el tipo de disparador y el diseño de la cadena de nodos; tras la confirmación, los irá creando paso a paso.

![20260419234303](https://static-docs.nocobase.com/20260419234303.png)

### Caso B: editar un flujo de trabajo existente

```
En el flujo de trabajo de creación de pedidos, añade un nodo de notificación que, cuando el inventario sea insuficiente, envíe un mensaje interno al administrador
```

Si la versión actual ya se ha ejecutado, se creará primero una nueva revisión antes de editar, sin afectar al historial de ejecuciones.

![20260419234419](https://static-docs.nocobase.com/20260419234419.png)

### Caso C: diagnosticar una ejecución fallida

```
La última ejecución del flujo de trabajo de descuento de inventario tras la creación de un pedido ha fallado; ayúdame a ver dónde está el problema
```

Se localizará la última ejecución fallida, se identificará el nodo en el que ha fallado y la información del error, y se ofrecerán recomendaciones de corrección.

![20260419234532](https://static-docs.nocobase.com/20260419234532.png)

### Caso D: analizar o resumir la lógica de un flujo de trabajo

```
Ayúdame a analizar la lógica de procesamiento del flujo «descuento de inventario tras la creación del pedido»
```

Salida:

```markdown
# Análisis del flujo de trabajo: descuento de inventario tras la creación del pedido

## Visión general del flujo de trabajo
**Nombre del flujo de trabajo:** descuento de inventario tras la creación del pedido

### Disparador
- **Tipo:** evento posterior a la acción (Action)
- **Condición de activación:** se dispara cuando la colección `orders` (pedidos) ejecuta la operación de «creación» (disparo global).
- **Datos relacionados:** al disparar, se incluyen los datos relacionados de `details` (líneas del pedido).
- **Modo de ejecución:** asíncrono

---

### Cadena de ejecución de nodos

**[Disparo] Creación de pedido**
        │
        ▼
**[1] Bucle por las líneas del pedido (Loop)**
    * **Objetivo:** `{{$context.data.details}}`
    * *Operación: ejecutar los siguientes pasos para cada línea de detalle:*
        │
        ▼
    **branchIndex=0 (cuerpo del bucle)**
        │
        ▼
    **[2] Consulta del inventario del producto (Query)**
    * **Colección:** `products`
    * **Condición de filtro:** `id = {{$scopes.5u6lsjzf8vh.item.productId}}`
        │
        ▼
    **[3] Comprobar si hay suficiente inventario (Condition)**
    * **Motor:** `formula.js`
    * **Expresión:** `{{$jobsMapByNodeKey.n6rf8lf2lum.inventory}} < {{$scopes.5u6lsjzf8vh.item.quantity}}`
        │
        ├── **YES (branchIndex=1, inventario insuficiente, condición TRUE):**
        │   ▼
        │   **[4] Notificar al superadministrador (Notification)**
        │   *Envía una notificación a los usuarios con rol root, con el siguiente contenido:*
        │   *nombre del producto, ID del producto, inventario actual y cantidad solicitada en el pedido.*
        │
        └── **NO (branchIndex=0, inventario suficiente, rama vacía)**
        │
        ▼
    **[5] Descontar inventario (SQL)**
    * **Sentencia SQL:** `UPDATE products SET inventory = inventory - :quantity`

---

### Explicación de la lógica clave

| Etapa | Descripción |
| :--- | :--- |
| **Disparo** | Al crear el pedido, el sistema entra en el flujo de trabajo con la lista completa de líneas del pedido. |
| **Bucle** | Se procesa una a una cada línea de detalle, cada una correspondiente a un producto y a su cantidad de compra. |
| **Consulta** | Se obtiene el inventario actual del producto a partir de `productId`. |
| **Comprobación** | Se determina si `inventory < quantity` es verdadero (es decir, si el inventario es insuficiente). |
| **Notificación** | Si el inventario es insuficiente, se envía un mensaje interno a los usuarios con el rol `root`. |
| **Descuento** | Se actualiza el inventario directamente mediante SQL; debido a la confluencia de las ramas, el descuento se ejecuta haya o no inventario suficiente. |

---

### ⚠️ Posible problema de diseño

El `downstreamId` del nodo de condición apunta al nodo de «descontar inventario», lo que significa que, sea cual sea la rama que se siga (inventario suficiente o insuficiente), finalmente se converge para ejecutar la operación de descuento. El comportamiento real es el siguiente:

- **Inventario suficiente** $\rightarrow$ se descuenta directamente el inventario (flujo normal). ✓
- **Inventario insuficiente** $\rightarrow$ primero se notifica al administrador y, **a continuación, se sigue ejecutando el descuento** (lo que puede provocar inventario negativo).

**Análisis:** este diseño se ajusta al patrón «permitir sobreventa y emitir alerta», aunque también puede tratarse de un descuido lógico (la intención original podría haber sido impedir el descuento cuando el inventario es insuficiente). Es necesario confirmar la intención del diseño con el responsable de negocio.

---

### Estado actual

- **Estado de activación:** `false` (desactivado).
- **Historial de ejecuciones:** se ha ejecutado 1 vez.
- **Control de versiones:** la versión actual está congelada; para modificarla es necesario crear primero una nueva versión.
```

## Preguntas frecuentes

**¿Por qué no se dispara mi flujo de trabajo recién creado?**

Los flujos de trabajo recién creados están desactivados por defecto (`enabled: false`). Tras confirmar que la configuración del disparador es correcta, actívelos manualmente.

**¿Las modificaciones del flujo de trabajo afectan al historial de ejecuciones?**

No. Si la versión actual ya tiene registros de ejecución, el Skill creará automáticamente una nueva revisión; el historial de ejecuciones queda vinculado a la versión anterior y no se ve afectado.

## Enlaces relacionados

- [Visión general del Constructor de IA](./index.md): resumen de todos los Skills del Constructor de IA y formas de instalación
- [Modelado de datos](./data-modeling): cree y gestione tablas con la IA
- [Gestión de entornos](./env-bootstrap): comprobación del entorno, instalación, despliegue y diagnóstico de fallos
