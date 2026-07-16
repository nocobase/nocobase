---
pkg: "@nocobase/plugin-field-sort"
title: "Campo de ordenación"
description: "El campo de ordenación permite ordenar los registros de una tabla de datos y admite agrupar primero y ordenar después, para personalizar el orden de visualización de los registros."
keywords: "campo de ordenación,campo Sort,ordenación por grupos,sort,NocoBase"
---

# Campo de ordenación

## Introducción

En NocoBase, el **campo de ordenación (Sort)** se utiliza para registrar el valor de ordenación de los registros de una tabla de datos. Se usa habitualmente para ordenar mediante arrastrar y soltar los registros de bloques como tablas y tableros.

El campo de ordenación admite ordenar sin agrupar y también agrupar primero y ordenar después. La ordenación por grupos es adecuada para escenarios de “ordenación independiente dentro de cada grupo”, como ordenar estudiantes por clase o tareas por estado del tablero.

:::warning Nota

Dado que el campo de ordenación es un campo de la misma tabla, al ordenar por grupos no se admite que el mismo registro aparezca simultáneamente en varios grupos.

:::

## Instalación

El campo de ordenación lo proporciona un complemento integrado, por lo que no es necesario instalarlo por separado.

## Crear un campo de ordenación

En la página «Configure fields» de la tabla de datos, haz clic en «Add field» y selecciona «Ordenación» para crear un campo de ordenación.

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Al crear un campo de ordenación, NocoBase inicializa los valores de ordenación:

- Si no se selecciona la ordenación por grupos, se inicializan según el campo de clave principal y el campo de fecha de creación
- Si se selecciona la ordenación por grupos, primero se agrupan los datos y después se inicializan según el campo de clave principal y el campo de fecha de creación

:::warning Nota

Al crear el campo, si falla la inicialización de los valores de ordenación, el campo de ordenación no se creará. Dentro de un intervalo determinado, si un registro se mueve de la posición A a la posición B, cambiarán los valores de ordenación de todos los registros del intervalo AB; si alguno falla, el movimiento fallará y no cambiarán los valores de ordenación de los registros correspondientes.

:::

### Crear un campo de ordenación sin agrupación

A continuación se muestra un ejemplo de creación del campo `sort1`, que no utiliza la ordenación por grupos.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Los campos de ordenación de cada registro se inicializan según el campo de clave principal y el campo de fecha de creación.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

### Crear un campo de ordenación por grupos

A continuación se muestra cómo crear un campo `sort2` basado en la agrupación por `Class ID`.

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

En este caso, primero se agrupan todos los registros de la tabla de datos según Class ID y, después, se inicializa el campo de ordenación.

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

## Ordenación mediante arrastrar y soltar

El campo de ordenación se utiliza principalmente para ordenar mediante arrastrar y soltar los registros de distintos bloques. Actualmente, los bloques compatibles con esta función son las tablas y los tableros.

:::warning Nota

- Usar el mismo campo de ordenación para arrastrar y soltar en varios bloques puede dañar la ordenación existente
- El campo utilizado para ordenar mediante arrastrar y soltar en una tabla no puede ser un campo de ordenación con reglas de agrupación
- En un bloque de tabla de una relación uno a varios, la clave externa puede utilizarse como agrupación
- Actualmente, solo el bloque de tablero admite la ordenación mediante arrastrar y soltar por grupos

:::

### Ordenación mediante arrastrar y soltar de las filas de una tabla

Los bloques de tabla pueden utilizar un campo de ordenación para ajustar el orden de los registros mediante arrastrar y soltar.

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Los bloques de tabla de relaciones también pueden utilizar un campo de ordenación para ordenar mediante arrastrar y soltar.

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Ordenación mediante arrastrar y soltar en un bloque de tabla de relaciones"></video>

:::warning Nota

En un bloque de relación uno a varios, si se selecciona un campo de ordenación sin agrupación, todos los registros pueden participar en la ordenación; si primero se agrupa por la clave externa y después se ordena, la regla de ordenación solo afectará a los datos del grupo actual. El resultado final puede parecer el mismo, pero el intervalo de registros que participa en la ordenación es diferente.

:::

### Ordenación mediante arrastrar y soltar de las tarjetas de un tablero

Los bloques de tablero pueden utilizar un campo de ordenación para ajustar el orden de las tarjetas mediante arrastrar y soltar.

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

## Descripción de las reglas de ordenación

### Movimiento entre registros sin agrupar

Supongamos que tenemos un conjunto de datos:

```text
[1,2,3,4,5,6,7,8,9]
```

Cuando 5 se mueve hacia delante hasta la posición de 3, solo cambiarán los números de 3, 4 y 5. 5 ocupa la posición de 3, mientras que 3 y 4 se desplazan una posición hacia atrás.

```text
[1,2,5,3,4,6,7,8,9]
```

A continuación, si 6 se mueve hacia atrás hasta la posición de 8, 6 ocupa la posición de 8, mientras que 7 y 8 se desplazan una posición hacia delante.

```text
[1,2,5,3,4,7,8,6,9]
```

### Movimiento entre grupos diferentes

Al ordenar por grupos, cuando un registro se mueve a otro grupo, también cambia el grupo al que pertenece. Supongamos que tenemos dos grupos de datos:

```text
A: [1,2,3,4]
B: [5,6,7,8]
```

Cuando 1 se mueve detrás de 6, el grupo al que pertenece 1 también cambia de A a B.

```text
A: [2,3,4]
B: [5,6,1,7,8]
```

### Los cambios de ordenación no dependen de los datos mostrados en la interfaz

Supongamos que tenemos un conjunto de datos:

```text
[1,2,3,4,5,6,7,8,9]
```

La interfaz solo muestra:

```text
[1,5,9]
```

Cuando 1 se mueve a la posición de 9, cambiarán las posiciones intermedias de 2, 3, 4, 5, 6, 7 y 8.

```text
[2,3,4,5,6,7,8,9,1]
```

La interfaz muestra finalmente:

```text
[5,9,1]
```

## Enlaces relacionados

- [Campos de tablas de datos](../index.md) — Consulta la descripción de los tipos de campo y la asignación de campos
- [Bloques de tabla](../../interface-builder/blocks/data-blocks/table.md) — Utiliza la ordenación mediante arrastrar y soltar en una tabla
- [Bloques de tablero](../../interface-builder/blocks/data-blocks/kanban.md) — Utiliza la ordenación mediante arrastrar y soltar en un tablero
