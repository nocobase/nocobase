:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Descripción general del desarrollo de plugins

NocoBase utiliza una **arquitectura de microkernel**, donde el núcleo solo se encarga de la programación del ciclo de vida de los plugins, la gestión de dependencias y la encapsulación de capacidades básicas. Todas las funcionalidades de negocio se ofrecen en forma de plugins. Por lo tanto, comprender la estructura organizativa, el ciclo de vida y la forma de gestionar los plugins es el primer paso para personalizar NocoBase.

## Conceptos clave

- **Plug and Play**: Usted puede instalar, activar o desactivar plugins según sus necesidades, lo que permite combinar funciones de negocio de forma flexible sin modificar el código.
- **Integración full-stack**: Los plugins suelen incluir implementaciones tanto del lado del servidor como del lado del cliente, asegurando la coherencia entre la lógica de datos y las interacciones de la interfaz de usuario.

## Estructura básica de un plugin

Cada plugin es un paquete npm independiente y, por lo general, contiene la siguiente estructura de directorios:

```bash
plugin-hello/
├─ package.json          # Nombre del plugin, dependencias y metadatos del plugin NocoBase
├─ client.js             # Artefacto de compilación frontend para la carga en tiempo de ejecución
├─ server.js             # Artefacto de compilación del lado del servidor para la carga en tiempo de ejecución
├─ src/
│  ├─ client/            # Código fuente del lado del cliente, puede registrar bloques, acciones, campos, etc.
│  └─ server/            # Código fuente del lado del servidor, puede registrar recursos, eventos, comandos, etc.
```

## Convenciones de directorios y orden de carga

NocoBase escanea los siguientes directorios por defecto para cargar plugins:

```bash
my-nocobase-app/
├── packages/
│   └── plugins/          # Plugins en desarrollo (máxima prioridad)
└── storage/
    └── plugins/          # Plugins compilados, por ejemplo, plugins subidos o publicados
```

- `packages/plugins`: Se utiliza para el desarrollo local de plugins, con soporte para compilación y depuración en tiempo real.
- `storage/plugins`: Almacena plugins compilados, como los de ediciones comerciales o de terceros.

## Ciclo de vida y estados de un plugin

Un plugin suele pasar por las siguientes etapas:

1.  **Crear** (`create`): Crea una plantilla de plugin a través de la CLI.
2.  **Descargar** (`pull`): Descarga el paquete del plugin localmente, pero aún no se ha escrito en la base de datos.
3.  **Activar** (`enable`): En su primera activación, ejecuta "registro + inicialización"; las activaciones posteriores solo cargan la lógica.
4.  **Desactivar** (`disable`): Detiene la ejecución del plugin.
5.  **Eliminar** (`remove`): Elimina completamente el plugin del sistema.

:::tip

-   `pull` solo descarga el paquete del plugin; el proceso de instalación real se activa con la primera `enable`.
-   Si un plugin solo se ha `pull`ado pero no se ha activado, no se cargará.

:::

### Ejemplos de comandos CLI

```bash
# 1. Crea el esqueleto del plugin
yarn pm create @my-project/plugin-hello

# 2. Descarga el paquete del plugin (descargar o enlazar)
yarn pm pull @my-project/plugin-hello

# 3. Activa el plugin (se instala automáticamente en la primera activación)
yarn pm enable @my-project/plugin-hello

# 4. Desactiva el plugin
yarn pm disable @my-project/plugin-hello

# 5. Elimina el plugin
yarn pm remove @my-project/plugin-hello
```

## Interfaz de gestión de plugins

Acceda al gestor de plugins en el navegador para ver y gestionar plugins de forma intuitiva:

**URL por defecto:** [http://localhost:13000/admin/settings/plugin-manager](http://localhost:13000/admin/settings/plugin-manager)

![Gestor de plugins](https://static-docs.nocobase.com/20251030195350.png)