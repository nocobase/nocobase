---
title: "Block de filtro de árbol"
description: "Block de filtro de árbol: muestra las condiciones de filtrado en una estructura de árbol y filtra jerárquicamente los Blocks de datos, adecuado para escenarios de filtrado en cascada de datos arbóreos."
keywords: "filtro de árbol, TreeFilter, filtro arbóreo, filtrado jerárquico, refresh en cascada, Interface Builder, NocoBase"
---

# Filtro de árbol

## Introducción

El Block de filtro de árbol proporciona capacidad de filtrado de datos mediante una estructura de árbol, adecuado para escenarios de datos con relaciones jerárquicas, por ejemplo categorías de productos, organigramas, etc.  
El usuario puede seleccionar nodos de diferentes niveles para filtrar de forma vinculada los Blocks de datos relacionados.

## Cómo usarlo

El Block de filtro de árbol debe usarse junto con un Block de datos, al que proporcionará la capacidad de filtrado.

Pasos de configuración:

1. Active el modo de configuración y añada el Block "Filtro de árbol" y un Block de datos (por ejemplo, "Block de tabla") en la página.
2. Configure el Block de filtro de árbol seleccionando una Collection arbórea (por ejemplo, una tabla de categorías de productos).
3. Establezca la relación de conexión entre el Block de filtro de árbol y el Block de datos.
4. Una vez completada la configuración, al hacer clic en un nodo del árbol se filtrará el Block de datos.

## Añadir Block

En modo de configuración, haga clic en el botón "Añadir Block" de la página, y en la categoría "Blocks de filtro" seleccione "Árbol" para completar la adición.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_02_35_PM.png)

## Elementos de configuración del Block

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_12_PM%20(1).png)

### Conectar Block de datos

El Block de filtro de árbol debe estar conectado a un Block de datos para funcionar.  
Mediante el elemento de configuración "Conectar Block de datos", se puede establecer una relación de vinculación entre el filtro de árbol y los Blocks de tabla, lista, gráficos, etc. de la página, logrando así la funcionalidad de filtrado.

![](https://static-docs.nocobase.com/Tree-filter-04-07-2026_03_14_PM.png)

### Campo de título

Se utiliza para especificar el campo que muestra el nodo del árbol (es decir, el nombre del nodo).

### Búsqueda

Una vez activada, permite buscar y localizar rápidamente nodos del árbol mediante palabras clave, mejorando la eficiencia de la búsqueda.

### Expandir todo

Controla si todos los nodos del árbol se expanden por defecto al cargar la página por primera vez.

### Filtrar nodos hijos

Una vez activado, al seleccionar un nodo, también se incluirán todos sus nodos hijos en el filtrado.  
Adecuado para escenarios donde es necesario consultar todos los datos de subcategorías agrupados por una categoría padre.
