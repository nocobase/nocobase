---
title: "Inicio rápido del AI Portal"
description: "La construcción con AI Portal consiste en que un AI Agent escriba el código de su sistema de negocio, mientras NocoBase aporta como base la autenticación, la base de datos, la API y los permisos. El código vive en una entrada de aplicación llamada AI Portal."
keywords: "construcción con AI Portal, Constructor de IA, AI Portal, NocoBase AI, base de NocoBase, desarrollo frontend, React, shadcn/ui, AI Agent, inicio rápido"
---

# Inicio rápido del AI Portal

Hemos observado que el vibe coding con IA puede producir una página con buen aspecto, pero le cuesta conectarse a un sistema de negocio real, o acaba reimplementando desde cero la autenticación, los permisos y el diseño de las tablas.

NocoBase, como plataforma low-code/no-code, ya ofrece todo eso. Puede tratarlo como la base del núcleo de su sistema, de modo que el AI Agent se centre en la lógica de negocio mientras NocoBase aporta una infraestructura fiable de autenticación, base de datos, API y permisos.

Para ello ofrecemos una entrada de aplicación llamada **AI Portal**. Su código fuente vive en local y está reservado para que lo escriba el AI Agent. El código escrito en esta entrada puede acceder directamente a las capacidades integradas de NocoBase, y las páginas construidas quedan listas para visitarse.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

## Lo que aporta NocoBase

Cuando se construye un sistema de negocio, el tiempo no suele irse en las páginas, sino en todo lo que hay detrás: el inicio de sesión de los usuarios, la comprobación de permisos, el diseño de las tablas, las API de CRUD, la subida y descarga de archivos. Todos los sistemas necesitan esto, y construirlo desde cero cada vez no compensa.

NocoBase ya lo ofrece todo:

- **Autenticación**: el inicio de sesión con usuario y contraseña funciona de forma inmediata. OIDC, SAML, CAS, LDAP, SMS, DingTalk, WeCom y otros funcionan una vez habilitados en el servidor, y el frontend solo tiene que conectarse a ellos
- **Base de datos y múltiples fuentes de datos**: gestión de tablas integrada, además de conexiones a fuentes de datos externas como MySQL y PostgreSQL
- **REST API**: en cuanto existe una tabla, sus endpoints de CRUD vienen con ella, con soporte de filtrado, ordenación, paginación y campos de relación
- **Control de acceso**: ACL basado en roles hasta el nivel de campo y de registro. El frontend puede leer los permisos del usuario actual y decidir qué mostrar
- **Flujos de trabajo**: automatización de procesos de negocio, activada desde el frontend o por cambios en los datos
- **Almacenamiento de archivos**: subida y descarga

