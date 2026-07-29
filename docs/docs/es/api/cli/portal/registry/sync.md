---
title: "nb portal registry sync"
description: "Referencia de nb portal registry sync: instala, compara o actualiza elementos de Registry aportados por plugins en un AI Portal."
keywords: "nb portal registry sync,NocoBase CLI,Portal Registry,shadcn,AI Portal"
---

# nb portal registry sync

Instala elementos de NocoBase Portal Registry en un espacio de trabajo de AI Portal existente. El comando lee el índice de Registry del servicio NocoBase seleccionado, por lo que los plugins recién habilitados quedan disponibles sin codificar sus elementos en la plantilla del Portal.

## Uso

```bash
nb portal registry sync <portal> [elementos...] [opciones]
```

## Argumentos y opciones

| Argumento u opción | Tipo | Descripción |
| --- | --- | --- |
| `<portal>` | string | Nombre o slug obligatorio del AI Portal |
| `[elementos...]` | string[] | Nombres opcionales de elementos de Registry. Si se omiten, se instalan todos los elementos de los plugins habilitados. Se aceptan `ai` y `@nocobase/ai` |
| `--env`, `-e` | string | Nombre del entorno CLI; si se omite, se usa el entorno actual |
| `--yes`, `-y` | boolean | Omite la confirmación cuando `--env` apunta a otro entorno |
| `--overwrite` | boolean | Reemplaza archivos de Registry instalados, conservando los archivos existentes de `src/components/ui` |
| `--overwrite-ui` | boolean | Permite que `--overwrite` reemplace también `src/components/ui`; requiere `--overwrite` |
| `--diff` | boolean | Muestra diferencias sin modificar el Portal |
| `--build` | boolean | Ejecuta `pnpm build` y `pnpm build:html` después de instalar |

## Ejemplos

Instalar todos los elementos disponibles que aún no estén instalados:

```bash
nb portal registry sync customer
```

Instalar elementos concretos:

```bash
nb portal registry sync customer ai acl auth-sms
```

Comparar un elemento instalado con la versión del servicio:

```bash
nb portal registry sync customer ai --diff
```

Actualizar un elemento conservando los componentes UI básicos:

```bash
nb portal registry sync customer ai --overwrite
```

Sobrescribir los archivos de Registry y los componentes UI básicos:

```bash
nb portal registry sync customer --overwrite --overwrite-ui
```

Instalar y compilar el Portal:

```bash
nb portal registry sync customer --build
```

Usar otro entorno en un flujo no interactivo:

```bash
nb portal registry sync customer --env dev --yes
```

## Comportamiento

El comando solicita primero el índice de Registry al servicio NocoBase seleccionado. El servidor solo devuelve elementos aportados por plugins habilitados. Después configura el Registry `@nocobase` en `components.json` e instala los elementos con la CLI local de shadcn del Portal.

De forma predeterminada, se omiten los elementos cuyos archivos de destino ya existen. Al añadir elementos y dependencias ausentes, se protegen los archivos existentes de `src/extensions` y `src/components/ui`.

Use `--overwrite` únicamente para actualizar de forma intencionada archivos de Registry ya instalados. Los componentes UI básicos siguen protegidos salvo que también se indique `--overwrite-ui`. Revise las personalizaciones locales antes de sobrescribir archivos.

`--diff` es de solo lectura y no puede combinarse con `--overwrite`, `--overwrite-ui` ni `--build`.

Si el Portal no contiene `node_modules`, el comando ejecuta `pnpm install --frozen-lockfile` antes de invocar shadcn.

## Comandos relacionados

- [`nb portal registry`](./index.md)
- [`nb portal create`](../create.md)
- [`nb portal dev`](../dev.md)
- [`nb portal deploy`](../deploy.md)
