---
title: "nb api comandos dinámicos"
description: "Referencia de los comandos dinámicos de nb api: comandos de la API del CLI generados a partir del esquema OpenAPI de NocoBase."
keywords: "nb api comandos dinámicos,NocoBase CLI,OpenAPI,swagger"
---

# nb api comandos dinámicos

Además de [`nb api resource`](./resource/index.md), bajo `nb api` existe un grupo de comandos generados dinámicamente a partir del esquema OpenAPI de la aplicación NocoBase. Estos comandos se generan y se almacenan en caché la primera vez que se ejecuta [`nb env add`](../env/add.md) o [`nb env update`](../env/update.md).

## Grupos comunes

| Grupo de comandos | Descripción |
| --- | --- |
| `nb api acl` | Gestión de permisos: roles, permisos de recurso y permisos de operación |
| `nb api api-keys` | Gestión de API Keys |
| `nb api app` | Gestión de la aplicación |
| `nb api authenticators` | Gestión de autenticación: contraseña, SMS, SSO, etc. |
| `nb api data-modeling` | Modelado de datos: fuentes de datos, tablas y campos |
| `nb api file-manager` | Gestión de archivos: servicios de almacenamiento y archivos adjuntos |
| `nb api flow-surfaces` | Composición de páginas: páginas, bloques, campos y acciones |
| `nb api system-settings` | Configuración del sistema: título, logo, idioma, etc. |
| `nb api theme-editor` | Gestión de temas: colores, tamaños y conmutación de temas |
| `nb api workflow` | Workflow: gestión de procesos automatizados |

Los grupos y comandos disponibles realmente dependen de la versión de la aplicación NocoBase conectada y de los plugins habilitados. Ejecute los siguientes comandos para ver los comandos compatibles con la aplicación actual:

```bash
nb api --help
nb api <topic> --help
```

## Parámetros del cuerpo de la solicitud

Los comandos dinámicos con cuerpo de solicitud admiten:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `--body` | string | Cuerpo de la solicitud como cadena JSON |
| `--body-file` | string | Ruta a un archivo JSON |

`--body` y `--body-file` son mutuamente excluyentes.

Los comandos dinámicos de la API también admiten:

- `--env`, `-e`: nombre de la env de CLI a la que se enviará la solicitud; si se omite, se usa la env actual
- `--yes`, `-y`: cuando un `--env` pasado explícitamente apunta a una env distinta de la env actual, omite la confirmación interactiva

Si pasa `--env` explícitamente y es diferente de la env actual, la CLI pedirá confirmación primero. En terminales no interactivos o sesiones de agentes de IA, agregue `--yes` usted mismo o ejecute antes `nb env use <name>` y vuelva a intentarlo.

## Comandos relacionados

- [`nb env update`](../env/update.md)
- [`nb api resource`](./resource/index.md)
