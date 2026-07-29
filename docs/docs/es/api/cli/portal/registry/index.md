---
title: "nb portal registry"
description: "Referencia de nb portal registry: administra los elementos de Portal Registry aportados por plugins en un espacio de trabajo de AI Portal."
keywords: "nb portal registry,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry

Administra los elementos de NocoBase Portal Registry en un espacio de trabajo de AI Portal. Los plugins habilitados en el servidor pueden publicar integraciones frontend reutilizables, como componentes, hooks, adaptadores y páginas de demostración. Los comandos de Registry instalan esas integraciones en el código fuente del Portal.

## Uso

```bash
nb portal registry <comando>
```

## Subcomandos

| Comando | Descripción |
| --- | --- |
| [`nb portal registry sync`](./sync.md) | Instala o actualiza los elementos de Registry publicados por los plugins de NocoBase habilitados |

## Requisitos

- El espacio de trabajo del Portal debe existir y contener `package.json` y `components.json`.
- El entorno de NocoBase seleccionado debe exponer la API de Portal Registry.
- Solo están disponibles los elementos aportados por plugins habilitados.

## Ejemplos

Instalar todos los elementos disponibles en el Portal `customer`:

```bash
nb portal registry sync customer
```

Instalar elementos concretos:

```bash
nb portal registry sync customer ai acl auth-sms
```

## Comandos relacionados

- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
