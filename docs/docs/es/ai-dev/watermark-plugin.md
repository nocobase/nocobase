---
title: "Práctica: Desarrollo del plugin de marca de agua"
description: "Desarrolle un plugin de marca de agua para NocoBase con AI en una sola frase: superposición de marca de agua en la página, detección antimanipulación y parámetros configurables."
keywords: "desarrollo con AI, plugin de marca de agua, plugin de NocoBase, caso práctico, programación con AI"
---

# Práctica: Desarrollo del plugin de marca de agua

Este caso muestra cómo, con una sola frase, hacer que la AI desarrolle un plugin de marca de agua completo para NocoBase, desde la creación del scaffolding hasta la verificación tras habilitarlo, todo realizado por la AI.

## Resultado final

Una vez habilitado el plugin:

- Las páginas de NocoBase quedan cubiertas por una marca de agua semitransparente que muestra el nombre del usuario actualmente conectado.
- La marca de agua no puede eliminarse manipulando el DOM: la detección periódica la regenera automáticamente.
- Desde «Configuración de plugins» puede ajustar el texto, la opacidad y el tamaño de fuente de la marca de agua.

![watermark plugin](https://static-docs.nocobase.com/20260416170645.png)

## Requisitos previos

:::tip Lecturas previas

- [CLI de NocoBase](../ai/quick-start.md) — Instalación e inicio de NocoBase
- [Inicio rápido del desarrollo de plugins con AI](./index.md) — Instalación de los Skills

:::

Asegúrese de tener:

1. Un entorno de desarrollo de NocoBase en ejecución (los Skills de NocoBase se instalan automáticamente al inicializar con el CLI de NocoBase).
2. Un editor con soporte para Agent de AI abierto (por ejemplo, Claude Code, Codex, Cursor, etc.).

:::warning Atención

- NocoBase está migrando de `client` (v1) a `client-v2`. Actualmente `client-v2` aún está en desarrollo. El código de cliente generado por el desarrollo con AI se basa en `client-v2` y solo puede usarse en la ruta `/v2/`. Está disponible para que lo pruebe, pero no se recomienda su uso directo en producción.
- El código generado por la AI no siempre es 100% correcto. Le recomendamos revisarlo antes de habilitarlo. Si encuentra problemas en tiempo de ejecución, puede enviar el mensaje de error a la AI para que continúe diagnosticando y corrigiendo. Normalmente, unas pocas rondas de conversación son suficientes para resolverlos.

:::

## Comenzar

En el directorio raíz de su proyecto NocoBase, envíe el siguiente prompt a la AI:

```
Ayúdame a desarrollar un plugin de marca de agua para NocoBase utilizando el skill nocobase-plugin-development.
Requisitos: superponer una marca de agua semitransparente sobre la página que muestre el nombre del usuario actualmente conectado, para evitar fugas por capturas de pantalla.
Detectar periódicamente si el DOM de la marca de agua ha sido eliminado y, en ese caso, regenerarla.
Permitir configurar el texto, la opacidad y el tamaño de fuente de la marca de agua desde la página de configuración del plugin.
El plugin se llamará @my-project/plugin-watermark.
```

<video width="100%" height="450" controls>
  <source src="https://static-docs.nocobase.com/nocobase-plugin-dev-compressed.mp4" type="video/mp4">
</video>

## ¿Qué hace la AI?

Tras recibir la solicitud, la AI ejecutará automáticamente los siguientes pasos:

### 1. Analizar las necesidades y confirmar el plan

La AI analizará primero qué puntos de extensión de NocoBase necesita este plugin y le proporcionará un plan de desarrollo. Por ejemplo:

> **Lado del servidor:**
> - Una tabla `watermarkSettings` que almacene la configuración de la marca de agua (texto, opacidad, tamaño de fuente).
> - Una API personalizada para leer y escribir la configuración de la marca de agua.
> - Configuración de ACL: los usuarios autenticados pueden leer y los administradores pueden escribir.
>
> **Lado del cliente:**
> - Página de configuración del plugin con un formulario para configurar los parámetros de la marca de agua.
> - Lógica de renderizado de la marca de agua que lea la configuración y la superponga en la página.
> - Detección antimanipulación con un temporizador que monitorice el DOM de la marca de agua.

Una vez confirmado el plan, la AI comienza a escribir código.

<!-- Se necesita una captura de pantalla del terminal con la salida del plan de desarrollo de la AI -->

### 2. Crear el scaffolding del plugin

```bash
yarn pm create @my-project/plugin-watermark
```

La AI generó la estructura estándar del directorio del plugin en `packages/plugins/@my-project/plugin-watermark/`.

### 3. Escribir el código del lado del servidor

La AI generará los siguientes archivos:

- **Definición de la tabla de datos** — Tabla `watermarkSettings` con los campos `text`, `opacity` y `fontSize`.
- **API personalizada** — Interfaces para leer y actualizar la configuración de la marca de agua.
- **Configuración de ACL** — Los usuarios autenticados pueden leer la configuración de la marca de agua y los administradores pueden modificarla.

<!-- Se necesita una captura de pantalla del terminal mostrando el proceso de generación del código del lado del servidor por parte de la AI -->

### 4. Escribir el código del lado del cliente

- **Página de configuración del plugin** — Un formulario de Ant Design para configurar el texto de la marca de agua, la opacidad (deslizador) y el tamaño de fuente.
- **Renderizado de la marca de agua** — Crea una capa canvas/div a pantalla completa sobre la página que muestra el nombre del usuario actualmente conectado.
- **Detección antimanipulación** — `MutationObserver` + temporizador como doble garantía: si se elimina el DOM, se regenera inmediatamente.

<!-- Se necesita una captura de pantalla del terminal mostrando el proceso de generación del código del lado del cliente por parte de la AI -->

### 5. Internacionalización

La AI genera automáticamente los paquetes de idiomas en chino e inglés sin necesidad de operaciones adicionales:

- `src/locale/zh-CN.json` — Traducción al chino
- `src/locale/en-US.json` — Traducción al inglés

### 6. Habilitar el plugin

```bash
yarn pm enable @my-project/plugin-watermark
```

Una vez habilitado, abra una página de NocoBase y verá la marca de agua superpuesta sobre el contenido.

<!-- Se necesita un vídeo del flujo completo: introducir el prompt → la AI genera el código → habilitar el plugin → la marca de agua aparece en la página → abrir la página de configuración para ajustar parámetros → la marca de agua cambia en consecuencia -->

## ¿Cuánto tiempo tomó todo el proceso?

Desde la introducción del prompt hasta tener el plugin disponible, aproximadamente **3-5 minutos**. La AI completó el siguiente trabajo:

| Trabajo                              | Estimación de desarrollo manual | AI completado |
| ------------------------------------ | ------------------------------- | ------------- |
| Crear el scaffolding                 | 2 minutos                       | Automático    |
| Tabla de datos + API                 | 20 minutos                      | Automático    |
| Página de configuración del plugin   | 30 minutos                      | Automático    |
| Renderizado + antimanipulación       | 40 minutos                      | Automático    |
| Configuración de ACL                 | 10 minutos                      | Automático    |
| Internacionalización                 | 15 minutos                      | Automático    |
| **Total**                            | **~2 horas**                    | **~5 minutos**|


## ¿Quiere desarrollar más plugins?

El plugin de marca de agua trata principalmente de renderizado en frontend y almacenamiento sencillo en backend. Si desea conocer qué más puede hacer la AI por usted, como bloques personalizados, relaciones complejas entre tablas de datos, extensiones de flujos de trabajo, etc., consulte [Capacidades soportadas](./capabilities).

## Enlaces relacionados

- [Inicio rápido del desarrollo de plugins con AI](./index.md) — Inicio rápido y resumen de capacidades
- [Capacidades soportadas](./capabilities) — Todo lo que la AI puede hacer por usted, con ejemplos de prompts
- [Desarrollo de plugins](../plugin-development/index.md) — Guía completa de desarrollo de plugins de NocoBase
- [CLI de NocoBase](../ai/quick-start.md) — Herramienta de línea de comandos para instalar y gestionar NocoBase
