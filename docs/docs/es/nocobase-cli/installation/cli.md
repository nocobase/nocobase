# Instalar usando CLI (recomendado)

Después de NocoBase 2.1.0, se proporciona el método oficial de instalación y administración basado en CLI. Puede usarlo para completar la instalación, conexión, actualización y mantenimiento diario, y también puede preparar un entorno conectable y operable para AI Agent.

## Instalar la CLI de NocoBase

Solo se ejecuta al instalar la CLI por primera vez.

Primero instale la CLI globalmente:

```bash
npm install -g @nocobase/cli@beta
nb --version
```

:::consejo Se recomienda habilitar primero el modo de sesión

Si va a abrir varios terminales o shells al mismo tiempo, o desea que el Agente AI funcione en paralelo con usted, se recomienda ejecutar de forma predeterminada [`nb session setup`](../../api/cli/session/setup.md) primero. De esta manera, cada sesión puede mantener su propio `current env` y no se afectarán fácilmente entre sí.

```bash
nb session setup
```

:::

La CLI busca actualizaciones automáticas de forma predeterminada. Puedes ajustar la estrategia de actualización según tus propios hábitos:

- `prompt`: avisar cuando se encuentra una nueva versión
- `auto`: actualización automática
- `off`: desactivar las actualizaciones automáticas

```bash
nb config set update.policy prompt
nb config set update.policy auto
nb config set update.policy off
```

La actualización automática solo se admite cuando la CLI está gestionada por una instalación global estándar de npm, pnpm o yarn. Si se ejecuta desde el código fuente o desde el árbol de dependencias de un proyecto local, usa [`nb self check`](../../api/cli/self/check.md) para ver el método de instalación detectado y actualiza ese proyecto padre.

Si va a implementar NocoBase en el servidor y desea abrir el asistente `nb init --ui` desde un navegador remoto, se recomienda cambiar primero el host predeterminado de la CLI a la IP actual del servidor:

```bash
nb config set default-ui-host <server-ip>
nb config set default-api-host <server-ip>
```

Reemplace `<server-ip>` con la IP real del servidor actual al que puede acceder.

`nb config` es la configuración global de la CLI. Por lo general, solo es necesario configurarlo una vez y estos valores predeterminados se usarán automáticamente cuando se ejecute `nb init --ui` nuevamente más tarde, por lo que no es necesario repetir la configuración cada vez.

En términos generales:

- `default-ui-host` se utiliza para generar la URL accesible desde el navegador del asistente `nb init --ui`; el servicio del asistente siempre escucha en `0.0.0.0`
- `default-api-host` para la dirección API generada de forma predeterminada en instalaciones nuevas

Si se implementa en un servidor, ambos valores generalmente deben cambiarse a IP accesibles para el servidor actual, en lugar de continuar usando la dirección local predeterminada.

:::advertencia Este es sólo un asistente de instalación o un método de acceso temporal, no una entrada recomendada para entornos de producción.

Configure `default-ui-host` / `default-api-host` en la IP del servidor, principalmente para poder abrir `nb init --ui` desde un navegador remoto o verificar temporalmente si se puede acceder al servicio una vez completada la instalación.

Esto no significa que el entorno de producción deba utilizar `IP + port` para proporcionar servicios externos durante mucho tiempo. Al implementar formalmente, aún se recomienda usar un nombre de dominio y proporcionar acceso unificado a través de un proxy inverso como Nginx o Caddy, y luego habilitar HTTPS.

:::

## Instalar NocoBase

### Método 1: instalar a través del asistente de interfaz de usuario

Esta es la entrada recomendada predeterminada. Sólo necesitas ejecutar:

```bash
nb init --ui
```

Si desea especificar un puerto fijo para la página del asistente, puede agregar `--ui-port` directamente, por ejemplo:

```bash
nb init --ui --ui-port 3000
```

