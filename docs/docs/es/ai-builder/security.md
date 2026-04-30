---
title: 'Seguridad y auditoría'
description: 'Conozca los métodos de autenticación, las estrategias de control de permisos, las prácticas recomendadas y la forma de auditar cada operación cuando un AI Agent construye sobre NocoBase.'
keywords: 'Constructor de IA, seguridad, permisos, autenticación, Token, OAuth, registro de operaciones, auditoría'
---

# Seguridad y auditoría

:::tip Requisitos previos

Antes de leer esta página, asegúrese de haber instalado el NocoBase CLI y de haber completado la inicialización siguiendo la guía de [Inicio rápido del Constructor de IA](./index.md).

:::

Cuando un usuario opera NocoBase mediante un AI Agent a través del [NocoBase CLI](../ai/quick-start.md), es necesario prestar especial atención a la autenticación, al control de permisos y a la auditoría, para garantizar que los límites de las operaciones queden claros y que el proceso sea trazable.

## Autenticación

Para que un AI Agent se conecte a NocoBase existen principalmente dos métodos de autenticación:

- **Autenticación con API key**: se genera una API Key mediante el plugin [API keys](/auth-verification/api-keys/index.md) y se configura en el entorno de la CLI; las solicitudes posteriores acceden a la API utilizando dicha clave directamente.
- **Autenticación con OAuth**: se completa un inicio de sesión OAuth desde el navegador y, a continuación, se accede a la API en nombre del usuario actualmente conectado.

Ambos métodos pueden utilizarse con el comando `nb`; las diferencias residen en el origen de la identidad, los escenarios de uso y la estrategia de control de riesgos.

### Autenticación con API key

La API key se utiliza principalmente para tareas automatizadas, scripts y de larga ejecución, por ejemplo:

- Permitir que un AI Agent sincronice datos de forma periódica
- Llamar con frecuencia a `nb api` en un entorno de desarrollo
- Ejecutar con un rol fijo un conjunto claro y estable de tareas de construcción

El flujo básico es el siguiente:

1. Active el plugin API keys en NocoBase y cree una API Key.
2. Asigne a esta API Key un rol específico, en lugar de vincularla directamente a `root` o a los permisos completos de un administrador.
3. Utilice `nb env add` para guardar la dirección de la API y el Token en un entorno de la CLI.

Por ejemplo:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type token \
  --access-token <your-api-key>
```

Una vez configurado, el AI Agent puede ejecutar llamadas a la API a través de este entorno:

```bash
nb api resource list --env local --resource users
```

Este método es estable, adecuado para la automatización y no requiere que el usuario inicie sesión cada vez. Mientras el Token no haya caducado, quien lo posea podrá acceder al sistema con los permisos del rol vinculado, por lo que conviene tener especial cuidado:

- Vincule el Token únicamente a un rol específico.
- Guárdelo solo en los entornos de la CLI estrictamente necesarios.
- Rótelo periódicamente y no utilice como opción predeterminada «sin caducidad».
- Si sospecha que se ha filtrado, elimínelo y regénerelo de inmediato.

Para obtener más explicaciones generales, consulte la [Guía de seguridad de NocoBase](../security/guide.md).

### Autenticación con OAuth

OAuth se utiliza principalmente en tareas que se ejecutan en nombre del usuario actualmente conectado, por ejemplo:

- Permitir que la IA realice un ajuste de configuración puntual en nombre del administrador actual
- Cuando es necesario que la operación quede atribuida a un usuario claramente identificado
- Cuando no se desea conservar Tokens con permisos elevados durante mucho tiempo

El flujo básico es el siguiente:

1. Añada primero un entorno de la CLI seleccionando `oauth` como método de autenticación.
2. Ejecute `nb env auth`.
3. Se abrirá la página de autenticación en el navegador; inicie sesión y complete la autenticación.
4. La CLI guardará la información de autenticación y, a partir de ese momento, las solicitudes `nb api` accederán a NocoBase en nombre del usuario actualmente conectado.
5. Si el usuario tiene varios roles, puede especificar uno mediante `--role`.

Por ejemplo:

```bash
nb env add local \
  --scope project \
  --api-base-url http://localhost:13000/api \
  --auth-type oauth

