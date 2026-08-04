---
title: "Inicio rápido del Constructor de IA"
description: "El Constructor de IA es la capacidad de construcción asistida por IA de NocoBase: use lenguaje natural para el modelado de datos, la construcción de la interfaz, la orquestación de flujos de trabajo y la configuración de permisos, mediante configuración no-code o mediante código escrito por la IA."
keywords: "Constructor de IA, AI Builder, NocoBase AI, Agent Skills, construcción con lenguaje natural, low-code IA, AI Portal, inicio rápido"
---

# Inicio rápido del Constructor de IA

El Constructor de IA es la capacidad de construcción asistida por IA que ofrece NocoBase: usted describe sus necesidades de negocio en lenguaje natural y un AI Agent le construye el sistema. Cubre toda la cadena, desde el modelado de datos, la construcción de la interfaz, la orquestación de flujos de trabajo y la configuración de permisos hasta la puesta en producción.

En cuanto a **cómo se construye la interfaz**, existen dos vías:

- **IA + construcción con Portal no-code**: la IA construye la interfaz del sistema a partir de las capacidades de configuración no-code de NocoBase, y el resultado es una configuración guardada en la base de datos. Es adecuado para el CRUD estándar y los back-office internos, y el personal de negocio puede seguir ajustándolo después desde la propia interfaz
- **Construcción con AI Portal**: NocoBase aporta la base (datos, autenticación, permisos, etc.) y el AI Agent escribe código directamente en local, con un resultado que puede confirmarse tal cual en Git. Una vez compilado y desplegado, se accede a él a través del [AI Portal](./ai-portal/index.md). Es adecuado para interacciones a medida, sistemas de negocio complejos y escenarios con requisitos visuales específicos

Elija la vía que elija, las tablas, los permisos y los flujos de trabajo utilizan el mismo conjunto de Skills: mientras el AI Agent escribe las páginas, también puede crear las tablas y configurar los permisos, construyendo paso a paso, mediante conversación, un sistema de negocio completo.

## Cómo elegir entre las dos vías

Cada una de esas dos vías se corresponde con una entrada de acceso. Una aplicación NocoBase puede tener varias entradas que comparten los mismos datos, y la ruta de acceso indica de cuál se trata:

```text
/v/<name>    Portal no-code
/x/<name>    AI Portal
```

