---
pkg: '@nocobase/plugin-feishu'
title: "Sincronizar datos de usuario desde Feishu"
description: "Sincronice usuarios y departamentos de Feishu con NocoBase y reciba cambios incrementales mediante callback HTTP o modo Stream."
keywords: "Feishu,Lark,sincronización de usuarios,sincronización de departamentos,modo Stream,callback de eventos,NocoBase"
---

# Sincronizar datos de usuario desde Feishu

<PluginInfo commercial="true" name="feishu"></PluginInfo>

## Introducción

El plugin **Feishu / Lark** sincroniza usuarios y departamentos de una organización Feishu con NocoBase. Admite sincronización completa bajo demanda y actualizaciones incrementales mediante callback HTTP o conexión Stream.

## Antes de empezar

1. Instale y active los plugins **Feishu / Lark** y **Sincronización de datos de usuario**.
2. Cree una aplicación propia en la plataforma abierta de Feishu, ver [Autenticación: Feishu / Lark](/auth-verification/auth-feishu/).
3. Conceda los permisos de contactos y configure el ámbito de visibilidad como se describe a continuación.

## Permisos de contactos y ámbito de visibilidad

En **Gestión de permisos** de la aplicación, active:

| Permiso | Scope | Obligatorio | Propósito |
| --- | --- | --- | --- |
| Obtener información básica del usuario | `contact:user.base:readonly` | Sí | Lee nombres, `open_id` / `union_id` y otros campos básicos. |
| Obtener información básica del departamento | `contact:department.base:readonly` | Sí | Lee nombres y jerarquía de departamentos. |
| Obtener estructura organizativa de departamentos | `contact:department.organize:readonly` | Sí | Recorre subdepartamentos; lee responsables. |
| Obtener estructura organizativa del usuario | `contact:user.department:readonly` | Sí | Lee departamentos y departamento principal del usuario. |
| Obtener user ID del usuario | `contact:user.id:readonly` | Si el identificador es `user_id` | Lee el campo `user_id`. |
| Obtener número de teléfono del usuario | `contact:user.phone:readonly` | Para sincronizar teléfonos | Lee teléfonos; obligatorio si el identificador es `mobile`. |
| Obtener correo del usuario | `contact:user.email:readonly` | Para sincronizar correos | Lee correos; obligatorio si el identificador es `email`. |

A continuación configure el **ámbito de permisos de contactos** (qué departamentos y miembros puede ver la aplicación):

1. En **Configuración de desarrollo → Permisos**, pulse **Configurar** en la columna «Ámbito de datos accesible» (al activar un permiso de contactos se salta aquí automáticamente).
2. Seleccione departamentos y miembros; para la configuración inicial se recomienda **Todos los miembros** y luego restringir si procede.
3. Pulse **Aceptar** para guardar.

:::warning
Sin **Obtener información básica del usuario**, la API no devuelve nombres y los apodos sincronizados quedan vacíos. El ámbito de permisos de contactos y el «ámbito de disponibilidad de la aplicación» (quién puede usarla) son dos ajustes independientes; solo el primero afecta a la sincronización. Los permisos de API determinan los campos legibles y el ámbito determina los departamentos y usuarios legibles; deben configurarse ambos. Tras cualquier cambio, vuelva a ejecutar una sincronización completa. La suscripción de eventos no sustituye a los permisos de lectura: en cada evento NocoBase consulta a la API de Feishu los datos más recientes.
:::

## Añadir un origen de sincronización Feishu

Entre en **Usuarios y permisos** → **Sincronización** y añada un origen de tipo **Feishu / Lark**:

| Campo | Descripción |
| --- | --- |
| Nombre del origen | Nombre único del origen. |
| Activado | Inicia la recepción de eventos y permite ejecutar tareas de sincronización. |
| Región | `Feishu China` o `Lark Global`. |
| App ID / App Secret | Credenciales de la aplicación. Se admiten variables de entorno y secretos. |
| Campo de identificador único | `user_id`, `union_id`, `open_id`, `mobile` o `email`; se recomienda `union_id`. Debe coincidir con el autenticador; los usuarios sin valor se omiten. |
| Modo de recepción de eventos | **Callback HTTP** o **modo Stream**, ver más abajo. |

