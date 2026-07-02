---
title: "Estructura del directorio del proyecto de plugin"
description: "Estructura de proyecto de plugin NocoBase: nb init, disposición de la aplicación, directorio plugins, proyecto source, directorio storage."
keywords: "estructura del proyecto,nb init,plugins,directorio de plugins,NocoBase"
---

# Estructura del directorio del proyecto

La aplicación inicializada mediante el CLI de NocoBase (`nb init`) genera un directorio de aplicación estándar. El CLI admite dos fuentes: npm (`create-nocobase-app`) y Git. La estructura de primer nivel es idéntica.

## Vista general de la estructura de primer nivel

```bash
<app-path>/
├── .nb/                   # Metadatos guardados por el CLI para el env actual
├── source/                # Proyecto de código fuente de la aplicación (núcleo NocoBase + plugins integrados)
├── storage/               # Directorio de datos en tiempo de ejecución
│   ├── plugins/           # Plugins compilados (subidos o importados)
│   └── tar/               # Archivos de paquete de plugins (.tgz)
├── plugins/               # Código fuente de sus plugins (nb scaffold plugin genera aquí)
├── .env                   # Archivo de variables de entorno de la aplicación
```

## plugins/ — directorio de desarrollo de plugins

`plugins/` es la ubicación principal para el desarrollo de sus plugins personalizados. Los plugins creados mediante `nb scaffold plugin` se colocan aquí.

`nb` sincroniza automáticamente los plugins de `plugins/` como enlaces simbólicos hacia `source/packages/plugins/`, para los flujos de desarrollo y construcción. No necesita manipular manualmente el contenido del directorio `source/`.

## source/ — directorio del proyecto fuente

El directorio `source/` contiene el proyecto de código fuente completo de NocoBase. Su contenido depende del origen del proyecto:

- **Fuente npm** (`create-nocobase-app`): por defecto solo contiene `packages/plugins/` y otros directorios básicos.
- **Fuente Git** (recomendada): contiene el código fuente completo del núcleo del framework (`packages/core/`), los plugins integrados, etc.; al desarrollar con IA, puede consultar directamente estas fuentes.

## storage/ — directorio de tiempo de ejecución

`storage/` contiene los datos generados en tiempo de ejecución y las salidas de construcción:

- `plugins/`: plugins empaquetados subidos a través de la interfaz o importados mediante el CLI.
- `tar/`: paquetes comprimidos de plugins generados tras ejecutar `nb source build <plugin> --tar`.

## Rutas de carga y prioridad de los plugins

Los plugins pueden existir en múltiples ubicaciones; al iniciar, NocoBase los carga en el siguiente orden de prioridad:

1. La versión del código fuente en `source/packages/plugins` (para desarrollo y depuración local, sincronizada automáticamente por `nb` desde `plugins/`).
2. La versión empaquetada en `storage/plugins` (subida a través de la interfaz o importada mediante el CLI).
3. Los paquetes de dependencia en `node_modules` (instalados vía npm/yarn o integrados en el framework).

Si un plugin con el mismo nombre existe tanto en el directorio de código fuente como en el directorio empaquetado, NocoBase priorizará la carga de la versión del código fuente, facilitando las anulaciones locales y la depuración.

## Plantilla de directorio de plugin

Cree un plugin usando el CLI:

```bash
nb scaffold plugin @my-project/plugin-hello
```

La estructura de directorio generada es la siguiente:

```bash
plugins/@my-project/plugin-hello/
├── dist/                    # Salida de compilación (generada según sea necesario)
├── src/                     # Directorio de código fuente
│   ├── client-v2/           # Código frontend (bloques, páginas, modelos, etc.)
│   │   ├── plugin.ts        # Clase principal del plugin del lado del cliente
│   │   └── index.ts         # Entrada del lado del cliente
│   ├── locale/              # Recursos multilingües (compartidos entre frontend y backend)
│   ├── swagger/             # Documentación OpenAPI/Swagger
│   └── server/              # Código del lado del servidor
│       ├── collections/     # Definiciones de colecciones / tablas
│       ├── commands/        # Comandos personalizados
│       ├── migrations/      # Scripts de migración de base de datos
│       ├── plugin.ts        # Clase principal del plugin del lado del servidor
│       └── index.ts         # Entrada del lado del servidor
├── index.ts                 # Exportación puente frontend-backend
├── client-v2.d.ts           # Declaraciones de tipo frontend
├── client-v2.js             # Artefacto de compilación frontend
├── server.d.ts              # Declaraciones de tipo del lado del servidor
├── server.js                # Artefacto de compilación del lado del servidor
├── .npmignore               # Configuración de exclusión para publicación
└── package.json
```

:::tip Nota

Una vez completada la compilación, el directorio `dist/` y los archivos `client-v2.js` y `server.js` se cargarán cuando el plugin esté habilitado. Durante el desarrollo, solo necesita modificar el directorio `src/`; antes de publicar, ejecute `nb source build <plugin>` o `nb source build <plugin> --tar`.

:::

## Enlaces relacionados

- [Escriba su primer plugin](./write-your-first-plugin.md) — cree un plugin desde cero y experimente el flujo completo de desarrollo
- [Descripción general del desarrollo en el servidor](./server/index.md) — presentación y conceptos centrales de los plugins del lado del servidor
- [Descripción general del desarrollo en el cliente](./client/index.md) — presentación y conceptos centrales de los plugins del lado del cliente
- [Compilación y empaquetado](./build.md) — proceso de compilación, empaquetado y distribución de plugins
- [Gestión de dependencias](./dependency-management.md) — declaración y gestión de dependencias de plugins