![AI Portal Template](https://static-docs.nocobase.com/20260803161414.png)

Sobre esas capacidades hemos construido una [plantilla de sistema](https://github.com/nocobase/portal-template-default) estándar que el AI Agent puede copiar para poner en marcha una aplicación funcional. NocoBase también ofrece un conjunto de Skills como [Modelado de datos](../data-modeling.md) y [Configuración de permisos](../acl.md), de modo que, una vez descritas sus necesidades de negocio, el AI Agent no solo genera las páginas frontend, sino que también crea las tablas y configura los permisos, dándole un sistema de negocio completo.

## Requisitos previos

- NocoBase >= 3.0.0-alpha.6
- Node.js >= 22
- [pnpm](https://pnpm.io/installation): la plantilla de Portal lo utiliza para instalar dependencias e iniciar el servidor de desarrollo
- La versión alpha de `nocobase cli` (**atención: por ahora solo se admite la versión alpha**)
  - `npm install -g @nocobase/cli@alpha`
  - Además de una aplicación NocoBase ya inicializada mediante `nb init --ui`. Consulte la [Guía de integración para AI Agent](../../ai/quick-start.md)
- Un AI Agent, como Claude Code, Codex o Cursor

## Paso 1: confirmar que ya tiene un AI Portal

Confirme primero que el `main` por defecto está ahí:

```bash
nb portal list
```

![nb portal list](https://static-docs.nocobase.com/20260803163517.png)

La salida enumera el nombre del Portal, la URL de acceso, el tipo de Portal, el source storage, la ruta de desarrollo, el estado de activación y el estado por defecto.

Tras descargar el código fuente, `info` le da más detalle, como a dónde apuntan la ruta de desarrollo y la ruta de despliegue:

```bash
nb portal info main
```

## Paso 2: iniciar el modo de desarrollo

```bash
# Descargar el código fuente del portal
nb portal pull main
# Iniciar el servidor de desarrollo
nb portal dev main
```

El servidor de desarrollo se ejecuta por defecto en `http://localhost:5173`.

La plantilla incluye una página de gestión de usuarios construida sobre la tabla `users` de NocoBase. Inicie sesión y échele un vistazo: además es un buen ejemplo de partida para que la IA lo siga.

![portal dev home page](https://static-docs.nocobase.com/20260802220652.png)

## Paso 3: pedir a la IA que cambie una página

Entre en el espacio de trabajo de desarrollo del Portal (`pull` lo deja en `./main` por defecto; si no está seguro, consulte la ruta de desarrollo con `nb portal info main`), abra allí su AI Agent —Claude Code, Codex, Cursor, el que prefiera— y déle un prompt:

```
Añade una página de gestión de clientes
con un listado de clientes, búsqueda por nombre y un cajón de detalles que se abra al hacer clic en una fila
```

<!-- 需要一个视频，展示从输入提示词到 AI 完成页面编写、开发服务热更新出效果的完整过程 -->

La IA lee las páginas y extensiones existentes, escribe la nueva página siguiendo las convenciones de la plantilla y usted verá el resultado en `http://localhost:5173`.

Para aprender a trabajar de forma eficaz con un AI Agent, consulte [Construcción con un AI Agent](./agent-workflow.md).

## Paso 4: desplegar

Cuando los cambios locales tengan buen aspecto, envíe el código fuente al remoto y luego compile y despliegue:

```bash
nb portal push main --message "Add customer management page"
nb portal deploy main
```

A dónde envía `push` depende de la configuración de source storage de este Portal. El valor por defecto es `nocobase`, con el código fuente gestionado por NocoBase. Si lo cambia a `git` con [`nb portal config`](../../api/cli/portal/config.md), `push` confirma y envía el código fuente al repositorio Git que haya indicado, y `--message` pasa a ser el mensaje del commit de Git. Consulte [Despliegue y gestión del código fuente](./deploy.md#source-storage) para más detalles.

Una vez desplegado, visite `/x/main/` para ver sus cambios.

Con esto queda completo el ciclo: usted describe lo que necesita, la IA escribe el código, usted lo comprueba en local y luego envía y despliega.

## Cuando necesite más entradas

Una aplicación puede tener varios Portals. El personal interno usa uno y los clientes externos otro; las páginas y los permisos quedan completamente separados mientras los datos se comparten:

```bash
nb portal create customer
```

La creación genera `./customer` en el directorio actual como espacio de trabajo de desarrollo, o puede indicar otra ubicación con `--path`. Un Portal nuevo se desarrolla con `nb portal dev` y se despliega con `nb portal deploy` igual que el primero: entre en su espacio de trabajo y abra su AI Agent. Consulte [Despliegue y gestión del código fuente](./deploy.md) para más detalles.

## Pruebe la demo

Si quiere ver la construcción con AI Portal en acción, solicite un entorno de demo en https://demo.nocobase.com/new . Después de rellenar el formulario le generamos un entorno de demo dedicado, que contiene varias aplicaciones de AI Portal construidas sobre la base de NocoBase.

![AI Portal Settings](https://static-docs.nocobase.com/20260803154352.png)

Después elija un AI Portal y entre:

![AI Portal CRM](https://static-docs.nocobase.com/20260803154700.png)

La página de bienvenida del Portal también le ofrece un prompt que permite a su AI Agent conectarse directamente a esta aplicación de AI Portal, descargar el código de la aplicación, iniciar un servidor de desarrollo en local, cambiar páginas y luego enviar y desplegar de vuelta al entorno de demo. Actualice la página tras un despliegue correcto y verá el resultado.

## A continuación

- [Construcción con un AI Agent](./agent-workflow.md) — cómo escribir los prompts y cómo revertir cuando la IA se equivoca
- [Estructura del proyecto y stack técnico](./project-structure.md) — las convenciones de directorios de la plantilla y los comandos habituales
- [Despliegue y gestión del código fuente](./deploy.md) — poner el código fuente del Portal bajo Git y el despliegue multientorno

## Enlaces relacionados

- [Construcción con un AI Agent](./agent-workflow.md) — dirija a la IA en lenguaje natural para que escriba las páginas del Portal
- [Estructura del proyecto y stack técnico](./project-structure.md) — las convenciones de directorios de la plantilla y los comandos habituales
- [Componentes estándar y extensiones](./components.md) — la base de componentes shadcn/ui y el mecanismo de extensión
- [Despliegue y gestión del código fuente](./deploy.md) — el flujo completo de desarrollo, envío y despliegue
- [Guía de integración para AI Agent](../../ai/quick-start.md) — instale el NocoBase CLI y complete la inicialización
- [Inicio rápido del Constructor de IA](../index.md) — la otra forma de construir, sin escribir código
- [Control de versiones](../version-control.md) — instantáneas de versión para la construcción no-code
- [Referencia del comando `nb portal`](../../api/cli/portal/index.md) — descripción completa de los parámetros de todos los comandos de Portal
