---
title: Guía para actualizar NocoBase 2.0 a 2.1
description: Actualiza una aplicación NocoBase 2.0 a 2.1, con métodos antiguos de instalación, opciones de nb CLI y ruta de migración recomendada.
---

# Cómo actualizar NocoBase de 2.0 a 2.1

Actualizar de NocoBase 2.0 a NocoBase 2.1 es un proceso fluido para la aplicación. El cambio más grande está en NocoBase CLI.

En concreto:

- En 2.0 y versiones anteriores, los comandos de CLI suelen empezar con `yarn nocobase`
- En 2.1 y versiones posteriores, la CLI usa el `nb` instalado globalmente

Las aplicaciones antiguas no tienen que migrar a `nb` de inmediato. Si solo quieres actualizar a 2.1 una aplicación NocoBase 2.0 que ya funciona de forma estable, sigue usando por defecto el método original de instalación y actualización. Para las aplicaciones nuevas, recomendamos usar la nueva CLI `nb`.

## Seguir usando el método original de instalación y actualización

Si ya estás acostumbrado al método de instalación anterior, puedes seguir usándolo. La instalación y la actualización continúan siguiendo la documentación original.

### Instalar NocoBase

- [Instalación con Docker](/get-started/installation/docker)
- [Instalación con create-nocobase-app](/get-started/installation/create-nocobase-app)
- [Instalación desde código fuente con Git](/get-started/installation/git)

### Actualizar NocoBase

- [Actualizar una instalación con Docker](/get-started/upgrading/docker)
- [Actualizar una instalación con create-nocobase-app](/get-started/upgrading/create-nocobase-app)
- [Actualizar una instalación desde código fuente con Git](/get-started/upgrading/git)

## Usar `nb` CLI para aplicaciones nuevas

Para aplicaciones nuevas, recomendamos el método más cómodo de instalación y actualización con `nb`.

### Instalar NocoBase

- [Instalar la aplicación NocoBase](./install-nocobase-app.md)

### Actualizar NocoBase

- [Actualizar la aplicación NocoBase](./upgrade-nocobase-app.md)

## Cómo migrar a `nb` CLI

Si quieres gestionar las aplicaciones con `nb` de forma unificada más adelante, por ahora el enfoque más fiable es crear una aplicación nueva y migrar allí los datos de la aplicación antigua.

Pasos de migración:

1. Crea primero una nueva aplicación CLI con `nb init`
2. Migra la base de datos, `storage` y las variables de entorno necesarias de la aplicación antigua
3. Después de verificar que la aplicación nueva funciona correctamente, cambia el entorno de producción

También puedes esperar un tiempo. La capacidad de `nb` para tomar el control de aplicaciones locales existentes todavía está en desarrollo.

![2026-06-13-21-29-24](https://static-docs.nocobase.com/2026-06-13-21-29-24.png)
