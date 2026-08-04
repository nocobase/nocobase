---
title: "Estructura del proyecto y stack técnico"
description: "El stack técnico, las convenciones de directorios, las variables de entorno y los comandos habituales de la plantilla del AI Portal, para que pueda juzgar si la IA ha puesto su código en el lugar correcto."
keywords: "AI Portal, estructura del proyecto, stack técnico, React, Vite, Refine, Tailwind CSS, shadcn/ui, variables de entorno"
---

# Estructura del proyecto y stack técnico

:::tip Requisitos previos

Antes de leer esta página, asegúrese de tener su primer Portal en marcha siguiendo el [Inicio rápido del AI Portal](./index.md).

:::

La mayor parte del desarrollo diario puede dejarse en manos de la IA. Aun así, conocer la estructura de la plantilla le permite juzgar si la IA ha puesto su código en el lugar correcto y facilita localizar los problemas.

## Stack técnico

La plantilla de Portal se basa en `@nocobase/portal-template-default`, con el código fuente en [nocobase/portal-template-default](https://github.com/nocobase/portal-template-default).

| Tecnología | Uso |
| --- | --- |
| React 19 + TypeScript | Framework frontend |
| Vite | Servidor de desarrollo y herramienta de compilación |
| [Refine](https://refine.dev/docs/) | Framework de la capa de datos: recursos, rutas, formularios y permisos |
| Tailwind CSS 4 | Estilos |
| [shadcn/ui](https://ui.shadcn.com/) | Base de componentes, con el código fuente propiedad del proyecto |
| lucide | Biblioteca de iconos |
| pnpm | Gestor de paquetes |

Esta combinación es el stack frontend que la IA mejor conoce hoy en día, lo que hace que lo que escribe sea más preciso.

Por ahora el Portal es un proyecto puramente frontend, con la lógica de negocio resuelta mediante la API de NocoBase, los componentes estándar y demás. El soporte para que el AI Agent escriba también el código backend del Portal llegará más adelante.

## Estructura de directorios

```text
src/
├── app/            Rutas y carga de extensiones
├── pages/          Inicio de sesión, registro, recuperación de contraseña, etc.
├── components/     Componentes
│   ├── ui/         Base de componentes shadcn/ui
│   ├── app-shell/  Diseño, navegación, estados de carga
│   ├── auth/       Componentes de autenticación
│   └── ...
├── extensions/     Extensiones, activas una vez instaladas
├── lib/            Envoltorio del cliente de NocoBase y lógica de ACL
├── providers/      Providers de Refine
├── hooks/          Hooks personalizados
└── locales/        Textos localizados
```

Algunas ubicaciones clave:

- **`src/app/routes.tsx`**: estructura de rutas. Las rutas autenticadas y no autenticadas están separadas, y las rutas que aportan las extensiones se montan automáticamente
- **`src/app/extensions.tsx`**: carga de extensiones, mediante `import.meta.glob` para escanear `src/extensions/*/extension.tsx`
- **`src/providers/data.ts`**: el data provider de Refine, que traduce la sintaxis de consulta de Refine a parámetros de la API de NocoBase
- **`src/lib/nocobase/client.ts`**: `NocoBaseClient`, el envoltorio de bajo nivel que hay detrás de cada petición
- **`src/components/ui/`**: unos 60 componentes de shadcn/ui, listos para usar

Las páginas de negocio suelen ir bajo `src/extensions/`, un directorio por módulo funcional. Consulte [Componentes estándar y extensiones](./components.md).

## Archivos clave

| Archivo | Uso |
| --- | --- |
| `AGENTS.md` | Convenciones de desarrollo para el AI Agent. Aquí puede añadir las reglas de su propio proyecto |
| `components.json` | Configuración de shadcn/ui, incluidos el estilo, la biblioteca de iconos y los alias de rutas |
| `.env` / `.env.local` | Variables de entorno, actualizadas automáticamente por `nb portal dev` y `deploy` |
| `vite.config.ts` | Configuración de compilación, incluido el proxy de API que se usa durante el desarrollo |

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `NOCOBASE_API_URL` | Raíz de la REST API de NocoBase, **debe terminar en `/api`**. Suele ser `/api` en despliegues del mismo origen |
| `NOCOBASE_PORTAL_BASE` | Ruta pública en la que se monta el Portal. `/` para el desarrollo local, y la ruta real de despliegue como `/x/main/` para las compilaciones |
| `NOCOBASE_AUTHENTICATOR` | Nombre del autenticador, `basic` por defecto |
| `NOCOBASE_API_TOKEN` | Token temporal para desarrollo. No confirme un valor real |
| `API_CLIENT_STORAGE_PREFIX` | Prefijo de almacenamiento del token. Manténgalo alineado si el servidor lo ha personalizado |
| `API_CLIENT_STORAGE_TYPE` | Método de almacenamiento del token, `localStorage` por defecto |
| `API_CLIENT_SHARE_TOKEN` | Si se comparte el token, `false` por defecto |

`nb portal dev` y `nb portal deploy` las escriben por usted, así que normalmente no necesitará tocarlas. Las tres últimas solo hay que alinearlas cuando el servidor haya personalizado la forma de almacenar los tokens de autenticación.

Durante el desarrollo, si `NOCOBASE_API_URL` es una dirección absoluta, Vite configura un proxy para reenviar las peticiones, de modo que no tendrá que ocuparse usted mismo del CORS.

## Comandos habituales

Estos son los que usará en el día a día. La instalación de dependencias, la actualización de las variables de entorno y las compilaciones las gestiona la CLI en segundo plano:

| Comando | Uso |
| --- | --- |
| `nb portal list` | Ver qué Portals tiene la aplicación actual |
| `nb portal info <portal>` | Consultar la ruta de desarrollo, la ruta de despliegue y la URL de acceso de un Portal |
| `nb portal create <portal>` | Crear a partir de la plantilla el espacio de trabajo de desarrollo de un Portal nuevo |
| `nb portal pull <portal>` | Descargar el código fuente remoto del Portal al espacio de trabajo de desarrollo local |
| `nb portal dev <portal>` | Iniciar el servidor de desarrollo local y ver los cambios en directo |
| `nb portal push <portal>` | Enviar los cambios del código fuente local al remoto |
| `nb portal deploy <portal>` | Compilar y desplegar, para que los cambios lleguen a los usuarios |
| `nb portal config <portal>` | Ajustar el source storage, la configuración de Git y la ruta del espacio de trabajo de desarrollo |
| `nb portal destroy <portal>` | Eliminar el registro de Portal y sus archivos desplegados |

Para conocer los parámetros completos de cada comando, consulte la [Referencia del comando `nb portal`](../../api/cli/portal/index.md).

## Dónde vive el espacio de trabajo de desarrollo

El espacio de trabajo de desarrollo de un Portal se crea en el directorio en el que se encontraba al ejecutar `nb portal create` o `nb portal pull`:

```text
./<portal>
```

Puede indicar otra ubicación con `--path` al crear o al descargar. Los artefactos de despliegue compilados van a otro sitio, bajo el storage de la aplicación destino, se mantienen sincronizados mediante `nb portal deploy` y normalmente no hay que ocuparse de ellos.

Si no está seguro de dónde está el espacio de trabajo de desarrollo de un Portal, simplemente consúltelo:

```bash
nb portal info main
```

## Enlaces relacionados

- [Inicio rápido del AI Portal](./index.md) — ponga en marcha su primera entrada frontend escrita por la IA
- [Componentes estándar y extensiones](./components.md) — la base de componentes shadcn/ui y el mecanismo de extensión
- [Despliegue y gestión del código fuente](./deploy.md) — el flujo de compilación y despliegue, y el source storage
- [Construcción con un AI Agent](./agent-workflow.md) — dirija a la IA en lenguaje natural para que escriba las páginas
- [`nb portal info`](../../api/cli/portal/info.md) — consulte dónde está el espacio de trabajo de desarrollo de un Portal
