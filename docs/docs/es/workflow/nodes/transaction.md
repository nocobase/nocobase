---
pkg: '@nocobase/plugin-workflow-transaction'
title: "Nodo de flujo de trabajo - Transacción de base de datos"
description: "Nodo de transacción de base de datos: ejecuta operaciones de datos de la misma fuente en una transacción, confirma si todo va bien y revierte si falla."
keywords: "flujo de trabajo,transacción de base de datos,Transaction,revertir,confirmar,operación de datos,NocoBase"
---

# Transacción de base de datos

## Introducción

El nodo de transacción de base de datos ejecuta un conjunto de operaciones de base de datos dentro de la misma transacción. Es adecuado para escenarios en los que varios pasos de datos deben tener éxito todos juntos o revertirse por completo, por ejemplo crear un pedido, descontar inventario, escribir detalles y actualizar el estado.

Actualmente, el nodo de transacción solo admite fuentes de datos de base de datos. Las operaciones de datos de la misma fuente dentro del nodo se incluyen automáticamente en esta transacción; otras fuentes de datos no usan esta transacción.

## Crear nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón más ("+") del flujo para añadir un nodo "Transacción de base de datos".

![20260610205146](https://static-docs.nocobase.com/20260610205146.png)

Después de crearlo, se generan dos ramas:

- **Ejecutar**: rama principal que se ejecuta dentro de la transacción. Si todos los nodos de esta rama tienen éxito, la transacción se confirma automáticamente. Si algún nodo falla o genera un error, la transacción se revierte automáticamente.
- **Después de revertir**: rama que se ejecuta después de la reversión. Esta rama se ejecuta fuera de la transacción y puede usarse para registrar logs, enviar notificaciones o realizar acciones de compensación.

![20260610205303](https://static-docs.nocobase.com/20260610205303.png)

## Configuración del nodo

![20260610205505](https://static-docs.nocobase.com/20260610205505.png)

### Fuente de datos

Seleccione la fuente de datos de base de datos controlada por esta transacción. Solo los nodos de operación de datos de la misma fuente se incluyen automáticamente en la transacción.

### Nivel de aislamiento

Configure el nivel de aislamiento de la transacción. El valor predeterminado es `READ UNCOMMITTED`. Si su negocio requiere una consistencia de datos más estricta, elija otro nivel de aislamiento según las capacidades de la base de datos y los requisitos de concurrencia.

### Continuar flujo de trabajo después de revertir

Cuando está activado, el flujo de trabajo continúa con los nodos posteriores al nodo de transacción después de que finalice la rama `Después de revertir`.

Cuando está desactivado, el flujo de trabajo se detiene en el nodo de transacción después de que finalice la rama `Después de revertir`, y los nodos posteriores no se ejecutan.

## Uso

### Restricciones

La rama `Ejecutar` no admite nodos asíncronos que suspendan el flujo de trabajo, como procesamiento manual o retraso. La transacción debe confirmarse o revertirse durante la ejecución actual. Si la rama `Ejecutar` entra en estado de espera, el sistema revierte la transacción y marca el flujo de trabajo como fallido.

La rama `Después de revertir` se ejecuta fuera de la transacción, por lo que no está sujeta a la restricción anterior. Puede usar nodos asíncronos en esta rama según sea necesario, por ejemplo enviar solicitudes, esperar confirmación manual o retrasar el procesamiento.

:::warning Nota
Las transacciones ocupan conexiones de base de datos hasta que se confirman o se revierten. Evite operaciones de larga duración en la rama `Ejecutar` y mantenga allí solo las lecturas, escrituras y comprobaciones necesarias.
:::

### Transacciones anidadas

Los nodos de transacción pueden anidarse, pero debe prestar atención al alcance de la fuente de datos:

- Si la transacción interna y la externa usan la misma fuente de datos, la transacción interna se crea dentro del alcance de la transacción externa y se gestiona según las capacidades de la base de datos y Sequelize.
- Si la transacción interna usa otra fuente de datos, no reutiliza la transacción externa y crea una transacción independiente para esa fuente.
- Si el flujo de trabajo se activa mediante un evento de colección síncrono, el disparador puede proporcionar ya una transacción de nivel superior para la misma fuente de datos. El nodo de transacción reutiliza preferentemente la transacción externa de la misma fuente de datos y no reutiliza transacciones de fuentes diferentes.

Las transacciones anidadas aumentan el coste de comprensión y diagnóstico. Normalmente se recomienda usarlas solo cuando realmente necesite un límite local de reversión. En caso contrario, es preferible envolver todo el procesamiento de datos con un único nodo de transacción.

### Escenario común

Un flujo típico es:

1. Consultar o crear datos relacionados en la rama `Ejecutar`.
2. Seguir actualizando inventario, estado, detalles y otros datos de la misma fuente en la rama `Ejecutar`.
3. Si todo tiene éxito, la transacción se confirma automáticamente.
4. Si algún nodo falla o genera un error, la transacción se revierte automáticamente y el flujo entra en la rama `Después de revertir`.
5. En la rama `Después de revertir`, registrar el motivo del fallo, enviar notificaciones o ejecutar lógica de compensación.

Si necesita que el flujo de trabajo continúe después de la reversión, active "Continuar flujo de trabajo después de revertir".