Guarde y active el origen, luego pulse **Sincronizar** para la primera sincronización completa.

## Elegir el modo de recepción de eventos

### Modo Stream

El modo Stream mantiene una conexión WebSocket persistente iniciada por el servidor NocoBase. No requiere URL pública, token ni clave de cifrado.

1. Seleccione **modo Stream** en NocoBase, guarde y active el origen.
2. En la plataforma, en **Eventos y callbacks**, cambie la recepción a **conexión larga (WebSocket)** y suscríbase a los eventos de contactos.

La conexión se inicia automáticamente al activar el origen (con reconexión automática) y se renueva o cierra al actualizar, desactivar o eliminar el origen.

:::info
El modo Stream no necesita dirección pública entrante ni proxy inverso; adecuado para despliegues de intranet. El estado de la conexión puede comprobarse en los registros buscando `Feishu stream client`.
:::

### Callback HTTP

1. Seleccione **callback HTTP** en NocoBase y configure el **Verification Token** y, opcionalmente, el **Encrypt Key**; se requiere al menos uno.
2. Guarde el origen y copie la **URL de callback de eventos** mostrada.
3. En la plataforma, en **Eventos y callbacks** → **Configuración de eventos**, elija el envío al servidor, pegue la URL y suscríbase a los eventos de contactos.

La URL debe ser accesible desde Feishu (HTTPS en producción). Con Encrypt Key el contenido viaja cifrado.

:::warning
Sin Verification Token o Encrypt Key, las peticiones se rechazan (401). Al cambiar un origen al modo Stream, el endpoint HTTP se cierra (403).
:::

## Eventos incrementales admitidos

| Evento | Tratamiento en NocoBase |
| --- | --- |
| `contact.user.created_v3` | Crear o actualizar el usuario. |
| `contact.user.updated_v3` | Actualizar el usuario. |
| `contact.user.deleted_v3` | Eliminar el usuario sincronizado. |
| `contact.department.created_v3` | Crear o actualizar el departamento. |
| `contact.department.updated_v3` | Actualizar el departamento. |
| `contact.department.deleted_v3` | Eliminar el departamento sincronizado. |

Los usuarios con rol Root nunca se eliminan por sincronización.

## Campos sincronizados

### Campos de departamento

| Campo Feishu | Campo / propósito en NocoBase |
| --- | --- |
| `open_department_id` | Identificador de origen del departamento. |
| `name` | Nombre del departamento. |
| `parent_department_id` | Departamento padre para la jerarquía. Los departamentos con padre fuera del ámbito se sincronizan como raíz. |

### Campos de usuario

| Campo Feishu | Campo / propósito en NocoBase |
| --- | --- |
| Valor del campo identificador | Identificador de origen y nombre de usuario a partir del **campo de identificador único**. |
| `name`, si falta `en_name` | Apodo; vacío si faltan ambos. |
| `mobile` | Teléfono. |
| `email` | Correo. |
| `department_ids` | Departamentos del usuario; solo dentro del ámbito. |
| `main_department_id` | Departamento principal. |

### Responsables de departamento

Los responsables (líderes) se sincronizan como propietarios del departamento en NocoBase: un usuario puede ser responsable de varios departamentos y el departamento responsable no tiene por qué ser el principal. Solo participan los departamentos dentro del ámbito. Los responsables retirados en Feishu se retiran en la siguiente sincronización; los cambios manuales pueden sobrescribirse.

Otros campos como avatar, cargo o número de empleado no se sincronizan actualmente.

## Resolución de problemas

- Resultados vacíos o departamentos ausentes: revise permisos de contactos y ámbito de visibilidad.
- Apodos vacíos: active **Obtener información básica del usuario** (`contact:user.base:readonly`) y vuelva a sincronizar.
- Usuarios omitidos: compruebe que tengan valor del campo identificador y que coincida con el autenticador.
- Callback HTTP 401: falta o falla Verification Token / Encrypt Key; 403: el origen pasó a modo Stream.
- Errores de `redirect_uri` o URL de callback: la URL de la plataforma debe coincidir exactamente con la mostrada en NocoBase (incluido el prefijo `APP_PUBLIC_PATH`).
- Tarea fallida por límite de frecuencia de la API: espere a que se levante el límite y ejecute manualmente de nuevo.