![nb asistente de inicio de interfaz de usuario](https://static-docs.nocobase.com/2026-06-03-20-54-01.png)

El asistente lo llevará paso a paso para completar la configuración requerida para la instalación o conexión según el escenario actual.

### Método 2: interactuar a través de la terminal

Si te sientes más cómodo escribiendo paso a paso en la terminal, puedes ejecutar directamente:

```bash
nb init
```

![2026-06-03-21-36-33](https://static-docs.nocobase.com/2026-06-03-21-36-33.png)

### Método 3: mediante comandos no interactivos

Si está ejecutando en un script, CI/CD u otro entorno no interactivo, simplemente use `--yes`. En este modo, `--env` se debe pasar explícitamente y los parámetros no especificados explícitamente se procesarán con los valores predeterminados.

La forma predeterminada más corta de escribirlo es:

```bash
nb init --yes --env app1
```

Específico para combinaciones comunes, como diferentes fuentes de instalación, selección de versión, certificación `basic`, conexión CI/CD a aplicaciones existentes y nombres de bases de datos, simplemente mire [ejemplo de referencia de comando `nb init`](../../api/cli/init.md# ejemplo).

## ¿Qué debes confirmar primero una vez completada la instalación?

`--env` es el nombre del entorno en la CLI. En términos generales, lo siguiente que debe hacer una vez completada la instalación gira en torno a este entorno.

Generalmente se recomienda confirmar primero estas 3 cosas:

1. Si env se creó y guardó correctamente
2. Si la aplicación se puede iniciar normalmente y si los registros son normales
3. Si va a abrirlo oficialmente al mundo exterior, ¿ha planeado la entrada al entorno de producción en lugar de seguir usando `IP + port` directamente?

### Directorio de instalación

Si acaba de instalar una aplicación local usando `nb init --env app1`, puede ver la ruta completa a través de `nb env info app1 --field app.appPath`.

De forma predeterminada, la CLI organiza los archivos locales en `app-path` según la siguiente convención:

```text
<app-path>/
├── source/   # 应用源码或下载内容对应的默认目录
├── storage/  # 运行时数据目录
└── .env      # 可选的应用环境变量文件
```

En términos generales:

- `source/` corresponde principalmente al directorio de aplicaciones locales de npm/Git env. Para Docker env, la CLI también conservará este conjunto de derivación de ruta predeterminada, pero la mayoría de las veces no es necesario que te preocupes por ello manualmente.
- `storage/` se utiliza para almacenar datos en tiempo de ejecución, como datos de bases de datos integradas, complementos, registros, etc.
- `.env` es un archivo de variable de entorno de aplicación opcional. Solo cuando necesite personalizar las variables de entorno, deberá agregarlas en `<app-path>/.env`; Si este archivo existe, las fuentes de instalación de Docker, npm y Git lo leerán de forma predeterminada.

Consulte [`nb init` Referencia de comandos](../../api/cli/init.md) para obtener una descripción más completa.

### Recordatorio de implementación del entorno de producción

Si acaba de finalizar la instalación y desea verificar primero los resultados de la instalación, normalmente no habrá ningún problema al abrir la página con `IP + port`.

Pero si este entorno va a brindar servicios oficialmente al mundo exterior, se debe prestar especial atención:

- `nb init --ui` en sí es solo una página temporal del asistente de instalación, utilizada para completar la instalación o inicialización, y no es la entrada oficial del servicio externo de la aplicación.
- Una vez completada la instalación a través de `nb init`, el `IP + port` actualmente expuesto por la aplicación es más adecuado para la fase de depuración, la fase de verificación o el acceso temporal a la intranet.
- En el entorno de producción, no se recomienda exponer directamente el puerto de la aplicación NocoBase a la red pública para un uso prolongado.
- Para acceso externo oficial, se recomienda utilizar un nombre de dominio y proxy inverso a NocoBase a través de Nginx o Caddy.
- Los entornos de producción deben priorizar la habilitación de HTTPS sobre el uso a largo plazo de `http://IP:port` expuestos.

En otras palabras, `default-ui-host` y `default-api-host` son solo para hacer que el asistente de instalación y la generación de direcciones predeterminadas sean más convenientes, y no representan la entrada de acceso al entorno de producción final.

Si este entorno está listo para lanzarse oficialmente, se recomienda "conectarse al proxy inverso y habilitar HTTPS" como siguiente paso después de completar la instalación, en lugar de un elemento de optimización opcional.

Si está listo para continuar con la implementación formal ahora, se recomienda comenzar con [implementación del entorno de producción] (../production/index.md) y luego continuar mirando la configuración del proxy inverso de [Nginx](../production/reverse-proxy/nginx.md) o [Caddy](../production/reverse-proxy/caddy.md) según sea necesario.

### Operaciones diarias

Primero puede confirmar si este entorno se ha guardado correctamente:

```bash
nb env current
nb env list
nb env status
nb env info app1
nb env info app1 --json
```

Si desea continuar con las operaciones posteriores después de la instalación, puede hacer clic en el siguiente índice para mirar hacia abajo:

| Quiero... | Dónde buscar |
| --- | --- |
| Si está listo para hacer que este entorno esté oficialmente abierto al mundo exterior, conéctelo al proxy inverso del entorno de producción y use el nombre de dominio y HTTPS para exponer el servicio. | [Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md). |
| Confirme si el entorno se guardó correctamente, verifique qué entorno se utiliza actualmente y cambie entre varios entornos. | [`nb env`](../../api/cli/env/index.md), [Gestión multientorno](../operations/multi-environment.md). |
| Inicie, detenga, reinicie la aplicación, vea registros o continúe actualizando la aplicación. | [`nb app`](../../api/cli/app/index.md), [Administrar aplicación](../operations/manage-app.md). |
| Verifique las conexiones de la base de datos, vea el estado de la base de datos integrada o solucione problemas del contenedor de la base de datos. | [`nb db`](../../api/cli/db/index.md). |
| Ver complementos instalados, habilitar o deshabilitar complementos. | [`nb plugin`](../../api/cli/plugin/index.md). |
| Active la autorización comercial, verifique el estado de la autorización y sincronice complementos comerciales. | [`nb license`](../../api/cli/license/index.md). |
| Administre proyectos de código fuente local, como descargar código fuente, iniciar el modo de desarrollo, compilar o probar. Esto se usa normalmente con npm/Git env. | [`nb source`](../../api/cli/source/index.md). |

Si acaba de instalar una aplicación local, normalmente puede ejecutar estos comandos primero:

```bash
nb env use app1
nb app start
nb app logs
nb plugin list
```

Si mantiene varios entornos al mismo tiempo, consulte [Gestión de entornos múltiples] (../operations/multi-environment.md) para conocer los métodos de visualización de estado y cambio posteriores.

Si desea actualizar la aplicación más adelante, simplemente mire [Administrar aplicación](../operations/manage-app.md) y [`nb app upgrade` Referencia de comando](../../api/cli/app/upgrade.md).

## Enlaces relacionados

- [`nb init` Referencia de comando](../../api/cli/init.md)
- [`nb env info` Referencia de comando](../../api/cli/env/info.md)
- [Proxy inverso del entorno de producción: Nginx](../production/reverse-proxy/nginx.md) / [Caddy](../production/reverse-proxy/caddy.md)
- [Migrar de la forma anterior a CLI] (./migration.md)
- [Gestión de entornos múltiples](../operations/multi-environment.md)
- [Administrar aplicación] (../operations/manage-app.md)
