---
title: "Modelado de datos"
description: "El Skill de modelado de datos sirve para crear y gestionar mediante lenguaje natural las tablas de NocoBase, incluyendo la creación de tablas, la adición de campos y la definición de relaciones."
keywords: "Constructor de IA, modelado de datos, tablas, campos, relaciones, colecciones"
---

# Modelado de datos

:::tip Requisitos previos

Antes de leer esta página, asegúrese de haber instalado el NocoBase CLI y de haber completado la inicialización siguiendo la guía de [Inicio rápido del Constructor de IA](./index.md).

:::

## Introducción

El Skill de modelado de datos sirve para crear y gestionar mediante lenguaje natural las tablas de NocoBase: crear tablas, añadir campos, definir relaciones, etc.

Antes de utilizarlo, asegúrese de que la fuente de datos de destino esté configurada en «Gestión de fuentes de datos».


## Capacidades

- Crear, modificar y eliminar tablas; admite tablas normales, tablas de árbol, tablas de archivos, tablas de calendario, tablas SQL, tablas de vista y tablas heredadas
- Añadir, modificar y eliminar campos, incluyendo los distintos tipos de campos integrados en NocoBase (incluidos los campos de relación) y los tipos de campos extendidos por plugins

## Ejemplos de prompts

### Caso A: crear una tabla

```
Por favor, crea una tabla de archivos para gestionar contratos
```

El Skill guiará a la IA para analizar los campos necesarios y su tipo correspondiente en NocoBase, y a continuación creará la tabla del tipo archivo y añadirá los campos correspondientes en el sistema.

![Crear una tabla](https://static-docs.nocobase.com/202604162103369.png)

### Caso B: añadir un campo

```
Por favor, añade en la tabla de usuarios un campo de estado para indicar si el usuario está activo, con tres estados: activo, en proceso de baja y dado de baja
```

El Skill guiará a la IA para obtener los metadatos de la tabla de usuarios y deducirá que el tipo de campo correspondiente en NocoBase para indicar si está activo es «menú desplegable (selección única)»; después añadirá el campo en la tabla de usuarios y configurará los valores de la enumeración.

![Añadir un campo](https://static-docs.nocobase.com/202604162112692.png)

### Caso C: inicializar el modelo de datos

```
Estoy construyendo un CRM, ayúdame a diseñar y construir el modelo de datos
```

El Skill creará en el sistema las tablas según el modelo de datos analizado y diseñado por la IA, añadirá los campos y configurará las relaciones.

![Inicializar el modelo de datos](https://static-docs.nocobase.com/202604162126729.png)

![Resultado de la inicialización del modelo de datos](https://static-docs.nocobase.com/202604162201867.png)

### Caso D: añadir un módulo funcional

```
Quiero añadir el modelo de datos de gestión de pedidos de usuario al sistema CRM actual
```

El Skill guiará a la IA para obtener el modelo de datos actual del sistema y, a partir de él, completar el diseño del modelado para la nueva funcionalidad; después creará automáticamente las tablas, añadirá los campos y configurará las relaciones.

![Añadir un módulo funcional](https://static-docs.nocobase.com/202604162203006.png)

![Resultado de añadir un módulo funcional](https://static-docs.nocobase.com/202604162203893.png)

## Preguntas frecuentes

**¿Se crean automáticamente los campos del sistema al crear una tabla?**

Sí. Los campos del sistema `id`, `createdAt`, `createdBy`, `updatedAt` y `updatedBy` los genera automáticamente el servidor; no es necesario especificarlos manualmente.

**¿Qué hago si me equivoqué al crear una relación?**

Le recomendamos comprobar primero la clave foránea y el campo inverso de la relación actual y, a continuación, decidir si la modifica o la elimina y la vuelve a crear. El Skill volverá a leer y validar el estado de la relación en ambos extremos después del cambio.

**¿Cómo se crea una tabla basada en un tipo de tabla extendido por un plugin?**

Para ello, el plugin correspondiente debe estar habilitado. Si no lo está, normalmente la IA intentará habilitarlo; si la IA no lo consigue, habilítelo manualmente.

**¿Cómo se añade un campo basado en un tipo de campo extendido por un plugin?**

Igual que en el caso anterior.

## Enlaces relacionados

- [Visión general del Constructor de IA](./index.md): resumen de todos los Skills del Constructor de IA y formas de instalación
- [Configuración de la interfaz](./ui-builder): una vez creadas las tablas, construya páginas y bloques con la IA
- [Soluciones](./dsl-reconciler): construya un sistema de negocio completo de forma masiva a partir de YAML
