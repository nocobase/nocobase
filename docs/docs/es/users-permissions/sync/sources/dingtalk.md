---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "Sincronizar datos de usuario desde DingTalk"
description: "Sincronice usuarios y departamentos de DingTalk con NocoBase y reciba cambios incrementales mediante callback HTTP o modo Stream."
keywords: "DingTalk,sincronización de usuarios,sincronización de departamentos,modo Stream,suscripción de eventos,NocoBase"
---

# Sincronizar datos de usuario desde DingTalk

<PluginInfo commercial="true" name="auth-dingtalk"></PluginInfo>

## Introducción

El plugin **DingTalk** sincroniza los usuarios y departamentos de una organización de DingTalk con NocoBase. Admite sincronización completa manual y actualizaciones incrementales mediante callback HTTP o conexión Stream.

## Antes de comenzar

1. Instale y active los plugins **DingTalk** y **Sincronización de datos de usuario**.
2. Cree una aplicación interna en la consola de desarrolladores de DingTalk.
3. Conceda los permisos de contactos y configure el ámbito de permisos de datos descritos a continuación.
4. Copie el Client ID y el Client Secret. Consulte [Autenticación: DingTalk](/auth-verification/auth-dingtalk/).

## Configurar permisos de contactos y ámbito de datos

Abra **Gestión de permisos** de la aplicación en DingTalk y conceda los siguientes permisos:

| Permiso | Identificador | Obligatorio | Uso |
| --- | --- | --- | --- |
| Leer información de departamentos | `qyapi_get_department_list` | Sí | Leer la lista, los nombres y la jerarquía de departamentos. |
| Leer miembros del departamento | `qyapi_get_department_member` | Sí | Leer los miembros de cada departamento. |
| Leer información de miembros | `qyapi_get_member` | Sí | Leer los detalles y departamentos de los usuarios. |
| Información del móvil del empleado | `fieldMobile` | Al usar el móvil | Sincronizar teléfonos; obligatorio cuando el identificador único es `mobile`. |
| Correo y otros datos personales | `fieldEmail` | No | Necesario para sincronizar direcciones de correo. |

Configure también el **Ámbito de permisos de datos** para incluir los departamentos y empleados que se pueden sincronizar. Seleccione todos los empleados para sincronizar toda la organización.

:::warning
Los permisos de API determinan qué campos se pueden leer; el ámbito de datos determina qué departamentos y empleados se pueden leer. Se deben configurar ambos. Las suscripciones de eventos no sustituyen los permisos de lectura.
:::

Si la misma aplicación también se utiliza para iniciar sesión, conceda además los permisos personales descritos en [Autenticación: DingTalk](/auth-verification/auth-dingtalk/).

## Añadir una fuente de sincronización DingTalk

Vaya a **Usuarios y permisos > Sincronizar**, haga clic en **Añadir** y seleccione **DingTalk**.

| Campo | Descripción |
| --- | --- |
| Nombre de la fuente | Nombre único de la fuente de sincronización. |
| Activada | Inicia la recepción de eventos y permite ejecutar tareas de sincronización. |
| Client ID | Client ID de la aplicación; admite variables de entorno y secretos. |
| Client Secret | Client Secret de la aplicación; admite variables de entorno y secretos. |
| Identificador único del usuario | `mobile` o `unionId`. No cambie la selección después de la primera sincronización. Se omiten usuarios sin el valor elegido. |
| Modo de recepción de eventos | **Callback HTTP** o **modo Stream** para cambios incrementales. |

Guarde y active la fuente; después pulse **Sincronizar** para realizar primero una sincronización completa.

## Elegir el modo de recepción de eventos

### Modo Stream

El modo Stream establece una conexión persistente saliente desde el servidor NocoBase hacia DingTalk. No requiere URL pública de callback, Token ni EncodingAESKey.

1. Seleccione **modo Stream** en la configuración de suscripción de eventos de DingTalk.
2. Suscríbase a los eventos necesarios de usuarios y departamentos.
3. Seleccione **modo Stream** en NocoBase, guarde la fuente y actívela.

El cliente Stream se inicia al activar la fuente. Al actualizarla, desactivarla o eliminarla, la conexión se actualiza o se cierra.

:::info
El servidor NocoBase debe poder conectarse a DingTalk. El modo Stream no necesita proxy inverso ni endpoint público de entrada.
:::

### Callback HTTP

1. Seleccione **Callback HTTP** en NocoBase.
2. Introduzca el Token y EncodingAESKey configurados en DingTalk.
3. Guarde la fuente y copie la **URL de callback de eventos** generada.
4. Configure la URL en DingTalk y suscríbase a los eventos de usuarios y departamentos.

La URL debe ser accesible desde DingTalk. En producción use HTTPS y asegúrese de que el proxy inverso conserve la ruta completa.

## Eventos incrementales compatibles

| Evento | Acción en NocoBase |
| --- | --- |
| `user_add_org` | Crear o actualizar el usuario. |
| `user_modify_org` | Actualizar el usuario. |
| `user_leave_org` | Eliminar el usuario sincronizado. |
| `org_dept_create` | Crear o actualizar el departamento. |
| `org_dept_modify` | Actualizar el departamento y sincronizar sus usuarios. |
| `org_dept_remove` | Eliminar el departamento sincronizado. |

## Campos sincronizados

### Campos de departamento

| Campo de DingTalk | Campo o uso en NocoBase |
| --- | --- |
| `dept_id` | Identificador único del departamento en la fuente. |
| `name` | Nombre del departamento. |
| `parent_id` | Departamento superior. Si está fuera del ámbito de datos, el departamento se sincroniza como raíz. |

### Campos de usuario

| Campo de DingTalk | Campo o uso en NocoBase |
| --- | --- |
| `mobile` o `unionid` | Identificador único de origen y nombre de usuario según la configuración. |
| `name` | Apodo del usuario. |
| `mobile` | Teléfono. Requiere `fieldMobile`. |
| `email`, con alternativa `org_email` | Correo electrónico. Requiere `fieldEmail`. |
| `dept_id_list` | Departamentos del usuario incluidos en el ámbito de datos. |
| `dept_order_list` | Departamento principal. |
| `leader_in_dept` | Indica si el usuario es responsable del departamento correspondiente. |

### Responsables de departamento

NocoBase sincroniza `leader_in_dept` por separado para cada departamento. Un usuario puede ser responsable de varios departamentos y estos no tienen que coincidir con su departamento principal. Al quitar la marca en DingTalk, la siguiente sincronización también la elimina en NocoBase. Los cambios manuales pueden sobrescribirse.

La sincronización completa e incremental usan el mismo mapeo. Actualmente no se sincronizan avatar, cargo ni número de empleado.

## Solución de problemas

- Si faltan datos, compruebe los tres permisos obligatorios y el ámbito de datos.
- Si faltan teléfono o correo, compruebe `fieldMobile` y `fieldEmail`.
- Se omiten los usuarios sin el identificador único configurado.
- Para Stream, revise los logs `Dingtalk stream client starting`, `Dingtalk stream client started` y los errores de conexión.
- Para callback HTTP, compruebe la accesibilidad pública, el Token y EncodingAESKey.
- Ejecute otra sincronización completa después de cambiar permisos o el ámbito de datos.
