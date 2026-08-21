---
title: "Descripción general del desarrollo de plugins en NocoBase"
description: "Arquitectura de microkernel de NocoBase, ciclo de vida de los plugins, estructura de directorios, plug-and-play, full-stack, código fuente client/server, metadatos de package.json."
keywords: "desarrollo de plugins,plugin NocoBase,microkernel,ciclo de vida de plugins,full-stack,extensión NocoBase"
---

# Descripción general del desarrollo de plugins

NocoBase adopta una **arquitectura de microkernel**: el núcleo solo se encarga de la programación del ciclo de vida de los plugins, la gestión de dependencias y la encapsulación de capacidades básicas. Todas las funcionalidades de negocio se proporcionan en forma de plugins. Comprender la estructura organizativa, el ciclo de vida y el modo de gestión de los plugins es el primer paso para personalizar NocoBase.

## Conceptos clave

- **Plug and play**: puede instalar, activar o desactivar plugins según sus necesidades, lo que permite combinar funcionalidades de negocio de forma flexible sin modificar el código.
- **Full-stack**: los plugins generalmente incluyen implementaciones tanto del lado del servidor como del cliente, gestionando juntos la lógica de datos y las interacciones de la interfaz.

## Estructura básica de un plugin

Cada plugin es un paquete npm independiente que generalmente contiene la siguiente estructura de directorios:

```bash
plugin-hello/
├─ package.json          # Nombre del plugin, dependencias y metadatos del plugin NocoBase
├─ client-v2.js          # Artefacto de compilación frontend para la carga en tiempo de ejecución
├─ server.js             # Artefacto de compilación del lado del servidor para la carga en tiempo de ejecución
├─ src/
│  ├─ client-v2/         # Código fuente del lado del cliente, puede registrar bloques, acciones, campos, etc.
│  └─ server/            # Código fuente del lado del servidor, puede registrar recursos, eventos, comandos, etc.
```

## Requisitos previos

Antes de desarrollar un plugin, debe inicializar una aplicación mediante el CLI de NocoBase. El CLI admite dos fuentes: npm y Git:

- **Fuente npm** (`create-nocobase-app`): ideal para comenzar rápidamente, lista para usar.
- **Fuente Git** (recomendada): clone el repositorio de código fuente de NocoBase; al desarrollar con IA, puede consultar directamente el código fuente del framework para obtener mejores resultados.

Consulte [Instalar la aplicación mediante CLI](../nocobase-cli/installation/cli.md) o la [Guía de inicio rápido de AI Agent](../ai/quick-start.mdx).

## Convenciones de directorios y orden de carga

La aplicación creada mediante `nb init` tiene la siguiente estructura de directorios:

```bash
<app-path>/
├── .nb/                  # Metadatos guardados por el CLI para el env actual
├── source/               # Código fuente de la aplicación (proyecto NocoBase)
├── storage/              # Directorio de datos en tiempo de ejecución
│   └── plugins/          # Plugins compilados (subidos o importados)
├── plugins/              # Código fuente de sus plugins (nb scaffold plugin genera aquí)
└── .env                  # Archivo de variables de entorno de la aplicación
```

- `plugins/`: el directorio del código fuente de sus plugins en desarrollo. Los plugins creados mediante `nb scaffold plugin` se colocan aquí. `nb` los sincroniza automáticamente a `source/packages/plugins/` para el desarrollo y la construcción; no necesita manipular manualmente el directorio `source/`.
- `storage/plugins/`: almacena los plugins ya compilados, como los plugins comerciales o de terceros.

## Ciclo de vida y estados de los plugins

Un plugin generalmente pasa por las siguientes etapas:

1. **Creación (create)**: crear una plantilla de plugin mediante el CLI.
2. **Descarga (pull)**: descargar el paquete del plugin localmente, sin escribirlo aún en la base de datos.
3. **Activación (enable)**: en la primera activación se ejecutan los pasos de « registro + inicialización »; las activaciones posteriores solo cargan la lógica.
4. **Desactivación (disable)**: detener la ejecución del plugin.
5. **Eliminación (remove)**: eliminar completamente el plugin de NocoBase.

:::tip Nota

- `pull` solo descarga el paquete del plugin; el proceso de instalación real se activa con el primer `enable`.
- Si un plugin solo ha sido descargado con `pull` pero no se ha activado, no se cargará.

:::

### Ejemplos de comandos CLI

```bash
# 1. Crear el esqueleto del plugin
nb scaffold plugin @my-project/plugin-hello

# 2. Activar el plugin (se instala automáticamente en la primera activación)
nb plugin enable @my-project/plugin-hello

# 3. Desactivar el plugin
nb plugin disable @my-project/plugin-hello
```

## Interfaz de gestión de plugins

Acceda al « Gestor de plugins » en el navegador para ver y gestionar los plugins de forma intuitiva:

**Dirección por defecto:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Gestor de plugins](https://static-docs.nocobase.com/20251030195350.png)

## Enlaces relacionados

- [Escriba su primer plugin](./write-your-first-plugin.md) — crear un plugin de bloque desde cero, inicio rápido del flujo de desarrollo
- [Estructura del directorio del proyecto](./project-structure.md) — convenciones de la estructura del proyecto NocoBase y orden de carga de plugins
- [Descripción general del desarrollo en el servidor](./server/index.md) — presentación y conceptos centrales de los plugins del lado del servidor
- [Descripción general del desarrollo en el cliente](./client/index.md) — presentación y conceptos centrales de los plugins del lado del cliente
- [Compilación y empaquetado](./build.md) — proceso de compilación y empaquetado de plugins
- [Gestión de dependencias](./dependency-management.md) — declaración y gestión de dependencias de plugins
