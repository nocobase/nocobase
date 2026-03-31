---
pkg: "@nocobase/plugin-data-source-main"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Colección de Herencia

## Introducción

:::warning
Solo compatible cuando la base de datos principal es PostgreSQL.
:::

Usted puede crear una colección padre y derivar colecciones hijas de ella. La colección hija heredará la estructura de la colección padre y también podrá definir sus propias columnas. Este patrón de diseño ayuda a organizar y gestionar datos con estructuras similares pero que pueden tener algunas diferencias.

A continuación, le presentamos algunas características comunes de las colecciones de herencia:

- **Colección Padre**: La colección padre contiene columnas y datos comunes, definiendo la estructura básica de toda la jerarquía de herencia.
- **Colección Hija**: La colección hija hereda la estructura de la colección padre, pero también puede definir sus propias columnas. Esto permite que cada colección hija tenga las propiedades comunes de la colección padre, a la vez que contiene atributos específicos de la subclase.
- **Consulta**: Al realizar consultas, usted puede elegir consultar toda la jerarquía de herencia, solo la colección padre o una colección hija específica. Esto le permite recuperar y procesar datos de diferentes niveles según sea necesario.
- **Relación de Herencia**: Se establece una relación de herencia entre la colección padre y la colección hija, lo que significa que la estructura de la colección padre se puede usar para definir atributos consistentes, mientras que la colección hija puede extender o anular estos atributos.

Este patrón de diseño ayuda a reducir la redundancia de datos, simplificar el modelo de base de datos y facilitar el mantenimiento de los datos. Sin embargo, debe usarse con precaución, ya que las colecciones heredables pueden aumentar la complejidad de las consultas, especialmente al tratar con toda la jerarquía de herencia. Los sistemas de bases de datos que admiten colecciones heredables suelen proporcionar sintaxis y herramientas específicas para gestionar y consultar estas estructuras de colección.

## Manual de Usuario

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)