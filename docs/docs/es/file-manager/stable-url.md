---
pkg: '@nocobase/plugin-file-manager'
title: "URL estable (URL proxy)"
description: "Explica el formato, los permisos, las redirecciones y el comportamiento de las URL estables de archivos en NocoBase."
keywords: "URL estable,URL proxy,URL permanente,acceso a archivos,vista previa de Office,NocoBase"
---

# URL estable

Los archivos administrados por un motor de almacenamiento se abren mediante una **URL estable**. NocoBase comprueba el registro y los permisos, y después redirige a la URL real generada por el almacenamiento.

## Formato

```text
/files/<app>/<dataSource>/<collection>/<id><extname>
```

Con `APP_PUBLIC_PATH=/nocobase`, la ruta comienza por `/nocobase/files/`. El ID y la extensión no pueden modificarse después de crear el archivo, por lo que la URL permanece estable mientras exista el registro.

| Uso | URL | Comportamiento |
|---|---|---|
| Abrir | `/files/.../42.pdf` | Comprueba permisos y redirige al archivo |
| Vista previa | `/files/.../42.png?preview=1` | Redirige a la miniatura o vista previa |
| Descargar | `/files/.../42.pdf?download=1` | Redirige con semántica de descarga |
| Office | `/files/.../42.xlsx?temporaryAccessToken=...` | Acceso temporal para Office Online Viewer |

## Comportamiento en NocoBase

- Los campos de adjuntos, las tablas de archivos y la [HTTP API](./http-api.md) devuelven la URL estable en `url` y `preview`
- Markdown guarda la URL estable y admite almacenamiento privado S3, OSS, COS o S3 Pro
- Un campo URL de adjunto conserva las URL externas introducidas manualmente, pero usa la URL estable para archivos administrados
- Las vistas previas normales usan la sesión y los permisos actuales de NocoBase
- Un formulario público solo permite ver los archivos subidos durante la sesión limitada de ese formulario

## Vista previa de Office

Microsoft Office Online Viewer no puede usar la cookie del usuario. Al abrir la vista previa, NocoBase comprueba primero el permiso y emite una URL temporal vinculada al archivo. Dura 10 minutos de forma predeterminada y puede configurarse entre 5 y 10 minutos con `TEMPORARY_FILE_ACCESS_EXPIRES_IN`.

No guardes esa URL temporal en campos, Markdown ni datos de negocio, y no la uses como enlace compartido.

## Precauciones

- Estable no significa público; el destinatario todavía necesita permisos
- Al eliminar o mover el registro a otro contexto, la URL anterior deja de funcionar
- La respuesta es una redirección `302`; los clientes deben seguirla
- No guardes `302 Location` ni `temporaryAccessToken`
- El proxy inverso debe reenviar a NocoBase la ruta `/files/` situada bajo `APP_PUBLIC_PATH`. En despliegues bajo una subruta, también debe conservarse la ruta compatible `/files/` en la raíz. Las configuraciones generadas por la CLI de NocoBase incluyen ambas reglas automáticamente
- Usa un `hostname` diferente para cada servicio NocoBase independiente, en vez de diferenciarlos únicamente por el puerto. Las cookies del navegador no se aíslan por puerto; consulta [Despliegue en producción](../get-started/deployment/production.md)
- Las subaplicaciones de un mismo despliegue de NocoBase se distinguen por el nombre de la aplicación y no necesitan hostnames separados. Sin embargo, un servicio independiente en otro puerto sigue necesitando aislamiento por hostname si contiene una aplicación principal o subaplicación con el mismo nombre

## Enlaces relacionados

- [HTTP API](./http-api.md) — Subir y consultar archivos
- [Vista previa de archivos](./file-preview/index.md) — Formatos de vista previa
- [Vista previa de Office](./file-preview/ms-office.md) — Configurar Office Online Viewer
- [Motores de almacenamiento](./storage/index.md) — Configurar el almacenamiento
