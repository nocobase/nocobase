---
title: "Despliegue y gestión del código fuente"
description: "El flujo completo de desarrollo, envío y despliegue de un AI Portal, además de los dos modos de source storage y el despliegue multientorno."
keywords: "AI Portal, despliegue, source storage, Git, nb portal deploy, nb portal push, multientorno"
---

# Despliegue y gestión del código fuente

:::tip Requisitos previos

Antes de leer esta página, asegúrese de tener su primer Portal en marcha siguiendo el [Inicio rápido del AI Portal](./index.md).

:::

El código fuente de un Portal vive en tres sitios: el espacio de trabajo de desarrollo local, el source storage y los artefactos desplegados. `nb portal` se encarga de mantenerlos sincronizados.

## El ciclo de vida completo

El ciclo del día a día es así:

```text
dev (desarrollo local) → push (envío del código fuente) → deploy (compilación y despliegue)
```

Donde:

1. `nb portal dev <portal>`: inicia el servidor de desarrollo local, cambie el código y vea el resultado
2. `nb portal push <portal>`: envía los cambios del código fuente local al source storage
3. `nb portal deploy <portal>`: compila y despliega, para que los cambios lleguen a los usuarios

Si retoma un Portal que ya creó un compañero, o si ha cambiado de máquina, descárguelo primero en local:

```bash
nb portal list                 # Ver qué Portals existen
nb portal pull customer        # Descargar el código fuente en local
nb portal dev customer         # Empezar a desarrollar
```

`pull` descarga y descomprime el código fuente en el espacio de trabajo de desarrollo, `./<portal>` por defecto, o en otra ubicación con `--path`. Las dependencias se instalan automáticamente; añada `--no-install` para omitirlo en CI o cuando prefiera instalarlas usted.

Tras una descarga correcta, la ubicación del espacio de trabajo de desarrollo queda registrada en la configuración env de la CLI, de modo que `dev`, `push` y `deploy` leen el código fuente desde ahí sin que tenga que indicarla cada vez.

## Añadir un Portal

Una aplicación puede tener varios Portals con páginas y permisos separados, pero con los datos compartidos. Por ejemplo, una entrada para el personal interno y otra para los clientes externos:

```bash
nb portal create customer
```

La creación genera `./customer` en el directorio actual como espacio de trabajo de desarrollo a partir de la plantilla `@nocobase/portal-template-default`, escribe `.env` y `.env.local` y luego instala las dependencias. Use `--path` para ubicarlo en otro sitio.

<!-- 需要一张 nb portal create 执行完成后的终端输出截图 -->

El nombre de un Portal solo puede contener letras minúsculas, dígitos, guiones bajos y guiones, y debe empezar por una letra minúscula o un dígito.

## source storage

El código fuente de un Portal puede guardarse en dos sitios:

| Modo | Descripción | Cuándo usarlo |
| --- | --- | --- |
| `nocobase` | El modo por defecto, con el código fuente gestionado por el source storage de NocoBase | Empezar rápido, desarrollo en solitario, sin necesidad de revisión de código |
| `git` | El código fuente se guarda en un repositorio Git que usted indique | Colaboración en equipo, revisión de código, integración con CI |

El `nocobase` por defecto es el más rápido para empezar, ya que no hace falta preparar antes un repositorio. Sin embargo, no tiene historial de versiones, así que un cambio erróneo solo puede revertirse sobrescribiéndolo todo. **Si este Portal se va a iterar a largo plazo, páselo a Git cuanto antes.**

### Cambiar a Git

`create` solo genera el espacio de trabajo de desarrollo; la configuración del source storage se hace mediante `config`. Puede cambiarla en cualquier momento después de crearlo:

```bash
nb portal config customer \
  --source-storage git \
  --git-repo git@github.com:nocobase/customer-portal.git

nb portal push customer --message "Move customer portal source to Git"
```

`config` sincroniza la configuración del source storage con el registro remoto del Portal, y las siguientes llamadas a `push` pasan por Git.

