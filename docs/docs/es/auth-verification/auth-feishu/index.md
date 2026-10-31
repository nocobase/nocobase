---
pkg: '@nocobase/plugin-feishu'
---

# Autenticación: Feishu / Lark

## Introducción

El plugin **Feishu / Lark** permite a los usuarios iniciar sesión en NocoBase con su cuenta de Feishu o Lark, con inicio de sesión automático opcional.

## Activar el plugin

Feishu / Lark es un plugin comercial. Instálelo y actívelo en el gestor de plugins junto con el plugin **Autenticación de usuarios**.

## Crear una aplicación en la plataforma abierta

Entre en la [plataforma abierta de Feishu](https://open.feishu.cn/) y cree una **aplicación propia de la empresa** (para Lark use la [plataforma abierta de Lark](https://open.larksuite.com/)). Anote el **App ID** y el **App Secret**.

El inicio de sesión no requiere permisos de API adicionales. Para la sincronización de contactos, consulte [Sincronizar datos de usuario desde Feishu](/users-permissions/sync/sources/feishu).

## Configurar la URL de redirección

En **Configuración de seguridad** → **URL de redirección** de la aplicación, añada la URL de callback mostrada por NocoBase:

```
https://su-dominio/api/feishu:redirect
```

Lo más sencillo es copiar la **URL de redirección** que se muestra en la página de configuración del autenticador de NocoBase.

:::warning
Si NocoBase se despliega en una subruta (p. ej. `APP_PUBLIC_PATH=/nocobase/`), la URL de callback lleva el prefijo, p. ej. `https://su-dominio/nocobase/api/feishu:redirect`. La URL de la lista blanca de la plataforma debe coincidir exactamente con la URL real.
:::

## Añadir autenticación Feishu en NocoBase

Entre en **Autenticación de usuarios** y añada un autenticador **Feishu / Lark**:

| Campo | Descripción |
| --- | --- |
| Registro automático | Crea una cuenta en el primer inicio de sesión. Activado por defecto. |
| Región | `Feishu China` o `Lark Global`. |
| App ID / App Secret | Credenciales de la aplicación Feishu. Se admiten variables de entorno y secretos. |
| Origin | Dirección pública del sitio, p. ej. `https://example.com`. Solo protocolo y dominio, sin ruta (la barra final es opcional); si está vacío se usa la dirección de la petición actual. |
| Campo de identificador único | La clave de identidad del usuario, ver más abajo. |
| Inicio de sesión automático | Inicio silencioso al abrir la app dentro de Feishu, ver más abajo. |

## Elegir el campo de identificador único

| Campo | Descripción |
| --- | --- |
| `union_id` | Recomendado. Estable y compartido por todas las apps de la misma cuenta de desarrollador. |
| `open_id` | Único por aplicación; cambia al cambiar de aplicación. |
| `user_id` | Único dentro del tenant; puede colisionar en escenarios multi-tenant. |
| `mobile` / `email` | Modificables y pueden estar vacíos; no aptos como identificador. |

Mantenga esta elección estable una vez que haya usuarios registrados. Si usa la sincronización de datos, seleccione el mismo campo en el origen de sincronización.

## Inicio de sesión y registro automático

El usuario pulsa el botón **Feishu / Lark** en la página de inicio de sesión para completar OAuth. Con el registro automático activado:

- Los usuarios se buscan o crean por el **campo de identificador único**;
- Teléfono, correo y apodo solo se rellenan si el perfil está vacío; los valores existentes nunca se sobrescriben.

## Inicio de sesión automático

Con **Inicio de sesión automático**, abrir la app dentro del cliente Feishu inicia OAuth sin pulsar el botón. Solo un autenticador Feishu puede tenerlo activado a la vez.

Requisitos:

- La URL de callback está en la lista blanca de **URL de redirección**;
- La aplicación está publicada y el usuario dentro del ámbito de disponibilidad;
- La app se abre dentro del cliente Feishu.

El primer uso muestra una página de consentimiento única; después el acceso es silencioso. Abrir en el navegador del sistema no activa el inicio automático — es el comportamiento esperado.

## Acceso desde el espacio de trabajo de Feishu (opcional)

Configure la página de inicio de escritorio/móvil en **Funciones de la aplicación** → **Aplicación web** para que los usuarios abran NocoBase directamente desde el espacio de trabajo. La URL debe coincidir con la dirección real de NocoBase (incluido el prefijo de subruta).
