---
pkg: '@nocobase/plugin-feishu'
---

# Notificación: Feishu / Lark

## Introducción

El plugin **Feishu / Lark** permite enviar mensajes de notificación a usuarios de Feishu.

## Añadir y configurar un autenticador Feishu

Primero añada y configure un autenticador Feishu en NocoBase, ver [Autenticación: Feishu / Lark](/auth-verification/auth-feishu/). Solo los usuarios que hayan iniciado sesión vía Feishu pueden recibir notificaciones por Feishu.

Los mensajes se envían mediante la aplicación Feishu del autenticador elegido, que además requiere:

1. La capacidad **Bot** añadida en **Funciones de la aplicación** de la plataforma abierta; sin ella el envío falla;
2. El permiso **Enviar mensajes como bot** (`im:message:send_as_bot`) activado en **Gestión de permisos** y una nueva versión publicada;
3. Usuarios receptores dentro del **ámbito de permisos de contactos** (disponibilidad) de la aplicación.

Tras cambiar capacidades o permisos, publique una nueva versión y reintente.

## Añadir un canal de notificación Feishu

Entre en **Gestión de notificaciones** → canales, añada un canal **Feishu / Lark** y seleccione el autenticador configurado.

Opcionalmente configure el **Tipo de ID del receptor** (`open_id`, `user_id`, `union_id` o `email`); por defecto sigue el campo identificador del autenticador.

## Tipos de mensaje

| Tipo | Descripción |
| --- | --- |
| Mensaje de texto | Texto sin formato. |
| Mensaje Post | Texto enriquecido en formato Post de Feishu. |
| Tarjeta interactiva | Tarjeta Feishu configurada como JSON. |

Los receptores se resuelven por la identidad Feishu vinculada al autenticador (según el tipo de ID); los no vinculados pasan a correo o nombre de usuario.

## Nodo de notificación en el flujo de trabajo

Seleccione el canal Feishu configurado en el nodo de notificación del flujo de trabajo para enviar mensajes a los usuarios del contexto.

## Resolución de problemas

- Fallo de envío con error de permisos (p. ej. código `230002`): compruebe la capacidad **Bot**, el permiso **Enviar mensajes como bot** y la publicación de la última versión.
- Fallo con receptor no válido (errores `receive_id`): el usuario está fuera del ámbito de contactos o el tipo de ID no coincide con la configuración del canal.
- La tarea solo muestra un error genérico: busque `FeishuNotificationChannel.send failed` en los registros del servidor; las versiones nuevas del plugin registran también el código y mensaje de error de Feishu.