![two types of portal](https://static-docs.nocobase.com/20260804091849.png)

Las diferencias:

| | Portal no-code | AI Portal |
| --- | --- | --- |
| Ruta de acceso | `/v/<name>` | `/x/<name>` |
| De dónde salen las páginas | Se configuran en la interfaz, y la IA puede ayudar a cambiar la configuración | Código fuente React escrito por el AI Agent |
| Resultado | Configuración guardada en la base de datos | Código fuente que puede confirmarse en Git |
| Forma de iterar | Haciendo clic en la interfaz, o pidiendo a la IA que cambie la configuración | Cambiando el código, `dev` → `deploy` |
| Gestión de versiones | Instantáneas mediante [Control de versiones](./version-control.md) | Git, o el source storage de NocoBase |
| Libertad en la interfaz | Limitada por las capacidades de los bloques, con patrones establecidos de diseño e interacción | Lo que usted quiera que sea |
| Capacidades ya disponibles | Dashboards, calendario, vista kanban y otros bloques listos para usar | El código de plantilla estándar que ofrecemos, o lo que implemente el propio AI Agent |
| Curva de aprendizaje | Requiere conocer los bloques, los campos y demás conceptos de NocoBase | Requiere cierta familiaridad con el uso de AI Agents |
| Adecuado para | CRUD estándar, back-office internos | Interacciones a medida, sistemas de negocio complejos, requisitos visuales específicos |

Con un Portal no-code basta en estos casos:

- La estructura de la página es muy estándar, una tabla y un formulario corrientes, y configurarla es más rápido que escribir código
- El personal de negocio que no escribe código necesita ajustar las páginas por su cuenta
- Solo quiere usar las capacidades de bloques integradas en NocoBase, como dashboards, vistas de calendario y vistas kanban
- Construye usted solo, o no necesita que varias personas construyan a la vez

Para el resto de los casos recomendamos construir con el [AI Portal](./ai-portal/index.md). En la construcción con Portal no-code, la IA tiene demasiado contexto que aprender —tipos de bloques, estructuras de configuración, reglas de interacción— y, para sistemas de negocio que requieren una construcción compleja, ni la eficiencia ni la mantenibilidad ni la colaboración en equipo resultan suficientes.

Así que cambiamos de enfoque: **escribir código frontend es lo que mejor hace la IA**, así que dejemos que haga lo que mejor se le da. NocoBase actúa como base del núcleo del sistema y el frontend queda en manos de la IA. Los mismos requisitos, más rápido y mejor. **La IA construye con libertad. NocoBase se encarga de la fiabilidad.**

Los dos modos también pueden combinarse: configure rápidamente el back-office interno con un Portal no-code y afine el portal de cara al cliente con un AI Portal; ambos viven en la misma aplicación y comparten los mismos datos y usuarios.

## Inicio rápido

::: warning Atención
Para probar la construcción con AI Portal, instale la versión alpha del NocoBase CLI (`npm install -g @nocobase/cli@alpha`).
:::

Si ya ha instalado el [NocoBase CLI](../ai/quick-start.md), puede omitir este paso.

### Instalación con IA en un solo paso

Copie el siguiente prompt a su asistente de IA (Claude Code, Codex, Cursor, Trae, etc.) y la instalación y configuración se completarán automáticamente:

```
Ayúdame a instalar el NocoBase CLI y a inicializarlo: https://docs.nocobase.com/es/ai/ai-quick-start.md (por favor, accede directamente al contenido del enlace)
```

### Instalación manual

```bash
npm install -g @nocobase/cli@alpha
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

### Construye un hito y la IA guarda una versión restaurable por ti

Después de terminar una página, un conjunto de tablas de datos o un flujo de trabajo, deja que la IA guarde el estado actual como versión: si una configuración sale mal, siempre puedes volver al último hito claro.

```
Guarda la construcción actual como versión: página de gestión de clientes, área de filtros y formulario de edición completados
```

![La IA crea una versión después de construir](https://static-docs.nocobase.com/20260611115804.png)

La IA no guarda una versión cada vez que cambia un campo; solo guarda tras completar y verificar un hito claro, lo que mantiene la lista de versiones legible y facilita decidir a dónde volver.

Para conocer más sobre el control de versiones, consulte [Control de versiones](./version-control).

### Orqueste flujos de trabajo automatizados con una sola frase

Describa las condiciones de activación y la lógica de procesamiento del flujo de negocio, y la IA creará automáticamente los disparadores y la cadena de nodos.

```
Ayúdame a orquestar un flujo de trabajo que descuente automáticamente el inventario de productos después de crear un pedido
```

![Flujo de descuento de inventario al crear un pedido](https://static-docs.nocobase.com/20260419234303.png)

Para conocer más usos de los flujos de trabajo, consulte [Gestión de flujos de trabajo](./workflow).

### Describa la página en lenguaje de negocio y la IA la construirá

NocoBase ofrece por defecto un **AI Portal** y un **Portal no-code**. No necesita aprender reglas de configuración: simplemente diga qué tipo de página desea —cuadro de búsqueda, tabla, condiciones de filtro— y la obtendrá.

![portal manage](https://static-docs.nocobase.com/20260804104517.png)

Si construye mediante un Portal no-code (el Portal por defecto se llama admin), sirva de referencia lo siguiente:

```
Ayúdame a crear en admin una página de gestión de clientes que incluya un cuadro de búsqueda por nombre y una tabla de clientes; la tabla debe mostrar nombre, teléfono, correo electrónico y fecha de creación
```

![Página de gestión de clientes](https://static-docs.nocobase.com/20260420100608.png)

Si construye en modo AI Portal (el Portal por defecto se llama main), sirva de referencia lo siguiente:

```
Ayúdame a crear en el portal main una página de gestión de clientes que incluya un cuadro de búsqueda y una tabla de clientes; la tabla debe mostrar nombre, teléfono y sector
```

![portal página](https://static-docs.nocobase.com/20260803204422.png)

Para conocer más usos de la configuración de la interfaz, consulte [Configuración de la interfaz](./ui-builder) o [Construcción con AI Portal](./ai-portal/index.md).

## Seguridad y auditoría

Antes de permitir que un AI Agent opere NocoBase, le recomendamos comprender los métodos de autenticación, el control de permisos y la auditoría de operaciones, para asegurarse de que la IA solo haga lo que debe y de que cada paso quede registrado. Consulte [Seguridad y auditoría](./security).

## NocoBase Skills

Los [NocoBase Skills](https://github.com/nocobase/skills) son paquetes de conocimiento de dominio que se pueden instalar en un AI Agent y permiten que la IA comprenda el sistema de configuración de NocoBase. NocoBase ofrece varios Skills que cubren todo el flujo de construcción:

- [Gestión de entornos](./env-bootstrap) — comprobación del entorno, instalación, despliegue, actualización y diagnóstico de fallos
- [Modelado de datos](./data-modeling) — creación y gestión de tablas, campos y relaciones
- [Configuración de la interfaz](./ui-builder) — creación y edición de páginas, bloques, ventanas emergentes e interacciones
- [Gestión de flujos de trabajo](./workflow) — creación, edición, activación y diagnóstico de flujos de trabajo
- [Configuración de permisos](./acl) — gestión de roles, políticas de permisos, vinculación de usuarios y evaluación de riesgos
- [Soluciones](./dsl-reconciler) — construcción masiva de un sistema de negocio completo a partir de YAML
- [Gestión de plugins](./plugin-manage) — consultar, activar y desactivar plugins
- [Gestión de publicación](./publish) — publicación entre entornos, copia de seguridad, restauración y migración
- [Control de versiones](./version-control) — guardar versiones restaurables después de hitos completados
- [Construcción con AI Portal](https://github.com/nocobase/skills/blob/main/skills/nocobase-ai-builder/SKILL.md) - permita que el AI Agent escriba código en un AI Portal para construir las interfaces del sistema

:::tip Sugerencia

El NocoBase CLI instala automáticamente los Skills durante la inicialización (`nb init`); no es necesario instalarlos manualmente.

:::

## Enlaces relacionados

- [AI Portal](./ai-portal/index.md) — la otra forma de construir, con el AI Agent escribiendo directamente el código frontend
- [NocoBase CLI](../ai/quick-start.md): herramienta de línea de comandos para instalar y gestionar NocoBase
- [Referencia de NocoBase CLI](../api/cli/index.md): descripción completa de los parámetros de todos los comandos
- [Plugin de desarrollo con IA](../ai-dev/index.md): desarrollar plugins de NocoBase con ayuda de la IA
- [Seguridad y auditoría](./security): métodos de autenticación, control de permisos y auditoría de operaciones
- [AI Employees](../ai-employees/index.md): la capacidad de agentes inteligentes de NocoBase, que permite la colaboración y la ejecución de operaciones dentro de la interfaz de negocio
