---
pkg: '@nocobase/plugin-ai'
title: 'Bloque AI Chat box'
description: 'Guía para administradores y creadores de páginas de NocoBase sobre cómo añadir un bloque AI Chat box, configurar las capacidades de conversación, definir Work context, gestionar conversaciones y añadir Actions.'
keywords: 'AI Chat box,Empleado de IA,bloque de página,Work context,Scope,Actions,NocoBase'
---

# Bloque AI Chat box

En NocoBase, **AI Chat box** es un bloque de conversación con IA que puede añadirse directamente a una página. Puedes colocarlo en una página de negocio para ofrecer un punto de acceso fijo a un asistente de IA específico para esa página.

Cada bloque AI Chat box mantiene de forma independiente la conversación actual y el estado de entrada. Los creadores de páginas también pueden limitar los empleados de IA, modelos, carga de archivos, búsqueda web y contexto de trabajo disponibles según el escenario de negocio.

:::tip Antes de empezar

Primero [configura un servicio LLM](../features/llm-service.md) y [habilita al menos un empleado de IA](../features/enable-ai-employee.md).

:::

## Añadir un bloque AI Chat box

1. Abre la página que deseas configurar.
2. Haz clic en `UI Editor` en la esquina superior derecha para entrar en el modo de edición de la página.
3. Haz clic en `Add block`.
4. En `Other blocks`, selecciona `AI chat box`.

![Seleccionar AI chat box en el menú Add block](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/add-ai-chat-box-block-3.png)

## Estructura del bloque

![Bloque AI Chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/ai-chat-box-overview-2.png)

AI Chat box se divide en tres áreas de arriba abajo:

- **Área de acciones superior** — acceso a la lista de conversaciones, Actions, acciones personalizadas y nueva conversación; cuando se ocultan los mensajes también aparece el botón de mensajes
- **Área de mensajes** — muestra los mensajes del borrador o la conversación actual
- **Área de envío** — cuadro de entrada, selección de contexto, carga de archivos, búsqueda web, selección de empleado de IA, selección de modelo, botón de envío y aviso legal

### Añadir contenido dentro del body del bloque

En el modo de edición de la página, haz clic en `Add block` dentro de AI Chat box para añadir cualquiera de estos bloques encima del área de chat:

- JS block
- Iframe
- Markdown

Estos bloques sirven para mostrar instrucciones, páginas externas o información complementaria. El menú interno solo ofrece estos tres tipos de bloque y no permite anidar otro AI Chat box.

## Configurar AI Chat box

Coloca el puntero sobre el bloque y abre su menú de configuración. Haz clic en `Edit chat box` para configurar el alcance de las conversaciones, el mensaje predeterminado, Work context, los empleados de IA y los modelos.

![Cuadro de diálogo Edit chat box](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/edit-chat-box-settings-2.png)

### Configuración de Edit chat box

| Opción | Descripción |
| --- | --- |
| `Scope` | Controla qué AI Chat box comparten una lista de conversaciones. Los bloques nuevos utilizan su propio UID de bloque de forma predeterminada para mantener las conversaciones separadas. |
| `Background` | Añade un prompt del sistema después de la definición del empleado de IA para indicar la función, el objetivo o los requisitos de respuesta de la página actual. |
| `Default user message` | Rellena previamente el cuadro de envío con un mensaje de usuario predeterminado al iniciar una conversación nueva. |
| `Work context` | Selecciona los bloques de página que se añadirán de forma predeterminada a un borrador nuevo. |
| `AI employees` | Limita los empleados de IA de negocio que pueden seleccionarse en este bloque. Déjalo vacío para permitir todos los empleados de IA de negocio disponibles. |
| `Models` | Limita los modelos que pueden seleccionarse en este bloque. Déjalo vacío para permitir todos los modelos disponibles. |

### Otros ajustes del bloque