Con un Portal por repositorio, la raíz del repositorio por defecto funciona bien para `--git-path`. Solo necesitará un subdirectorio si quiere varios Portals en el mismo repositorio:

```bash
nb portal config customer --git-path portals/customer
```

### Descargar temporalmente desde otro repositorio

Para probar el código fuente de otro repositorio sin cambiar la configuración del Portal, `pull` admite una indicación puntual:

```bash
nb portal pull customer --git-repo git@github.com:nocobase/another-portal.git
```

Esto no modifica el registro remoto del Portal, y `--git-branch` y `--git-path` solo pueden usarse junto con `--git-repo`. Para pasar de forma permanente al almacenamiento en Git, use `config` como se indica arriba.

`config` también permite cambiar la ubicación del espacio de trabajo de desarrollo: tras mover el código fuente a otro directorio, indique a la CLI la nueva ubicación con `--path`:

```bash
nb portal config customer --path ./workspaces/customer
```

## Diferencias entre tipos de env

`nb portal` sincroniza de forma distinta según el tipo de env:

| Tipo de env | Descripción |
| --- | --- |
| `local` | La aplicación está en esta máquina. `pull` trae el código fuente al espacio de trabajo de desarrollo, y `deploy` compila desde ese espacio de trabajo y sincroniza los artefactos |
| `docker` | La aplicación se ejecuta en Docker, compartida mediante un volumen. El comportamiento es el mismo que el anterior |
| `http` | Se sincroniza a través de la API. `pull` / `push` descargan o suben un archivo comprimido con el código fuente |

Los env de tipo `ssh` todavía no admiten la gestión de Portals.

## Despliegue multientorno

El mismo Portal puede desplegarse en distintos entornos, indicando el destino con `--env`:

```bash
nb portal deploy customer --env prod --yes
```

`--yes` omite la confirmación interactiva. Cuando el `--env` que indique explícitamente difiere del env actual, la CLI se detiene y pregunta por defecto. Acuérdese de incluir `--yes` en los scripts o en CI, o el comando se quedará esperando en la confirmación.

Para la publicación entre entornos de la estructura de las tablas y de la configuración, consulte [Gestión de publicación](../publish.md).

## Ruta de acceso

Una vez desplegado, la ruta de acceso de un Portal es:

```text
<appPublicPath>/x/<portal>/
```

Para un Portal dentro de una subaplicación:

```text
<appPublicPath>/x/apps/<app>/<portal>/
```

El prefijo `/x/` pertenece a los AI Portals; los Portals no-code usan `/v/`.

## Eliminar un Portal

```bash
nb portal destroy customer
```

Esta operación elimina el registro del Portal y sus archivos desplegados, y conserva por defecto el espacio de trabajo de desarrollo local. Añada `--delete-dev-path` cuando quiera eliminar también el espacio de trabajo de desarrollo.

## Enlaces relacionados

- [Inicio rápido del AI Portal](./index.md) — ponga en marcha su primera entrada frontend escrita por la IA
- [Construcción con un AI Agent](./agent-workflow.md) — dirija a la IA en lenguaje natural para que escriba las páginas
- [Estructura del proyecto y stack técnico](./project-structure.md) — comandos de compilación y variables de entorno
- [Gestión de publicación](../publish.md) — publique entre entornos la estructura de las tablas y la configuración
- [Referencia del comando `nb portal`](../../api/cli/portal/index.md) — descripción completa de los parámetros de todos los comandos de Portal
- [`nb portal create`](../../api/cli/portal/create.md) — todos los parámetros para crear un Portal
- [`nb portal config`](../../api/cli/portal/config.md) — ajuste el source storage y la ruta del espacio de trabajo de desarrollo
- [`nb portal push`](../../api/cli/portal/push.md) — envíe el código fuente al source storage
- [`nb portal deploy`](../../api/cli/portal/deploy.md) — compile y despliegue un Portal
- [`nb portal pull`](../../api/cli/portal/pull.md) — descargue el código fuente desde el source storage
- [`nb portal destroy`](../../api/cli/portal/destroy.md) — elimine el registro del Portal y sus archivos desplegados
