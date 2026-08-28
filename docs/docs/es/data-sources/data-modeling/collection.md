---
title: "Tabla de datos"
description: "Conoce la función de las tablas de datos de NocoBase, los tipos de estructuras de tabla, las diferencias entre la base de datos principal y las tablas de datos externas, así como cómo elegir entre tablas normales, tablas heredadas, tablas de árbol, tablas de archivos, tablas SQL y vistas de base de datos."
keywords: "tabla de datos,Collection,tabla normal,tabla heredada,tabla de árbol,tabla de archivos,tabla SQL,vista de base de datos,NocoBase"
---

# Tabla de datos

## Introducción

En NocoBase, **Collection (tabla de datos)** es un modelo de datos utilizado para describir un tipo de datos empresariales. No es simplemente el nombre de una tabla de base de datos, sino una descripción unificada que NocoBase hace de un tipo de datos.

Una Collection normalmente define tres aspectos:

| Definición | Descripción |
| --- | --- |
| Dónde se guardan los datos | Los datos pueden provenir de tablas de la base de datos principal, tablas de bases de datos externas, resultados de consultas SQL, vistas de base de datos, recursos de API REST o aplicaciones externas de NocoBase. |
| Qué campos existen | Los campos describen qué información contiene cada registro, como el nombre del cliente, el número de teléfono, el importe del pedido, la fecha de creación y el responsable. |
| Cómo la utiliza NocoBase | Los bloques de página, los permisos, los flujos de trabajo, las API y los campos de relación funcionan basándose en las Collections. |

Puedes entender una Collection como “la estructura de datos de un objeto empresarial”. Por ejemplo, «cliente», «pedido», «contrato» y «tarea» pueden ser Collections.

Después de crear o conectar una tabla de datos, normalmente es necesario realizar otras tres tareas:

- Configurar los campos para que la tabla de datos pueda almacenar la información necesaria para el negocio
- En la página, [añadir un bloque](../../interface-builder/blocks/index.md#添加区块) para que los usuarios puedan consultar, introducir y gestionar los datos
- Configurar los permisos, los flujos de trabajo y las API para que los datos puedan accederse y circular conforme a las reglas del negocio

## Tipos de estructura de tabla

- **Tabla normal** — adecuada para almacenar datos empresariales habituales, como clientes, pedidos, contratos, órdenes de trabajo, solicitudes de reembolso, proyectos y tareas
- **Tabla de árbol** — adecuada para almacenar datos jerárquicos, como estructuras organizativas, categorías de productos, niveles geográficos, directorios de departamentos y directorios de bases de conocimiento
- **Tabla de calendario** — adecuada para almacenar datos con intervalos de tiempo, como reservas de salas de reuniones, planificación de proyectos, horarios de cursos, planes de turnos y calendarios de actividades
- **Tabla de comentarios** — adecuada para almacenar debates generados en torno a registros empresariales, como comentarios de tareas, comentarios de artículos, opiniones sobre aprobaciones y comentarios de clientes; crea un [campo de relación](./collection-fields/associations/index.md) en una tabla empresarial (tabla normal, tabla de árbol o tabla de calendario) para asociarla con la tabla de comentarios y utiliza la página emergente de la tabla empresarial para crear un [bloque de comentarios](../../plugins/@nocobase/plugin-comments/index.md) y comentar los datos empresariales
- **Tabla de archivos** — adecuada para almacenar metadatos de archivos, como anexos de contratos, archivos de facturas, imágenes de productos y documentos de identidad de empleados; los archivos son almacenados físicamente por el motor de almacenamiento de archivos; crea un [campo de relación](./collection-fields/associations/index.md) en una tabla empresarial (tabla normal, tabla de árbol o tabla de calendario) para asociarla con la tabla de archivos y utiliza la tabla empresarial para crear un bloque y configurar el campo de relación para cargar archivos; los metadatos de los archivos se guardarán automáticamente en la tabla de archivos
- **Vista de base de datos** — una view que ya existe en la base de datos, como una vista de informes financieros, una vista filtrada de clientes o una vista agregada sincronizada entre varios sistemas
- **Tabla SQL** — adecuada para utilizar como tabla de datos los resultados de consultas SQL, como resúmenes de ventas, alertas de inventario, informes estadísticos entre varias tablas y paneles operativos
- **Tabla heredada** — adecuada cuando varios tipos de objetos empresariales comparten un conjunto de campos comunes, pero cada tipo tiene además sus propios campos específicos; por ejemplo, una tabla principal de activos de la que se derivan activos informáticos, activos de vehículos y mobiliario de oficina