| Opción | Descripción |
| --- | --- |
| `Show messages` | Controla si el área de mensajes se muestra directamente en el bloque. Al desactivarlo, utiliza el botón de mensajes de la parte superior para abrir el panel derecho. |
| `Sender placeholder` | Cambia el texto de marcador de posición del cuadro de envío. |
| `Enable add context` | Muestra u oculta la entrada de selección de contexto del cuadro de envío. |
| `Enable upload files` | Muestra u oculta la entrada de carga de archivos. Al desactivarlo, pegar un archivo tampoco inicia la carga. |
| `Enable web search` | Muestra u oculta el interruptor de búsqueda web. Al desactivarlo también se apaga la búsqueda web del borrador actual. |
| `Enable employee select` | Muestra u oculta el selector de empleados de IA. |
| `Enable model select` | Muestra u oculta el selector de modelos. |
| `Show disclaimer` | Muestra u oculta el aviso de IA debajo del cuadro de envío. |

## Configurar Work context

En `Work context`, dentro de `Edit chat box`, haz clic en el botón para añadir contexto, selecciona `Pick block` y elige el bloque de página que deseas proporcionar a la IA. Después de guardar, el bloque seleccionado se utilizará como contexto de trabajo predeterminado para las conversaciones nuevas y podrás quitarlo desde el área de envío antes de enviar el mensaje.

## Ocultar los mensajes y utilizar el panel derecho

Al desactivar `Show messages`, el cuerpo del bloque solo conserva el área de envío. Aparecerá un botón de mensajes en la parte superior; haz clic en él para abrir el panel de mensajes desde la derecha.

![Panel derecho con el área de mensajes oculta](https://static-docs.nocobase.com/ai-employees/block/ai-chat-box/2026-07-22/messages-side-panel-2.png)

Cuando el panel está abierto, el resto del bloque queda cubierto por una capa. Haz clic en la capa o vuelve a hacer clic en el botón de mensajes para cerrar el panel.

Este diseño funciona bien cuando AI Chat box se utiliza como una entrada ligera en una página: normalmente solo se muestra el cuadro de envío y se abre el panel cuando es necesario consultar los mensajes.

## Gestionar el historial de conversaciones

Haz clic en el botón de lista de conversaciones de la esquina superior izquierda del bloque para consultar el historial correspondiente al Scope actual.

Ten en cuenta estas reglas:

- Varios AI Chat box con el mismo Scope pueden ver la misma lista de conversaciones
- Cada bloque mantiene de forma independiente la conversación actual, el borrador del cuadro de envío, el empleado de IA, el modelo, los archivos adjuntos y el estado del contexto
- El chatbox flotante global no filtra por el Scope del bloque, por lo que no oculta las conversaciones que tienen Scope
- Al borrar Scope, el bloque deja de filtrar la lista por Scope y muestra tanto las conversaciones sin Scope como las que utilizan otros Scopes

Normalmente, basta con conservar el Scope generado para un bloque nuevo para separar el historial de cada asistente de página. Configura el mismo Scope solo cuando varios bloques necesiten compartir la misma lista de conversaciones.

## Añadir Actions

En el modo de edición de la página, haz clic en `Actions` en la parte superior del bloque para añadir una de estas acciones:

- JS Action
- AI employee

Después de añadir un AI employee, puedes configurar tareas rápidas para ese empleado.

El ajuste `Chat box uid` de una tarea rápida especifica en qué AI Chat box se ejecutará la tarea. Un AI employee añadido directamente dentro de un AI Chat box apunta de forma predeterminada al UID del bloque actual.

Si el AI Chat box especificado no está montado, NocoBase indica que no puede encontrar el bloque de destino y no utiliza el chatbox flotante global como alternativa. Consulta [Tareas rápidas de empleados de IA](../features/task.md) para ver la configuración detallada.

## Configurar un asistente específico para una página

Los siguientes pasos permiten crear un asistente de IA ligero para una página:

1. Añade un bloque AI Chat box y muévelo a la posición adecuada de la página.
2. Introduce un Background específico para la página en `Edit chat box`.
3. Selecciona uno o varios Work contexts.
4. Limita los empleados y modelos disponibles en `AI employees` y `Models`.
5. Sal del modo de edición, escribe una pregunta y envíala.

## Notas

- El bloque AI Chat box y el chatbox flotante global de la esquina inferior derecha son puntos de acceso independientes; la conversación actual y el estado de entrada no se sincronizan automáticamente
- Dentro de un AI Chat box, `Add block` solo permite añadir JS block, Iframe y Markdown
- Cambiar Scope afecta al alcance de consulta de la lista de conversaciones y no copia la conversación o el borrador abierto actualmente en otro bloque
