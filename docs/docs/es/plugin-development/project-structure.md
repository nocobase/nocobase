:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Estructura del Proyecto

Ya sea que clone el código fuente desde Git o inicialice un proyecto usando `create-nocobase-app`, el proyecto NocoBase generado es esencialmente un monorepo basado en **Yarn Workspace**.

## Visión General del Directorio Principal

El siguiente ejemplo utiliza `my-nocobase-app/` como directorio del proyecto. Puede haber ligeras diferencias según el entorno:

```bash
my-nocobase-app/
├── packages/              # Código fuente del proyecto
│   ├── plugins/           # Código fuente de plugins en desarrollo (sin compilar)
├── storage/               # Datos de tiempo de ejecución y contenido generado dinámicamente
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # Plugins compilados (incluidos los subidos a través de la interfaz de usuario)
│   └── tar/               # Archivos de paquete de plugins (.tar)
├── scripts/               # Scripts de utilidad y comandos de herramientas
├── .env*                  # Configuraciones de variables de entorno para diferentes entornos
├── lerna.json             # Configuración del workspace de Lerna
├── package.json           # Configuración del paquete raíz, declara el workspace y los scripts
├── tsconfig*.json         # Configuraciones de TypeScript (frontend, backend, mapeo de rutas)
├── vitest.config.mts      # Configuración de pruebas unitarias de Vitest
└── playwright.config.ts   # Configuración de pruebas E2E de Playwright
```

## Descripción del Subdirectorio `packages/`

El directorio `packages/` contiene los módulos centrales de NocoBase y los paquetes extensibles. El contenido depende del origen del proyecto:

- **Proyectos creados con `create-nocobase-app`**: Por defecto, solo incluye `packages/plugins/`, utilizado para almacenar el código fuente de **plugins** personalizados. Cada subdirectorio es un paquete npm independiente.
- **Repositorio de código fuente oficial clonado**: Podrá ver más subdirectorios, como `core/`, `plugins/`, `pro-plugins/`, `presets/`, etc., que corresponden al núcleo del framework, los **plugins** integrados y las soluciones preestablecidas oficiales.

En cualquier caso, `packages/plugins` es la ubicación principal para desarrollar y depurar **plugins** personalizados.

## Directorio de Tiempo de Ejecución `storage/`

`storage/` almacena los datos generados en tiempo de ejecución y las salidas de compilación. A continuación, se describen los subdirectorios comunes:

- `apps/`: Configuración y caché para escenarios de múltiples aplicaciones.
- `logs/`: Registros de ejecución y salida de depuración.
- `uploads/`: Archivos y recursos multimedia subidos por los usuarios.
- `plugins/`: **Plugins** empaquetados subidos a través de la interfaz de usuario o importados mediante CLI.
- `tar/`: Paquetes comprimidos de **plugins** generados después de ejecutar `yarn build <plugin> --tar`.

> Generalmente, se recomienda añadir el directorio `storage` a `.gitignore` y gestionarlo por separado durante el despliegue o la copia de seguridad.

## Configuración de Entorno y Scripts del Proyecto

- `.env`、`.env.test`、`.env.e2e`: Se utilizan para la ejecución local, las pruebas unitarias/de integración y las pruebas de extremo a extremo (E2E), respectivamente.
- `scripts/`: Almacena scripts de mantenimiento comunes (como inicialización de bases de datos, utilidades de publicación, etc.).

## Rutas de Carga y Prioridad de los **Plugins**

Los **plugins** pueden existir en múltiples ubicaciones. NocoBase los cargará en el siguiente orden de prioridad al iniciar:

1. La versión del código fuente en `packages/plugins` (para desarrollo y depuración local).
2. La versión empaquetada en `storage/plugins` (subida a través de la interfaz de usuario o importada mediante CLI).
3. Los paquetes de dependencia en `node_modules` (instalados vía npm/yarn o integrados en el framework).

Cuando un **plugin** con el mismo nombre existe tanto en el directorio de código fuente como en el directorio empaquetado, el sistema priorizará la carga de la versión del código fuente, facilitando las anulaciones locales y la depuración.

## Plantilla de Directorio de **Plugins**

Cree un **plugin** usando la CLI:

```bash
yarn pm create @my-project/plugin-hello
```

La estructura de directorio generada es la siguiente:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # Salida de compilación (generada según sea necesario)
├── src/                     # Directorio de código fuente
│   ├── client/              # Código frontend (bloques, páginas, modelos, etc.)
│   │   ├── plugin.ts        # Clase principal del plugin del lado del cliente
│   │   └── index.ts         # Entrada del lado del cliente
│   ├── locale/              # Recursos multilingües (compartidos entre frontend y backend)
│   ├── swagger/             # Documentación OpenAPI/Swagger
│   └── server/              # Código del lado del servidor
│       ├── collections/     # Definiciones de colecciones
│       ├── commands/        # Comandos personalizados
│       ├── migrations/      # Scripts de migración de base de datos
│       ├── plugin.ts        # Clase principal del plugin del lado del servidor
│       └── index.ts         # Entrada del lado del servidor
├── index.ts                 # Exportación de puente frontend y backend
├── client.d.ts              # Declaraciones de tipo frontend
├── client.js                # Artefacto de compilación frontend
├── server.d.ts              # Declaraciones de tipo del lado del servidor
├── server.js                # Artefacto de compilación del lado del servidor
├── .npmignore               # Configuración de ignorar para publicación
└── package.json
```

> Una vez completada la compilación, el directorio `dist/` y los archivos `client.js` y `server.js` se cargarán cuando el **plugin** esté habilitado.
> Durante el desarrollo, solo necesita modificar el directorio `src/`. Antes de publicar, ejecute `yarn build <plugin>` o `yarn build <plugin> --tar`.