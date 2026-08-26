---
title: "Gestión de publicación"
description: "El Skill de gestión de publicación sirve para realizar operaciones de publicación auditables entre varios entornos, con restauración de copias de seguridad y migración."
keywords: "Constructor de IA,gestión de publicación,publicación entre entornos,restauración de copias de seguridad,migración"
---

# Gestión de publicación

:::tip Requisitos previos

- Antes de leer esta página, instala NocoBase CLI y completa la inicialización siguiendo [Inicio rápido del Constructor de IA](./index.md)
- Se necesita una licencia de la edición Profesional o superior. Consulta [NocoBase Edición Comercial](https://www.nocobase.com/cn/commercial)
- Activa los plugins «Gestión de copias de seguridad» y «Gestión de migraciones», y actualízalos a la última versión

:::

## Introducción

El Skill de gestión de publicación sirve para realizar operaciones de publicación entre varios entornos de NocoBase. Admite dos formas: restauración de copias de seguridad y migración.

Si solo quieres sobrescribir por completo un entorno con otro, normalmente basta con la restauración de copias de seguridad. Si necesitas controlar mediante reglas qué contenido se sincroniza, por ejemplo, sincronizar solo la estructura y no los datos de negocio, la migración es más adecuada.

## Capacidades

- Restauración de copia de seguridad en un solo entorno: restaura el entorno actual con un paquete de copia de seguridad existente
- Restauración inmediata en un solo entorno: primero crea una copia de seguridad del entorno actual y luego restaura el entorno actual con esa copia
- Restauración de copia de seguridad entre entornos: restaura el paquete de copia de seguridad del entorno origen en el entorno destino
- Migración entre entornos: actualiza el entorno destino de forma diferencial con un paquete de migración

## Ejemplos de prompts

### Caso A: restauración en un solo entorno con archivo especificado

:::tip Requisitos previos

En el entorno actual debe existir un archivo de copia de seguridad con el mismo nombre.

:::

```text
Restaurar usando la copia de seguridad <file-name.nbdata>
```

El Skill usa el archivo de copia de seguridad con el mismo nombre que ya existe en el servidor del entorno actual para realizar la restauración.

### Caso B: restauración en un solo entorno sin especificar archivo

```text
Realizar copia de seguridad y restauración del entorno actual
```

El Skill primero crea una copia de seguridad del entorno actual y luego restaura el entorno actual con esa copia.

### Caso C: restauración de copia de seguridad entre entornos

:::tip Requisitos previos

Prepara dos entornos, por ejemplo, un entorno dev local y un entorno test remoto, o dos entornos locales. Puedes especificar un archivo de copia de seguridad concreto o no especificarlo.

:::

```text
Restaurar dev en test
```

El Skill crea un paquete de copia de seguridad en el entorno dev y luego restaura ese paquete en el entorno test.

### Caso D: migración entre entornos

:::tip Requisitos previos

Igual que en el caso C, prepara dos entornos. Puedes especificar un archivo de migración concreto o no especificarlo.

:::

```text
Migrar dev a test
```

El Skill crea un paquete de migración en el entorno dev y luego usa ese paquete para actualizar el entorno test.

## Preguntas frecuentes

**¿Debo elegir restauración de copia de seguridad o migración?**

La opción predeterminada es la restauración de copia de seguridad, sobre todo si ya tienes un paquete de copia de seguridad utilizable o quieres que el entorno destino quede completamente sobrescrito con el estado del entorno origen. Usa la migración solo cuando necesites controlar el alcance de la sincronización mediante reglas, por ejemplo, sincronizar solo la estructura y no los datos.

**¿Qué significa que falte el plugin de migración?**

El plugin de gestión de migraciones requiere una licencia de la edición Profesional o superior. Consulta [NocoBase Edición Comercial](https://www.nocobase.com/cn/commercial) para más detalles.

## Enlaces relacionados

- [Visión general del Constructor de IA](./index.md) — resumen de todos los Skills del Constructor de IA y formas de instalación
- [Gestión de entornos](./env-bootstrap) — comprobación del entorno, instalación, despliegue y diagnóstico de fallos
