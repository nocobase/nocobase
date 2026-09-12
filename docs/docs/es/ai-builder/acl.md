---
title: "Configuración de permisos"
description: "El Skill de configuración de permisos sirve para gestionar mediante lenguaje natural los roles, las políticas de permisos, la vinculación de usuarios y la evaluación de riesgos ACL de NocoBase."
keywords: "Constructor de IA, configuración de permisos, ACL, roles, permisos, vinculación de usuarios, evaluación de riesgos"
---

# Configuración de permisos

:::tip Requisitos previos

Antes de leer esta página, asegúrese de haber instalado el NocoBase CLI y de haber completado la inicialización siguiendo la guía de [Inicio rápido del Constructor de IA](./index.md).

:::

## Introducción

El Skill de configuración de permisos sirve para gestionar mediante lenguaje natural los roles, las políticas de permisos, la vinculación de usuarios y la evaluación de riesgos ACL de NocoBase: usted describe el objetivo de negocio y el Skill se encarga de elegir los comandos y los parámetros.


## Capacidades

- Crear nuevos roles
- Cambiar el modo global de roles (modo independiente / modo combinado)
- Configurar de forma masiva los permisos de acción y los rangos de datos de las tablas
- Desvincular la relación entre usuarios y roles
- Generar informes de evaluación de riesgos a nivel de rol, de usuario y de sistema

## Ejemplos de prompts

### Caso A: vinculación masiva de usuarios
:::tip Requisitos previos
En el entorno actual existe un rol Member y varios usuarios.
:::

```
Ayúdame a vincular el rol Member a estos nuevos usuarios: James, Emma, Michael
```

![Vinculación masiva de usuarios](https://static-docs.nocobase.com/20260422202343.png)

### Caso B: configuración masiva de permisos de páginas
:::tip Requisitos previos
En el entorno actual existe un rol Member y varias páginas.
:::
```
Ayúdame a configurar los permisos del rol Member para estas páginas: Product, Order, Stock
```

![Configuración masiva de permisos de páginas](https://static-docs.nocobase.com/20260422202949.png)

### Caso C: configuración masiva de permisos sobre varias tablas
:::tip Requisitos previos
En el entorno actual existe un rol Member y varias tablas de datos.
:::

```
Añade al rol Member permisos independientes de solo lectura sobre estas tablas: order, product, stock
```

![Configuración masiva de permisos independientes sobre tablas](https://static-docs.nocobase.com/20260422205341.png)

![Configuración masiva de permisos independientes sobre tablas 2](https://static-docs.nocobase.com/20260422205430.png)

### Caso D: configuración de permisos de varios roles sobre varias tablas
:::tip Requisitos previos
En el entorno actual existen varios roles y varias tablas de datos.
:::

```
Añade a los roles Member y Sales permisos independientes de lectura y escritura sobre estas tablas: order, product, stock
```

![Configuración de varios roles sobre varias tablas](https://static-docs.nocobase.com/20260422213524.png)

### Caso E: evaluación de riesgos

```
Evalúa el riesgo de los permisos del rol Member
```

Se generará una puntuación de riesgo, una descripción del alcance del impacto y recomendaciones de mejora.

## Preguntas frecuentes

**¿Qué hago si configuré los permisos pero no surten efecto?**

Compruebe primero que el modo global de roles sea el correcto: si un usuario tiene varios roles a la vez, el comportamiento del modo combinado y del modo independiente difiere notablemente; consulte el modo actual para confirmar el problema.

## Enlaces relacionados

- [Visión general del Constructor de IA](./index.md): resumen de todos los Skills del Constructor de IA y formas de instalación
- [NocoBase CLI](../ai/quick-start.md): herramienta de línea de comandos para instalar y gestionar NocoBase
