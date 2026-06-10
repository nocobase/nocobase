# Cómo conectar el método de instalación anterior a AI y migrar a CLI

Si todavía usa el código fuente de Docker, `create-nocobase-app` o Git para instalar y mantener NocoBase de acuerdo con la documentación anterior, puede continuar usándolo de esta manera. No es necesario reinstalar la aplicación inmediatamente para acceder a AI.

Esta página le ayuda principalmente a determinar la ruta primero:

- Continúe utilizando los métodos de instalación y actualización originales.
- Permitir que las aplicaciones existentes accedan primero al agente de IA
- Migrar a un nuevo enfoque basado en CLI

De forma predeterminada, se recomienda verificar primero a qué categoría pertenece y luego ingresar el documento correspondiente. Esto es más estable y menos probable que funcione mal en el entorno de producción.

## ¿Qué método debo elegir?

| Si quieres ahora... | Qué hacer por defecto |
| --- | --- |
| Continuar instalando, actualizando y manteniendo aplicaciones de la forma original | Simplemente continúe usando la forma anterior, primero lea la entrada del documento correspondiente a continuación |
| Deje que una aplicación antigua que se ha estado ejecutando de manera estable se conecte al agente de IA | De forma predeterminada, se utiliza primero la conexión remota, que tiene el riesgo más bajo |
| Utilice `nb app`, `nb env`, `nb source` para administrar aplicaciones en el futuro | Cree una nueva aplicación CLI y migre allí los datos antiguos |

## Continuar usando el método de instalación original

Si está acostumbrado al método de instalación anterior, puede continuar usándolo. Simplemente siga los documentos originales para la instalación, actualización y configuración de variables de entorno.

### Instalar NocoBase

- [Instalación de Docker](/get-started/installation/docker)
- [instalación de la aplicación create-nocobase](/get-started/installation/create-nocobase-app)
- [Instalación del código fuente de Git](/get-started/installation/git)
- [Variables de entorno](/get-started/installation/env)

### Actualizar NocoBase

- [Actualización de la instalación de Docker](/get-started/upgrading/docker)
- [Actualización de la instalación de create-nocobase-app](/get-started/upgrading/create-nocobase-app)
- [Actualización de la instalación del código fuente de Git](/get-started/upgrading/git)

## Método 1: primero permita que las aplicaciones existentes accedan al agente de IA

Si su aplicación anterior ya se ejecuta de manera estable, utilice este método de forma predeterminada.

El objetivo de este método es conectar primero las aplicaciones existentes a la CLI y al agente AI a través de una conexión remota. Este es el riesgo más bajo porque no se hace cargo directamente de los procesos actuales de instalación, inicio, parada y actualización.

Pero primero debemos aclarar los límites:

- Este método no tiene capacidades relacionadas con `nb app`
- No se hace cargo de la gestión del tiempo de ejecución de aplicaciones antiguas por usted.
- Pero las habilidades relacionadas con la construcción de IA se pueden usar normalmente.

En otras palabras, si lo que más le importa en este momento es "conectar la IA primero" en lugar de "cambiar inmediatamente todo el sistema de gestión de operaciones a la CLI", tomará esta ruta primero de forma predeterminada.

Al conectarse a una aplicación existente, puede inicializar un entorno CLI como este:

```bash
# 默认使用 OAuth 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api

# 使用 token 认证
nb init --yes --env app1 \
  --api-base-url=http://your-app-host/api \
  --auth-type=token \
  --access-token=<token>
```

Si se requiere una nueva autenticación más adelante, puede ejecutar:

```bash
nb env auth app1
```

Si solo desea comenzar a usar IA para desarrollar capacidades, continúe leyendo [Inicio rápido de compilación de IA](/ai-builder/).

## Método 2: migrar a CLI

Si desea utilizar `nb app`, `nb env` y `nb source` para administrar aplicaciones locales en el futuro, entonces el método más seguro no es hacerse cargo directamente de la aplicación existente, sino crear una nueva aplicación y luego migrar los datos de la aplicación anterior allí.

La razón también es muy simple: la capacidad de "hacerse cargo de las aplicaciones existentes" todavía está en desarrollo.

Por el momento, la ruta de migración recomendada por defecto es:

1. Primero cree una nueva aplicación CLI
2. Migre la base de datos, `storage` y las variables de entorno de la aplicación anterior.
3. Después de verificar que el funcionamiento, la actualización y las capacidades de IA de la nueva aplicación son normales, decida si desea cambiar al entorno de producción.

Primero cree un nuevo entorno CLI:

```bash
nb init --yes --env app1
```

Antes de migrar, se recomienda confirmar que estos contenidos estén listos:

1. Se ha realizado una copia de seguridad de la base de datos.
2. Se ha realizado una copia de seguridad del directorio `storage`.
3. Se han registrado las variables de entorno clave de la aplicación anterior, como `APP_KEY`, `TZ`, `DB_*`, `DB_UNDERSCORED`.

De forma predeterminada, basta con migrar primero el entorno de prueba. Migre el entorno de producción únicamente cuando haya confirmado que la copia de seguridad, las variables de entorno y la configuración de la base de datos son correctas.

## Dónde buscar a continuación

- Si está listo para instalar y administrar aplicaciones de una manera nueva, continúe con [Instalación usando CLI (recomendado)](./cli.md)
- Si continúa utilizando el método de instalación original, simplemente regrese a la entrada del documento de instalación y actualización anterior.
