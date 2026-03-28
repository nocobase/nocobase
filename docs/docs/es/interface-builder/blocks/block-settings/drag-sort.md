:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/interface-builder/blocks/block-settings/drag-sort).
:::

# Ordenación por arrastrar y soltar

## Introducción

La ordenación por arrastrar y soltar depende de un campo de ordenación para reordenar manualmente los registros dentro de un bloque.


:::info{title=Sugerencia}
* Cuando se utiliza el mismo campo de ordenación para la ordenación por arrastre en varios bloques, esto puede alterar el orden existente.
* Al utilizar la ordenación por arrastre en una tabla, el campo de ordenación no puede tener reglas de agrupación configuradas.
* Las tablas en árbol solo admiten la ordenación de nodos dentro del mismo nivel.

:::


## Configuración del arrastre

Añada un campo de tipo "Sort" (Ordenación). Los campos de ordenación ya no se generan automáticamente al crear una colección; deben crearse manualmente.

![](https://static-docs.nocobase.com/470891c7bb34c506328c1f3824a6cf20.png)

Al habilitar la ordenación por arrastre para una tabla, debe seleccionar un campo de ordenación.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_50_AM.png)



## Ordenación por arrastrar y soltar para filas de tabla


![](https://static-docs.nocobase.com/drag-sort.2026-02-12%2008_19_00.gif)



## Explicación de las reglas de ordenación

Suponga que el orden actual es:

```
[1,2,3,4,5,6,7,8,9]
```

Cuando un elemento (por ejemplo, el 5) se mueve hacia adelante a la posición del 3, solo cambiarán los valores de ordenación de 3, 4 y 5: el 5 ocupa la posición del 3, y el 3 y el 4 se desplazan una posición hacia atrás cada uno.

```
[1,2,5,3,4,6,7,8,9]
```

Si luego mueve el 6 hacia atrás a la posición del 8, el 6 ocupará la posición del 8, y el 7 y el 8 se desplazarán una posición hacia adelante cada uno.

```
[1,2,5,3,4,7,8,6,9]
```