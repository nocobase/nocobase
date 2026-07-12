---
pkg: '@nocobase/plugin-file-manager'
title: "URL estable (URL proxy)"
description: "Explica el formato, los permisos, las redirecciones y el comportamiento de las URL estables de archivos en NocoBase."
keywords: "URL estable,URL proxy,URL permanente,acceso a archivos,vista previa de Office,NocoBase"
---

# URL estable (URL proxy)

Los archivos administrados por un motor de almacenamiento se abren mediante una **URL estable**. NocoBase comprueba el registro y los permisos, y después redirige a la URL real generada por el almacenamiento.

El nombre anterior «URL permanente» solo indica que la URL guardada no cambia con cada firma temporal del almacenamiento. No significa que el archivo sea público ni que exista para siempre.

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
- El proxy inverso debe reenviar `/files/` bajo `APP_PUBLIC_PATH` a NocoBase

## Enlaces relacionados

- [HTTP API](./http-api.md) — Subir y consultar archivos
- [Vista previa de archivos](./file-preview/index.md) — Formatos de vista previa
- [Vista previa de Office](./file-preview/ms-office.md) — Configurar Office Online Viewer
- [Motores de almacenamiento](./storage/index.md) — Configurar el almacenamiento
