---
pkg: "@nocobase/plugin-field-sort"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Campo de Ordenación

## Introducción

Los campos de ordenación se utilizan para ordenar registros en una colección, admitiendo la ordenación dentro de grupos.

:::warning
Dado que el campo de ordenación forma parte de la misma colección, un registro no puede ser asignado a múltiples grupos al usar la ordenación por grupos.
:::

## Instalación

Es un plugin integrado, por lo que no requiere instalación adicional.

## Manual de Usuario

### Crear un Campo de Ordenación

![20240409091123_rec_](https://static-docs.nocobase.com/20240409091123_rec_.gif)

Al crear campos de ordenación, los valores de ordenación se inicializarán:

- Si no selecciona la ordenación por grupos, la inicialización se basará en el campo de clave primaria y el campo de fecha de creación.
- Si selecciona la ordenación por grupos, los datos se agruparán primero y luego la inicialización se basará en el campo de clave primaria y el campo de fecha de creación.

:::warning{title="Explicación de la Consistencia Transaccional"}
- Al crear un campo, si falla la inicialización del valor de ordenación, el campo de ordenación no se creará.
- Dentro de un cierto rango, si un registro se mueve de la posición A a la posición B, los valores de ordenación de todos los registros entre A y B cambiarán. Si alguna parte de esta actualización falla, toda la operación de movimiento se revertirá y los valores de ordenación de los registros relacionados no cambiarán.
:::

#### Ejemplo 1: Crear el campo sort1

El campo sort1 no está agrupado.

![20240409091510](https://static-docs.nocobase.com/20240409091510.png)

Los campos de ordenación de cada registro se inicializarán basándose en el campo de clave primaria y el campo de fecha de creación.

![20240409092305](https://static-docs.nocobase.com/20240409092305.png)

#### Ejemplo 2: Crear un campo sort2 basado en la agrupación por ID de Clase

![20240409092620](https://static-docs.nocobase.com/20240409092620.png)

En este momento, todos los registros de la colección se agruparán primero (por ID de Clase) y luego se inicializará el campo de ordenación (sort2). Los valores iniciales de cada registro son:

![20240409092847](https://static-docs.nocobase.com/20240409092847.png)

### Ordenación por Arrastrar y Soltar

Los campos de ordenación se utilizan principalmente para la ordenación por arrastrar y soltar de registros en varios bloques. Los bloques que actualmente admiten esta funcionalidad incluyen tablas y tableros.

:::warning
- Cuando se utiliza el mismo campo de ordenación para la ordenación por arrastrar y soltar, su uso en múltiples bloques puede alterar el orden existente.
- El campo para la ordenación por arrastrar y soltar en tablas no puede ser un campo de ordenación con una regla de agrupación.
  - Excepción: En un bloque de tabla de relación uno a muchos, la clave foránea puede servir como grupo.
- Actualmente, solo el bloque de tablero admite la ordenación por arrastrar y soltar dentro de grupos.
:::

#### Ordenación por Arrastrar y Soltar de Filas de Tabla

Bloque de tabla

![20240409104621_rec_](https://static-docs.nocobase.com/20240409104621_rec_.gif)

Bloque de tabla de relación

<video controls width="100%" src="https://static-docs.nocobase.com/20240409111903_rec_.mp4" title="Title"></video>

:::warning
En un bloque de relación uno a muchos:

- Si selecciona un campo de ordenación no agrupado, todos los registros pueden participar en la ordenación.
- Si los registros se agrupan primero por la clave foránea y luego se ordenan, la regla de ordenación solo afectará los datos dentro del grupo actual.

El efecto final es consistente, pero el número de registros que participan en la ordenación es diferente. Para más detalles, consulte [Explicación de las Reglas de Ordenación](#sorting-rule-explanation).
:::

#### Ordenación por Arrastrar y Soltar de Tarjetas de Tablero

![20240409110423_rec_](https://static-docs.nocobase.com/20240409110423_rec_.gif)

### Explicación de las Reglas de Ordenación

#### Desplazamiento entre elementos no agrupados (o del mismo grupo)

Supongamos que tenemos un conjunto de datos:

```
[1,2,3,4,5,6,7,8,9]
```

Cuando un elemento, por ejemplo el 5, se mueve hacia adelante a la posición del 3, solo las posiciones de los elementos 3, 4 y 5 cambian. El elemento 5 ocupa la posición del 3, y los elementos 3 y 4 se desplazan una posición hacia atrás cada uno.

```
[1,2,5,3,4,6,7,8,9]
```

Si luego movemos el elemento 6 hacia atrás a la posición del 8, el elemento 6 ocupa la posición del 8, y los elementos 7 y 8 se desplazan una posición hacia adelante cada uno.

```
[1,2,5,3,4,7,8,6,9]
```

#### Movimiento de elementos entre diferentes grupos

Al ordenar por grupo, si un registro se mueve a otro grupo, su asignación de grupo también cambiará. Por ejemplo:

```
A: [1,2,3,4]
B: [5,6,7,8]
```

Cuando el elemento 1 se mueve después del elemento 6 (el comportamiento predeterminado), su grupo también cambiará de A a B.

```
A: [2,3,4]
B: [5,6,1,7,8]
```

#### Los cambios de ordenación no están relacionados con los datos mostrados en la interfaz

Por ejemplo, considere un conjunto de datos:

```
[1,2,3,4,5,6,7,8,9]
```

La interfaz solo muestra una vista filtrada:

```
[1,5,9]
```

Cuando el elemento 1 se mueve a la posición del elemento 9, las posiciones de todos los elementos intermedios (2, 3, 4, 5, 6, 7, 8) también cambiarán, incluso si no son visibles.

```
[2,3,4,5,6,7,8,9,1]
```

La interfaz ahora muestra el nuevo orden basado en los elementos filtrados:

```
[5,9,1]
```