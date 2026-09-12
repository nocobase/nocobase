---
title: "Control de versiones"
description: "El Skill de control de versiones (nocobase-revision) crea versiones restaurables de la aplicación después de que AI Builder complete hitos."
keywords: "AI Builder,control de versiones,nocobase-revision,nb revision create,restaurar versión"
---

# Control de versiones

:::tip Requisitos previos

- Antes de leer esta página, instale NocoBase CLI y complete la inicialización según [Inicio rápido de AI Builder](./index.md)
- Active los plugins «Backup Management» y «Version Control»
- Las ediciones Community y Standard no incluyen el plugin Version Control. Si solo necesita un punto de retorno antes de cambios importantes, use [Backup Management](../ops-management/backup-manager/index.mdx)

:::

## Introducción

El Skill de control de versiones (`nocobase-revision`) crea una versión restaurable de la aplicación después de que AI Builder complete un hito significativo. Por ejemplo, tras construir una página, crear un grupo de colecciones o configurar un flujo de trabajo, la IA puede ejecutar `nb revision create` para guardar el estado actual.

No crea una versión por cada cambio de campo. De forma predeterminada, solo guarda cuando se completa y verifica un hito claro, para que la lista de versiones siga siendo fácil de leer y los puntos de restauración sean más sencillos de elegir.

Para conocer la lista de versiones, la creación manual, la restauración y la política de retención, consulte la [guía del plugin Version Control](../ops-management/version-control/index.md).

## Capacidades

Puede:

- Crear una versión después de completar y verificar un hito de construcción
- Escribir una descripción breve que indique qué se ha guardado
- Crear versiones usando el entorno CLI actual

No puede:

- Sustituir las capacidades base de guardado y restauración del plugin Backup Management
- Crear versiones si el plugin Version Control no está activado
- Restaurar automáticamente a una versión. Use el [plugin Version Control](../ops-management/version-control/index.md) para restaurar versiones

## Ejemplos de prompts

### Escenario A: Guardar una configuración de página terminada

```text
Guarda la construcción actual como versión: página de gestión de clientes, área de filtros y formulario de edición completados
```

El Skill convierte la descripción en una nota breve de versión y crea la versión.

Modo comando:

```bash
nb revision create "Página de gestión de clientes, área de filtros y formulario de edición completados"
```

### Escenario B: Guardar modelo de datos y flujo de trabajo

```text
Las colecciones de proveedores y el flujo de aprobación de compras ya están verificados. Crea una versión.
```

Es adecuado cuando el trabajo combina varias capacidades. Por ejemplo, crear colecciones con [Modelado de datos](./data-modeling), configurar un proceso de aprobación con [Gestión de flujos de trabajo](./workflow), verificar el resultado y luego guardar una versión.

### Escenario C: Crear una versión en un entorno específico

```text
En el entorno dev, guarda una versión: página de gestión de tickets y campos SLA completados
```

Si el entorno especificado no es el entorno CLI actual, el Skill confirma primero el destino para evitar guardar la versión en la aplicación equivocada.

Modo comando:

```bash
nb revision create --env dev --yes "Página de gestión de tickets y campos SLA completados"
```

## Cómo escribir descripciones de versión

La descripción debe indicar qué se ha completado, no solo usar una etiqueta vaga.

Recomendado:

- `Libro de clientes, página de detalle y flujo de aprobación completados`
- `Colecciones de proveedores, formulario de solicitud de compra y workflow de aprobación completados`
- `Completed customer detail page, edit form, and submission workflow wiring`

No recomendado:

- `snapshot`
- `backup`
- `test`
- `version 2`
- Solo una fecha o marca de tiempo

Además, no incluya tokens, URLs, contraseñas ni otra información sensible. La descripción aparece en la lista de versiones y debe mantenerse clara, legible y auditable.

## Preguntas frecuentes

**¿Cuándo debería crear una versión?**

Después de un hito que pueda revisarse de forma independiente. Por ejemplo, una página se abre y permite editar correctamente, las relaciones entre colecciones ya se verificaron o un workflow se guardó y se revisó su cadena de nodos.

**¿Por qué no crear una versión después de cada ajuste de la IA?**

Demasiadas versiones pequeñas hacen que la lista sea difícil de leer. Normalmente una versión debe representar un punto al que se puede volver para seguir trabajando, no solo un cambio de nombre de campo o un ajuste de posición de un botón.

**¿Hay que verificar el resultado antes de crear una versión?**

Sí. El Skill de control de versiones sirve para guardar resultados completados y verificados. Si una página todavía muestra errores o un workflow no está confirmado, pida a la IA que lo corrija y verifique primero.

**¿Dónde se restaura una versión?**

En la lista de versiones del plugin Version Control. Restaurar sobrescribe la configuración actual de la aplicación y los datos incluidos en esa versión. Antes de operar, lea la [guía del plugin Version Control](../ops-management/version-control/index.md).

## Enlaces relacionados

- [Guía del plugin Version Control](../ops-management/version-control/index.md) — crear versiones manualmente, restaurarlas y configurar reglas
- [Backup Management](../ops-management/backup-manager/index.mdx) — capacidad base requerida por Version Control
- [Resumen de AI Builder](./index.md) — resumen e instalación de todos los Skills de AI Builder
- [Gestión de publicación](./publish.md) — publicación entre entornos, copia de seguridad, restauración y migración
