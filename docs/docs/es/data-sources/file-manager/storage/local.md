---
title: "Almacenamiento local"
description: "El motor de almacenamiento local guarda los archivos en el disco duro del servidor. Permite configurar la ruta de almacenamiento y la URL de acceso, y es adecuado para implementaciones en un solo servidor."
keywords: "Almacenamiento local,Local Storage,almacenamiento de archivos,disco duro del servidor,NocoBase"
---

# Almacenamiento local

Los archivos subidos se guardarán en el directorio del disco duro local del servidor. Esta opción es adecuada para escenarios en los que el volumen total de archivos subidos administrados por el sistema es reducido o para usos experimentales.

## Parámetros de configuración

![Ejemplo de configuración del motor de almacenamiento de archivos](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Nota}
Solo se presentan los parámetros específicos del motor de almacenamiento local. Para consultar los parámetros generales, consulte [Parámetros generales del motor](./index.md#引擎通用参数).
:::

### Ruta

Indica simultáneamente la ruta relativa donde se almacenan los archivos en el servidor y la ruta de acceso mediante URL. Por ejemplo: “`user/avatar`” (sin incluir “`/`” al principio ni al final) representa:

1. La ruta relativa donde se almacenan los archivos en el servidor al subirlos: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. El prefijo de la dirección URL para acceder a los archivos: `http://localhost:13000/storage/uploads/user/avatar`.