nb env auth local
```

`nb env auth` iniciará el flujo de inicio de sesión en el navegador. Tras completarlo correctamente, la CLI guardará la información de autenticación en la configuración del entorno actual y, a continuación, podrá seguir permitiendo que el AI Agent llame a `nb api`.

Con la implementación predeterminada actual:

- El token de acceso de OAuth tiene una validez de **10 minutos**.
- El token de actualización de OAuth tiene una validez de **30 días**.

Cuando el token de acceso esté próximo a caducar, la CLI utilizará preferentemente el token de actualización para renovar la sesión automáticamente; si el token de actualización ha caducado, no está disponible o el servidor no devuelve uno, será necesario volver a ejecutar `nb env auth`.

La característica de OAuth es que las solicitudes se ejecutan, por lo general, en el contexto del usuario actualmente conectado y de su rol, por lo que los registros de auditoría pueden asociarse más fácilmente al operador real. Este método es más adecuado para operaciones que requieren participación humana y confirmación de identidad.

### Prácticas recomendadas

Le recomendamos elegir según los siguientes principios:

- **Tareas de desarrollo, pruebas y automatización**: prefiera la API key, pero asegúrese de vincularla a un rol específico.
- **Producción, participación humana y necesidad de una atribución de identidad sólida**: prefiera OAuth.
- **Operaciones de alto riesgo**: aunque técnicamente sea posible utilizar Token, le recomendamos cambiar a OAuth y que la autenticación la realice un usuario con los permisos correspondientes antes de ejecutarlas.

Si no hay un requisito explícito, puede aplicar los siguientes principios predeterminados:

- **Por defecto, utilice OAuth.**
- **Utilice API key únicamente cuando sea claramente necesario para automatización, ejecución desatendida o ejecución por lotes.**

## Control de permisos

Un AI Agent no tiene «permisos adicionales»: lo que puede hacer depende por completo de la identidad y del rol con los que actúe.

Es decir:

- Cuando accede mediante API key, los límites de los permisos los marca el rol vinculado a ese Token.
- Cuando accede mediante OAuth, los límites de los permisos los marcan el usuario conectado y el rol actual.

La IA no eludirá el sistema ACL de NocoBase. Si un rol no tiene permiso de configuración sobre una determinada tabla, campo, página o plugin, el AI Agent no podrá ejecutar la operación con éxito, aun conociendo el comando correspondiente.

### Roles y políticas de permisos

Le recomendamos preparar un rol específico para el AI Agent, en lugar de reutilizar un rol de administrador existente.

Este rol normalmente solo necesita disponer de los siguientes permisos:

- Sobre qué tablas se permite operar
- Qué acciones se permiten ejecutar, por ejemplo, ver, crear, actualizar o eliminar
- Si se permite el acceso a determinadas páginas o menús
- Si se permite acceder a la configuración del sistema, a la gestión de plugins, a la configuración de permisos u otras zonas de alto riesgo

Por ejemplo, puede crear un rol `ai_builder_editor` que solo permita:

- Gestionar las tablas relacionadas con CRM
- Editar páginas concretas
- Disparar parte de los flujos de trabajo
- No modificar permisos de roles
- No activar, desactivar ni instalar plugins
- No eliminar tablas críticas

Si necesita que la IA le ayude a configurar permisos, puede hacerlo junto con [Configuración de permisos](./acl.md), aunque le recomendamos que sean las personas quienes definan primero los límites de los permisos.

### Principio de mínimo privilegio

El principio de mínimo privilegio resulta especialmente importante en los escenarios del Constructor de IA; puede aplicar el siguiente enfoque:

1. Cree primero un rol específico para la IA.
2. Inicialmente, otorgue solo permiso de lectura.
3. Añada gradualmente los permisos necesarios de creación, edición, etc., en función de las tareas.
4. Mantenga el control humano sobre las operaciones de alto riesgo, como eliminación, modificación de permisos o gestión de plugins.

Por ejemplo:

- Una IA destinada a la introducción de contenidos solo necesita permiso de lectura y creación sobre la tabla de destino.
- Una IA destinada a la construcción de páginas solo necesita permisos de configuración sobre las páginas y la UI correspondientes.
- Una IA destinada al modelado de datos debe disponer únicamente de permiso para modificar la estructura de las tablas en el entorno de pruebas, no directamente en producción.

No se recomienda vincular directamente al AI Agent roles como `root`, `admin` u otros con capacidad de configuración global del sistema. Aunque es una opción de despliegue sencilla, ampliará considerablemente la superficie de exposición de permisos.

## Registros

En los escenarios del Constructor de IA, los registros sirven para apoyar la trazabilidad de las operaciones y la localización de problemas.

Conviene prestar atención principalmente a estos dos tipos de registros:

- **Registros de solicitudes**: registran información de las solicitudes a las API, como la ruta, el método, el código de estado, la duración y el origen de la solicitud.
- **Registros de auditoría**: registran el sujeto que ejecuta operaciones críticas sobre los recursos, el objeto operado, el resultado y los metadatos relacionados.

Cuando se realiza una solicitud mediante `nb api`, la CLI añade automáticamente la cabecera `x-request-source: cli`, lo que permite al servidor identificar que la solicitud proviene de la CLI.

### Registros de solicitudes

Los registros de solicitudes registran la información de las llamadas a las API, incluyendo la ruta, el estado de la respuesta, la duración y la marca de origen.

Los archivos de registro se encuentran habitualmente en:

```bash
storage/logs/<appName>/request_YYYY-MM-DD.log
```

En el caso de las llamadas con `nb api`, el registro de solicitudes incluirá:

- `req.header.x-request-source`

Esto permite distinguir las solicitudes de la CLI de las solicitudes habituales del navegador.

Para conocer el directorio y los campos del registro de solicitudes, consulte [Registros del servidor de NocoBase](../log-and-monitor/logger/index.md).

### Registros de auditoría

Los registros de auditoría registran el sujeto que ejecuta una operación crítica, el recurso objetivo, el resultado de la ejecución y la información de la solicitud asociada.

Para las operaciones incluidas en el ámbito de auditoría, el registro contendrá:

- `resource`
- `action`
- `userId`
- `roleName`
- `status`
- `metadata.request.headers.x-request-source`

Por ejemplo, cuando la IA llama mediante la CLI a `collections:apply`, `fields:apply` u otras operaciones de escritura con auditoría activada, en el registro de auditoría aparecerá `x-request-source: cli`, lo que permitirá distinguir entre las operaciones realizadas desde la interfaz y las iniciadas desde la CLI.

Para conocer la descripción detallada de los registros de auditoría, consulte [Registros de auditoría](../security/audit-logger/index.md).

## Recomendaciones de seguridad

A continuación se ofrecen algunas recomendaciones prácticas más adecuadas para los escenarios del Constructor de IA:

- No vincule directamente al AI Agent los roles `root`, `admin` o cualquier otro con capacidad de configuración global del sistema.
- Cree un rol específico para el AI Agent y divida los límites de los permisos según la tarea.
- Rote periódicamente las API keys y evite reutilizar durante mucho tiempo el mismo Token con permisos elevados.
- Valide primero en un entorno de pruebas los cambios de modelado de datos, estructura de páginas y flujos de trabajo, y solo después sincronícelos con producción.
- Active y revise periódicamente los registros de solicitudes y de auditoría para garantizar la trazabilidad de las operaciones críticas.
- Para operaciones de alto riesgo como eliminar datos, modificar permisos, activar/desactivar plugins o ajustar la configuración del sistema, le recomendamos confirmarlas manualmente antes de ejecutarlas.
- Si la IA necesita ejecutarse durante mucho tiempo, divídala preferiblemente en varios entornos con permisos reducidos, en lugar de utilizar de forma centralizada un único entorno con permisos elevados.

## Enlaces relacionados

- [Inicio rápido del Constructor de IA](./index.md): instalación y preparación del entorno
- [Gestión de entornos](./env-bootstrap): comprobación del entorno, adición de entornos y diagnóstico de fallos
- [Configuración de permisos](./acl.md): configuración de roles, políticas de permisos y evaluación de riesgos
- [NocoBase CLI](../ai/quick-start.md): herramienta de línea de comandos para instalar y gestionar NocoBase
- [Guía de seguridad de NocoBase](../security/guide.md): recomendaciones de configuración de seguridad más completas
- [Registros del servidor de NocoBase](../log-and-monitor/logger/index.md): directorio y campos del registro de solicitudes
- [Registros de auditoría](../security/audit-logger/index.md): campos de los registros de auditoría e instrucciones de uso
- [NocoBase MCP](../ai/mcp/index.md): conexión con un AI Agent mediante el protocolo MCP
