---
title: "Campos"
description: "Conoce la función de los campos de NocoBase, cómo crearlos y gestionarlos, los escenarios de uso de los tipos de campo, cómo crear campos desde una página y la lógica de mapeo de campos de las fuentes de datos principales y externas."
keywords: "Campos,Field type,Field interface,mapeo de campos,campo de título,restricción única,campo de relación,NocoBase"
---

# Campos

## Introducción

En NocoBase, un **Field (campo)** es una propiedad empresarial utilizada en una [Collection (tabla de datos)](../collection.md) para describir los datos. Indica qué información puede almacenarse en un registro y cómo se introduce, muestra, filtra y utiliza esa información en la lógica empresarial de las páginas.

| Definición | Descripción |
| --- | --- |
| Qué datos se guardan | Por ejemplo, texto, números, fechas, archivos, estados, relaciones y JSON. |
| Cómo se utilizan en las páginas | Por ejemplo, para introducir y mostrar datos mediante campos de entrada, selectores de fecha, menús desplegables, carga de archivos adjuntos y selectores de relaciones. |
| Cómo participan en las capacidades empresariales | Los campos son utilizados por bloques de página, filtros, ordenación, permisos, flujos de trabajo, API, importación y exportación de datos, entre otras funciones. |

Puede corresponder a:
- Una columna de base de datos real en la base de datos principal
- Una columna de base de datos existente en una base de datos externa
- Un campo de una vista de base de datos
- Un campo del resultado de una consulta SQL
- Un campo de la respuesta de una API REST
- Un campo de relación, un campo del sistema o un campo virtual de una tabla de datos

Puedes entenderlo como “una propiedad de un objeto empresarial”. Por ejemplo:

| Objeto empresarial | Field correspondiente |
| --- | --- |
| Cliente | Nombre del cliente, número de teléfono móvil, nivel del cliente, responsable |
| Pedido | Número de pedido, importe del pedido, estado del pedido, cliente |
| Contrato | Nombre del contrato, fecha de firma, archivo adjunto del contrato, estado de aprobación |
| Tarea | Título de la tarea, fecha límite, prioridad, responsable de la ejecución |
| Archivo | Nombre del archivo, tamaño, tipo MIME, URL |

## Escenarios de uso

A continuación se organizan los escenarios de uso habituales según la categoría de campo. Esta sección te ayuda a determinar primero qué tipo de campo elegir. Para consultar la configuración específica, el mapeo de tipos y las consideraciones importantes, puedes acceder a la documentación de la categoría correspondiente.

| Categoría de campo | Escenarios de uso |
| --- | --- |
| [Campos de texto](./basic/input.md) | Adecuados para guardar nombres, números, descripciones, datos de contacto, direcciones URL y otros contenidos. |
| [Campos de texto enriquecido](./media/rich-text.md) | Adecuados para guardar textos principales, documentos descriptivos, soluciones de tratamiento, fragmentos de código y otros contenidos más complejos. |
| [Campos numéricos](./basic/number.md) | Adecuados para guardar cantidades, importes, puntuaciones, proporciones y otros valores numéricos. |
| [Campos de fecha y hora](./datetime/index.md) | Adecuados para guardar instantes, fechas, horas, marcas de tiempo de sistemas externos y otros datos relacionados. |
| [Campos de estado y opciones](./choices/select.md) | Adecuados para guardar valores dentro de un rango fijo, como si está habilitado, el estado del pedido, el nivel del cliente y las etiquetas del cliente. |
| [Campos de archivos adjuntos](./media/field-attachment.md) | Adecuados para cargar archivos o guardar direcciones de archivos externos. |
| [Campos de relación](./associations/index.md) | Adecuados para expresar conexiones entre distintas tablas de datos, como que un pedido pertenece a un cliente, un cliente tiene pedidos o un usuario está asociado a roles. |
| [Campos de identificación y codificación](./advanced/uuid.md) | Adecuados para guardar claves principales internas, ID de sincronización externos, identificadores de acceso público y números de negocio. |
| [Campos de figuras geométricas](./geometric/point.md) | Adecuados para guardar información espacial o geográfica, como la ubicación de una tienda, rutas de reparto y áreas de servicio. |
| [Campos del sistema](./system-info/created-at.md) | Adecuados para guardar información del sistema mantenida por NocoBase o la base de datos, como el ID, la hora de creación, el creador y la hora de actualización. |
| [Otros campos](./advanced/json.md) | Adecuados para gestionar necesidades relacionadas con campos que no pertenecen directamente a otras categorías, como ordenación, fórmulas y JSON. |

## Tipos de Interface de los campos

Desde la perspectiva de Interface, NocoBase divide los campos en las siguientes categorías:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Tipos de datos de los campos

Cada Field Interface tiene un tipo de datos predeterminado. Por ejemplo, en un campo cuyo Interface es numérico (Number), el tipo de datos predeterminado es double, aunque también puede ser float, decimal, entre otros. Actualmente se admiten los siguientes tipos de datos:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Mapeo de tipos de campo

El flujo para añadir un campo a la base de datos principal es:

1. Seleccionar el tipo de Interface
2. Configurar los tipos de datos disponibles para el Interface actual

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

El flujo de mapeo de campos de una fuente de datos externa es:

1. Mapear automáticamente, según el tipo de campo de la base de datos externa, el tipo de datos correspondiente (Field type) y el tipo de UI (Field Interface).
2. Modificar según sea necesario al tipo de datos y al tipo de Interface más adecuados

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)