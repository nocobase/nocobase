---
title: "nb plugin import"
description: "Referencia del comando nb plugin import: importa un archivo de plugin empaquetado o un paquete npm al directorio storage/plugins del env de NocoBase seleccionado, o a una ruta de storage personalizada."
keywords: "nb plugin import,NocoBase CLI,importar plugin,storage-path,npm-registry"
---

# nb plugin import

Importa un archivo de plugin empaquetado o un paquete npm a `storage/plugins`. Este comando solo coloca el plugin en el directorio de destino. No lo habilita automáticamente.

## Uso

```bash
nb plugin import <archive> [flags]
```

## Parámetros

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `<archive>` | string | Origen del plugin. Obligatorio. Admite una ruta local `.tgz`, una URL remota de archivo `http(s)` o un nombre / tag de paquete npm |
| `--env`, `-e` | string | Nombre del env de la CLI. Si se omite, normalmente se usa el env actual. Si pasas `--storage-path` de forma explícita, puedes omitir `--env` |
| `--yes`, `-y` | boolean | Omite la confirmación interactiva cuando un `--env` pasado explícitamente apunta a un env distinto del actual |
| `--storage-path` | string | Sobrescribe la ruta raíz de storage de destino. El directorio real de importación es `<storage-path>/plugins` |
| `--npm-registry` | string | Especifica el registro npm que se debe usar cuando el origen es un nombre o tag de paquete npm |

## Ejemplos

```bash
# Archivo remoto
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# Archivo local
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# Paquete npm o tag
nb plugin import @my-scope/plugin-auth-cas@beta

# Registro npm privado
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# Escribir directamente en una ruta local de storage sin depender del env actual
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## Notas

Si ya seleccionaste el env de destino, normalmente basta con importar directamente al `storage/plugins` de ese env.

Si solo quieres escribir el plugin en un directorio de storage local, pasa `--storage-path`. En ese caso puedes omitir `--env` y la CLI escribirá directamente en `<storage-path>/plugins`.

Después de importar, el siguiente paso habitual es reiniciar la aplicación y luego decidir si también necesitas habilitar el plugin. En la mayoría de los casos:

- Para una instalación por primera vez, ejecuta primero [`nb app restart`](../app/restart.md) y luego [`nb plugin enable`](./enable.md)
- Si solo volviste a importar una versión más reciente, reinicia primero la app y luego verifica que la nueva versión ya se haya cargado

Si el origen está en un registro npm privado, primero inicia sesión y luego impórtalo:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning Nota

No necesitas extraer nada manualmente en `storage/plugins`. `nb plugin import` coloca el plugin automáticamente en el directorio correcto.

:::

## Comandos relacionados

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`Instalar y actualizar plugins de terceros`](../../../nocobase-cli/plugins/third-party.md)
