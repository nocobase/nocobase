---
title: "Configuración de la interfaz"
description: "El Skill de configuración de la interfaz sirve para crear y editar las páginas, los bloques, los campos y la configuración de las acciones de NocoBase."
keywords: "Constructor de IA, configuración de la interfaz, páginas, bloques, ventanas emergentes, interacción, UI Builder"
---

# Configuración de la interfaz

:::tip Requisitos previos

Antes de leer esta página, asegúrese de haber instalado el NocoBase CLI y de haber completado la inicialización siguiendo la guía de [Inicio rápido del Constructor de IA](./index.md).

:::

## Introducción

El Skill de configuración de la interfaz sirve para crear y editar las páginas, los bloques, los campos y la configuración de las acciones de NocoBase: usted describe la página deseada en lenguaje de negocio y el Skill se encarga de generar el plano, distribuir los bloques y enlazar las interacciones.


## Capacidades

Lo que puede hacer:

- Crear páginas completas: tabla, formulario de filtro y ventana emergente de detalles, todo de una vez
- Editar páginas existentes: añadir bloques, ajustar campos, configurar ventanas emergentes y modificar el diseño
- Definir interacciones: valores por defecto, mostrar u ocultar campos, cálculos vinculados y estado de los botones de acción
- Reutilizar mediante plantillas: las ventanas emergentes y los bloques repetidos pueden guardarse como plantillas
- Admitir tareas con varias páginas: construir una a una en orden

Lo que no puede hacer:

- No puede configurar permisos ACL (utilice el [Skill de configuración de permisos](./acl))
- No puede diseñar la estructura de las tablas (utilice el [Skill de modelado de datos](./data-modeling))
- No puede orquestar flujos de trabajo (utilice el [Skill de gestión de flujos de trabajo](./workflow))
- No puede tratar la navegación de las páginas no modernas (v1); solo admite las páginas v2.

## Ejemplos de prompts

### Caso A: crear una página de gestión

```
Ayúdame a crear una página de gestión de clientes que incluya un cuadro de búsqueda por nombre y una tabla de clientes; la tabla debe mostrar nombre, teléfono, correo electrónico y fecha de creación
```

El Skill leerá primero los campos de la tabla, generará el plano de la página y lo aplicará.

![Crear una página de gestión](https://static-docs.nocobase.com/20260420100608.png)


### Caso B: configurar una ventana emergente

```
Al hacer clic en el nombre de un cliente en la tabla, abre una ventana emergente de detalles que muestre todos los campos
```

Se preferirá utilizar la ventana emergente del campo (que se abre al hacer clic) en lugar de añadir un botón de acción adicional.

![Configurar una ventana emergente](https://static-docs.nocobase.com/20260420100641.png)

### Caso C: definir reglas de interacción

```
En la ventana emergente /admin/c0vc2vmkfll/view/cec3e7a69ac/filterbytk/1, añade una regla de campo al formulario de edición:
cuando el id del usuario sea 1, no se permita editar username
```

Se implementará configurando una regla de interacción y no será necesario escribir la configuración manualmente.

![Definir reglas de interacción](https://static-docs.nocobase.com/20260420100709.png)

### Caso D: construcción de varias páginas

```
Ayúdame a construir un sistema de gestión de usuarios con dos páginas: la página de gestión de usuarios y la página de gestión de roles, ambas dentro de un mismo grupo de páginas.
```

Se ofrecerá un diseño sencillo de varias páginas; tras los ajustes y la confirmación humana, se procederá a la construcción.

![Construcción de varias páginas](https://static-docs.nocobase.com/20260420100731.png)

## Preguntas frecuentes

**¿Qué hago si tras crear la página los bloques no muestran datos?**

Confirme primero que la tabla correspondiente realmente contiene registros. Compruebe también que la colección y la fuente de datos vinculadas al bloque sean correctas. También puede utilizar el [Skill de modelado de datos](./data-modeling) para crear datos de prueba.

**¿Qué hago si quiero colocar varios bloques en una ventana emergente?**

Puede describir el contenido de la ventana emergente en el prompt, por ejemplo: «en la ventana emergente de edición coloca un formulario y una tabla relacionada». El Skill generará un diseño de ventana emergente personalizada con varios bloques.

**¿La configuración manual y la configuración mediante IA se afectan entre sí?**

Si la configuración manual y la configuración mediante IA se realizan al mismo tiempo, sí se afectarán mutuamente; si no se realizan en el mismo momento, no habrá afectación.

## Enlaces relacionados

- [Visión general del Constructor de IA](./index.md): resumen de todos los Skills del Constructor de IA y formas de instalación
- [Modelado de datos](./data-modeling): cree y gestione tablas, campos y relaciones con la IA
- [Configuración de permisos](./acl): configure roles y permisos de acceso a los datos
- [Gestión de flujos de trabajo](./workflow): cree, edite y diagnostique flujos de trabajo
