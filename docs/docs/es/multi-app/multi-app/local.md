---
pkg: '@nocobase/plugin-app-supervisor'
---

# Modo de memoria compartida

## Introducción

Cuando quieres separar dominios de negocio por aplicación sin introducir una arquitectura compleja, puedes usar el modo multiaplicación en memoria compartida.

En este modo, varias aplicaciones se ejecutan en una única instancia de NocoBase. Cada aplicación es independiente (BD, creación, arranque y parada), pero comparte proceso y memoria con las demás.

## Guía de uso

### Variables de entorno

Antes de usar multiaplicación, confirma estas variables al iniciar NocoBase:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Crear una aplicación

En **System Settings**, entra en **App supervisor** para abrir la gestión de aplicaciones.

![](https://static-docs.nocobase.com/202512291056215.png)

Haz clic en **Add** para crear una nueva aplicación.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Opciones de configuración

| Opción | Descripción |
| --- | --- |
| **Nombre visible** | Nombre mostrado en la interfaz |
| **ID de aplicación** | Identificador global único |
| **Modo de arranque** | - Arrancar en la primera visita: se inicia al primer acceso por URL<br>- Arrancar con la aplicación principal: se inicia junto a la principal (aumenta su tiempo de arranque) |
| **Entorno** | En memoria compartida solo está disponible `local` |
| **Base de datos** | Configura la fuente principal:<br>- Nueva base de datos: reutiliza el servicio DB actual y crea una BD dedicada<br>- Nueva conexión: conecta con otro servicio DB<br>- Nuevo schema: en PostgreSQL crea un schema dedicado |
| **Actualización** | Si se permite actualizar automáticamente datos NocoBase de versiones anteriores |
| **JWT Secret** | Genera un JWT independiente para aislar sesiones |
| **Dominio personalizado** | Define un dominio dedicado para la aplicación |

### Iniciar una aplicación

Haz clic en **Start** para iniciarla.

> Si se marcó _Start on first visit_ al crearla, arrancará automáticamente en el primer acceso.

![](https://static-docs.nocobase.com/202512291121065.png)

### Acceder a una aplicación

Haz clic en **Visit** para abrirla en una pestaña nueva.

Por defecto se accede por `/apps/:appName/admin/`, por ejemplo:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

También puedes configurar dominio independiente. Debe resolver a la IP actual; si usas Nginx, añade también el dominio en su configuración.

### Detener una aplicación

Haz clic en **Stop** para detenerla.

![](https://static-docs.nocobase.com/202512291122113.png)

### Estado de aplicaciones

En la lista se muestra el estado actual de cada aplicación.

![](https://static-docs.nocobase.com/202512291122339.png)

### Eliminar una aplicación

Haz clic en **Delete** para eliminarla.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

### 1. Gestión de plugins

Las aplicaciones pueden usar los mismos plugins (y versiones) que la principal, pero su configuración y uso son independientes por aplicación.

### 2. Aislamiento de base de datos

Cada aplicación puede usar una base independiente. Para compartir datos entre aplicaciones, usa fuentes de datos externas.

### 3. Respaldo y migración

Actualmente, los respaldos de la aplicación principal no incluyen datos de otras aplicaciones (solo metadatos básicos). Deben respaldarse y migrarse por separado dentro de cada aplicación.

### 4. Despliegue y actualización

En memoria compartida, las versiones de otras aplicaciones siguen automáticamente la versión de la aplicación principal.

### 5. Sesiones de aplicación

- Con JWT independiente, la sesión queda aislada de la principal y de otras aplicaciones. Si accedes por subrutas del mismo dominio, al cambiar de app puede requerirse relogin (token en LocalStorage). Se recomienda un dominio separado por aplicación.
- Sin JWT independiente, comparte sesión con la principal y el cambio es más cómodo, pero hay riesgo de seguridad: IDs de usuario superpuestos entre aplicaciones pueden causar acceso no autorizado.
