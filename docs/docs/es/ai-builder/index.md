---
title: "Inicio rápido del Constructor de IA"
description: "El Constructor de IA es la capacidad de construcción asistida por IA de NocoBase, que permite realizar el modelado de datos, la configuración de la interfaz y la orquestación de flujos de trabajo mediante lenguaje natural, ofreciendo una experiencia de construcción más moderna y eficiente."
keywords: "Constructor de IA, AI Builder, NocoBase AI, Agent Skills, construcción con lenguaje natural, low-code IA, inicio rápido"
---

# Inicio rápido del Constructor de IA

El Constructor de IA es la capacidad de construcción asistida por IA que ofrece NocoBase: usted describe sus necesidades en lenguaje natural y la IA realiza automáticamente el modelado de datos, la configuración de páginas, la asignación de permisos y otras operaciones. Le proporciona una experiencia de construcción más moderna y eficiente.

## Inicio rápido

Si ya ha instalado el [NocoBase CLI](../ai/quick-start.md), puede omitir este paso.

### Instalación con IA en un solo paso

Copie el siguiente prompt a su asistente de IA (Claude Code, Codex, Cursor, Trae, etc.) y la instalación y configuración se completarán automáticamente:

```
Ayúdame a instalar el NocoBase CLI y a inicializarlo: https://docs.nocobase.com/cn/ai/ai-quick-start.md (por favor, accede directamente al contenido del enlace)
```

### Instalación manual

```bash
npm install -g @nocobase/cli@beta
nb init --ui
```

El navegador abrirá automáticamente la página de configuración visual, que le guiará para instalar los NocoBase Skills, configurar la base de datos y arrancar la aplicación. Para conocer los pasos detallados, consulte el [Inicio rápido](../ai/quick-start.md).

## Reemplace la configuración manual por una conversación

Una vez instalado el NocoBase CLI, podrá operar NocoBase directamente desde su asistente de IA mediante lenguaje natural. A continuación se presentan algunos casos reales, desde la creación de una sola tabla hasta la construcción de un sistema completo, para que perciba las capacidades del Constructor de IA.

### Describa la necesidad de negocio y la IA diseñará las tablas y sus relaciones

Indique a la IA qué tipo de sistema quiere construir y diseñará automáticamente las tablas, los tipos de campo y las relaciones; no necesitará dibujar usted mismo el diagrama ER.

```
Estoy construyendo un CRM, ayúdame a diseñar y construir el modelo de datos
```

![La IA diseña el modelo de datos del CRM](https://static-docs.nocobase.com/202604162126729.png)

La IA generó automáticamente las tablas de clientes, contactos, oportunidades y pedidos, junto con sus relaciones:

![Resultado del modelo de datos del CRM](https://static-docs.nocobase.com/202604162201867.png)

Para conocer más usos del modelado de datos, consulte [Modelado de datos](./data-modeling).

### Describa la página en lenguaje de negocio y la IA la construirá

No necesita aprender reglas de configuración: simplemente diga qué tipo de página desea —cuadro de búsqueda, tabla, condiciones de filtro— y la obtendrá.

```
Ayúdame a crear una página de gestión de clientes que incluya un cuadro de búsqueda por nombre y una tabla de clientes; la tabla debe mostrar nombre, teléfono, correo electrónico y fecha de creación
```

![Página de gestión de clientes](https://static-docs.nocobase.com/20260420100608.png)

Para conocer más usos de la configuración de la interfaz, consulte [Configuración de la interfaz](./ui-builder).

### Orqueste flujos de trabajo automatizados con una sola frase

Describa las condiciones de activación y la lógica de procesamiento del flujo de negocio, y la IA creará automáticamente los disparadores y la cadena de nodos.

```
Ayúdame a orquestar un flujo de trabajo que descuente automáticamente el inventario de productos después de crear un pedido
```

![Flujo de descuento de inventario al crear un pedido](https://static-docs.nocobase.com/20260419234303.png)

Para conocer más usos de los flujos de trabajo, consulte [Gestión de flujos de trabajo](./workflow).

### Tablas, páginas y dashboards, todo en un solo paso

:::warning Atención

La función de soluciones se encuentra todavía en fase de pruebas, su estabilidad es limitada y se ofrece únicamente para una experiencia preliminar.

:::

Describa con una sola frase su escenario de negocio y la IA construirá las tablas, las páginas de gestión, los dashboards y los gráficos.

```
Ayúdame a construir un sistema de gestión de tickets con la skill nocobase-dsl-reconciler, que incluya dashboard, lista de tickets, gestión de usuarios y configuración de SLA
```

La IA primero presenta el diseño de la solución y, una vez confirmado, la construye de una sola vez:

![Diseño del sistema de tickets](https://static-docs.nocobase.com/20260420100420.png)

![Resultado de la construcción del sistema de tickets](https://static-docs.nocobase.com/20260420100450.png)

Para conocer más sobre la construcción de sistemas completos, consulte [Soluciones](./dsl-reconciler).

## Seguridad y auditoría

Antes de permitir que un AI Agent opere NocoBase, le recomendamos comprender los métodos de autenticación, el control de permisos y la auditoría de operaciones, para asegurarse de que la IA solo haga lo que debe y de que cada paso quede registrado. Consulte [Seguridad y auditoría](./security).

## NocoBase Skills

Los [NocoBase Skills](https://github.com/nocobase/skills) son paquetes de conocimiento de dominio que se pueden instalar en un AI Agent y permiten que la IA comprenda el sistema de configuración de NocoBase. NocoBase ofrece 8 Skills que cubren todo el flujo de construcción:

- [Gestión de entornos](./env-bootstrap): comprobación del entorno, instalación, despliegue, actualización y diagnóstico de fallos
- [Modelado de datos](./data-modeling): creación y gestión de tablas, campos y relaciones
- [Configuración de la interfaz](./ui-builder): creación y edición de páginas, bloques, ventanas emergentes e interacciones
- [Gestión de flujos de trabajo](./workflow): creación, edición, activación y diagnóstico de flujos de trabajo
- [Configuración de permisos](./acl): gestión de roles, políticas de permisos, vinculación de usuarios y evaluación de riesgos
- [Soluciones](./dsl-reconciler): construcción masiva de un sistema de negocio completo a partir de YAML
- [Gestión de plugins](./plugin-manage): consultar, activar y desactivar plugins
- [Gestión de publicación](./publish): publicación entre entornos, copia de seguridad, restauración y migración

:::tip Sugerencia

El NocoBase CLI instala automáticamente los Skills durante la inicialización (`nb init`); no es necesario instalarlos manualmente.

:::

## Enlaces relacionados

- [NocoBase CLI](../ai/quick-start.md): herramienta de línea de comandos para instalar y gestionar NocoBase
- [Referencia de NocoBase CLI](../api/cli/index.md): descripción completa de los parámetros de todos los comandos
- [Plugin de desarrollo con IA](../ai-dev/index.md): desarrollar plugins de NocoBase con ayuda de la IA
- [Seguridad y auditoría](./security): métodos de autenticación, control de permisos y auditoría de operaciones
- [AI Employees](../ai-employees/index.md): la capacidad de agentes inteligentes de NocoBase, que permite la colaboración y la ejecución de operaciones dentro de la interfaz de negocio
