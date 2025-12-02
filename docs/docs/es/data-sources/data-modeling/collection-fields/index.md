:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Campos de la colección

## Tipos de interfaz de los campos

NocoBase clasifica los campos en las siguientes categorías desde la perspectiva de la interfaz:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Tipos de datos de los campos

Cada interfaz de campo tiene un tipo de dato predeterminado. Por ejemplo, para los campos con la interfaz de tipo Número, el tipo de dato predeterminado es `double`, pero también puede ser `float`, `decimal`, etc. Los tipos de datos actualmente compatibles son:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Mapeo de tipos de campos

El proceso para añadir nuevos campos a la base de datos principal es el siguiente:

1. Seleccione el tipo de interfaz
2. Configure el tipo de dato opcional para la interfaz actual

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

El proceso de mapeo de campos desde fuentes de datos externas es:

1. Mapee automáticamente el tipo de dato correspondiente (tipo de campo) y el tipo de interfaz de usuario (interfaz de campo) basándose en el tipo de campo de la base de datos externa.
2. Modifique a un tipo de dato y tipo de interfaz más adecuados según sea necesario.

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)