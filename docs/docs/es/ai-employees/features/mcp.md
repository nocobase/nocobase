---
pkg: "@nocobase/plugin-ai"
title: "Integración de AI Employee con MCP"
description: "Conecte servicios MCP a los AI Employees, pruebe la disponibilidad del servicio MCP y administre los permisos de invocación de herramientas MCP."
keywords: "habilidades de AI Employee,MCP,Model Context Protocol,tools"
---

# Integración con MCP

Los AI Employees pueden conectarse a servicios MCP que sigan el protocolo Model Context Protocol (MCP). Una vez integrado un servicio MCP, el AI Employee podrá utilizar las herramientas que dicho servicio proporcione para completar tareas.


## Configuración de MCP

Acceda al módulo de configuración de MCP. Desde aquí puede añadir nuevos servicios MCP y mantener los servicios MCP ya integrados.

![20260323095943](https://static-docs.nocobase.com/20260323095943.png)


## Añadir un servicio MCP

Haga clic en el botón `Add` situado en la parte superior derecha de la lista de servicios MCP y, en la ventana emergente, introduzca la información de conexión del servicio MCP para completar su incorporación.

Se admiten dos protocolos de transporte para servicios MCP: Stdio y HTTP (Streamable / SSE).

![20260323100904](https://static-docs.nocobase.com/20260323100904.png)

Al añadir un servicio MCP es necesario proporcionar `nombre`, `título` y `descripción`. El `nombre` es el identificador único del servicio MCP; el `título` es el nombre que se muestra en el sistema; la `descripción` es opcional y sirve para describir brevemente las funciones que ofrece el servicio MCP.

![20260323101635](https://static-docs.nocobase.com/20260323101635.png)

### Stdio

Al añadir un servicio MCP que utilice el protocolo de transporte stdio, debe indicar el `comando` y los `argumentos del comando` para ejecutar el servicio MCP. Si fuera necesario, también puede añadir las `variables de entorno` que requiera el comando para ejecutar el servicio MCP.

:::warning
Los comandos para ejecutar el servicio MCP, como node, npx, uvx, go, etc., requieren que el entorno del servidor donde está desplegado NocoBase los soporte para poder utilizarse.

La imagen Docker de NocoBase solo admite comandos del entorno Node.js, como node y npx.
:::

![20260323103511](https://static-docs.nocobase.com/20260323103511.png)

### HTTP

Al añadir un servicio MCP que utilice el protocolo de transporte http, debe introducir la `URL` del servicio MCP y, si lo requiere, los `encabezados de la solicitud`.

El protocolo de transporte http admite dos modos: Streamable y SSE. Streamable es el nuevo modo de transporte añadido al estándar MCP; SSE está a punto de ser descontinuado. Seleccione el modo concreto siguiendo la documentación del servicio MCP que utilice.

![20260323103906](https://static-docs.nocobase.com/20260323103906.png)

### Prueba de disponibilidad

Al añadir o editar un servicio MCP, una vez introducida la información de configuración puede iniciar una prueba de disponibilidad sobre el servicio MCP. Si la configuración es completa y correcta y el servicio MCP está disponible, se mostrará un mensaje indicando que la prueba de disponibilidad del servicio MCP se ha realizado con éxito.

![20260323105608](https://static-docs.nocobase.com/20260323105608.png)

## Consultar un servicio MCP

Haga clic en el botón `View` de la lista de servicios MCP para consultar la lista de herramientas que ofrece el servicio MCP.

En la lista de herramientas del servicio MCP también puede configurar los permisos con los que el AI Employee utilizará cada herramienta. Cuando el permiso de la herramienta está establecido en `Ask`, antes de invocarla se preguntará si se permite la llamada; cuando está establecido en `Allow`, la herramienta se invocará directamente cuando sea necesario.

![20260323111106](https://static-docs.nocobase.com/20260323111106.png)

## Uso del servicio MCP

Una vez habilitados los servicios MCP que desee utilizar en el módulo de configuración de MCP, durante la conversación con un AI Employee este utilizará automáticamente las herramientas proporcionadas por los servicios MCP para completar las tareas.

![20260323110535](https://static-docs.nocobase.com/20260323110535.png)
