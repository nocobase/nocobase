# Capítulo 5: Usuarios y permisos — quién puede ver qué

En el capítulo anterior terminamos los formularios y la página de detalles, y el sistema de tickets ya permite registrar y consultar datos con normalidad. Pero hay un problema: tras iniciar sesión, todos ven lo mismo. El empleado normal que envía tickets puede ver la página de gestión, los técnicos pueden eliminar categorías... así no puede ser.

En este capítulo vamos a poner "control de acceso" al sistema: crear [roles](/users-permissions/acl/role), configurar [permisos de menú](/users-permissions/acl/permissions) y [rangos de datos](/users-permissions/acl/permissions), de forma que **personas distintas vean menús distintos y operen sobre datos distintos**.

## 5.1 Entender el [Role](/users-permissions/acl/role)

En NocoBase, **un rol es un conjunto de [permisos](/users-permissions/acl/role)**. No tiene que configurar permisos a cada usuario individualmente; defina primero unos cuantos roles y meta a los usuarios en el rol correspondiente.

NocoBase incluye tres roles tras la instalación:

- **Root**: superadministrador con todos los permisos, no se puede eliminar
- **Admin**: administrador, con permiso para configurar la interfaz por defecto
- **Member**: miembro normal con menos permisos por defecto

Pero estos tres roles integrados no son suficientes. Nuestro sistema de tickets necesita una división más detallada, así que vamos a crear 3 roles personalizados.

## 5.2 Crear tres roles

Abra el menú de configuración de la esquina superior derecha y vaya a **Usuarios y permisos → Gestión de roles**.

Haga clic en **Añadir rol** y cree:

| Nombre del rol | Identificador | Descripción |
|----------------|---------------|-------------|
| Administrador | admin-helpdesk | Puede ver todos los tickets, gestionar categorías y asignar responsables |
| Técnico | technician | Solo ve los tickets asignados a sí mismo, puede procesarlos y cerrarlos |
| Usuario normal | user | Solo puede enviar tickets y ver los que ha enviado |

![05-roles-and-permissions-2026-03-13-19-03-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-03-14.png)

> El **identificador del rol** es el ID único interno; una vez creado no se puede cambiar y se recomienda usar minúsculas en inglés. El nombre del rol se puede modificar en cualquier momento.

![05-roles-and-permissions-2026-03-13-18-57-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-18-57-47.png)

Una vez creados, en la lista de roles deberían aparecer los tres roles nuevos.


## 5.3 Configurar permisos de menú

Los roles están creados; ahora le decimos al sistema: cada rol qué menús puede ver.

Haga clic en un rol para entrar en su página de configuración de permisos y busque la pestaña **Permisos de acceso a menús**. Aquí se listan todos los elementos del menú del sistema; marcar significa permitir el acceso, desmarcar significa ocultar.

**Administrador (admin-helpdesk)**: marcar todos
- Gestión de tickets, gestión de categorías, dashboard — puede verlo todo

**Técnico (technician)**: marcar parcialmente
- Gestión de tickets
- Dashboard
- (No marcar) Gestión de categorías (los técnicos no necesitan gestionar categorías)

**Usuario normal (user)**: permisos mínimos
- Gestión de tickets (solo ve sus propios tickets)
- (No marcar) Gestión de categorías
- (No marcar) Dashboard

![05-roles-and-permissions-2026-03-13-19-09-11](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-09-11.png)

> **Sugerencia**: NocoBase tiene una opción útil: «Permitir acceso por defecto a los nuevos elementos de menú». Si no quiere marcar manualmente cada vez que añade una página nueva, puede activar esta opción en el rol de administrador. Para el rol de usuario normal, se recomienda mantenerla desactivada.

## 5.4 Configurar permisos de datos

Los permisos de menú gestionan "si se puede entrar a esta página"; los permisos de datos gestionan "qué datos se ven una vez dentro".

Concepto clave: **[Rango de datos](/users-permissions/acl/permissions) (Data Scope)**.

En la configuración de permisos del rol, cambie a la pestaña **Permisos de operación de [tabla](/data-sources/data-modeling/collection)**. Busque la tabla "Tickets" y entre para configurarla individualmente.

![05-roles-and-permissions-2026-03-13-19-51-06](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-51-06.png)

### Usuario normal: solo ve los tickets que ha enviado

1. Busque el permiso **Ver** de la tabla "Tickets"
2. Rango de datos → seleccione **Datos propios**
3. Así, los usuarios normales solo verán los tickets cuyo "creador es él mismo" (téngase en cuenta que la opción por defecto se basa en el Field creador del sistema, no en el Field "Remitente", aunque puede modificarse)

Igualmente, configure los permisos "Editar" y "Eliminar" como **Datos propios** (o directamente no conceda permiso de eliminación).

![05-roles-and-permissions-2026-03-13-19-53-02](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-53-02.png)


Sobre la configuración global: si solo configura la tabla de tickets, podría provocar que no se vean otras tablas o configuraciones (como la tabla de categorías o los responsables). Como nuestro sistema actual es relativamente sencillo, marcamos directamente "Ver todos los datos" en el global, y para tablas con datos sensibles configuramos los permisos por separado.

![05-roles-and-permissions-2026-03-13-19-57-24](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-19-57-24.png)


### Técnico: solo ve los tickets asignados a sí mismo

1. Busque el permiso **Ver** de la tabla "Tickets"
2. Rango de datos → seleccione **Datos propios**
3. Pero hay un detalle: por defecto, "datos propios" en NocoBase filtra por creador. Si queremos filtrar por "responsable", podemos ajustarlo en los [permisos de operación](/users-permissions/acl/permissions) globales o usar las **condiciones de filtrado de los [Block](/interface-builder/blocks) de datos** en la página frontend.

![05-roles-and-permissions-2026-03-13-20-01-54](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-20-01-54.png)

> **Truco práctico**: también puede establecer condiciones de filtrado por defecto en el bloque de tabla para apoyar el control de permisos, como "Responsable = Usuario actual". No obstante, la configuración de la página tiene efecto global, por lo que el administrador también quedaría limitado. Solución intermedia: configure "Responsable = Usuario actual **o** Remitente = Usuario actual", compatible con usuarios normales y técnicos; si el administrador necesita la vista global, cree una página adicional sin filtros.

![05-roles-and-permissions-2026-03-13-22-21-34](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-21-34.png)

### Administrador: ve todos los datos

Para el rol de administrador, seleccione **Todos los datos** como rango y abra todas las operaciones. Sencillo y directo.

![05-roles-and-permissions-2026-03-13-21-45-14](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-21-45-14.png)

## 5.5 Operación de asignación de tickets

Antes de terminar de configurar permisos, añadamos a la lista de tickets una función práctica: **asignar responsable**. El administrador puede asignar directamente un ticket a un técnico desde la lista, sin entrar en la página de edición a tocar varios Field.

Es muy fácil de implementar — añadiremos un botón de popup personalizado en la columna de acciones de la tabla:

1. Entre en modo UI Editor; en la columna de acciones de la tabla de la lista de tickets, pulse **«+»** y añada un botón de acción **«Popup»**.

![05-roles-and-permissions-2026-03-14-13-57-31](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-57-31.png)

2. Cambie el título del botón a **«Asignar»** (haga clic en la configuración del botón para modificar el título).

![05-roles-and-permissions-2026-03-14-13-59-22](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-13-59-22.png)


Como solo hay una pieza de información de asignación sencilla, conviene un popup pequeño en lugar de un cajón; en la configuración del popup en la esquina superior derecha del botón, seleccione Diálogo > Estrecho > Confirmar.
![05-roles-and-permissions-2026-03-14-14-08-16](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-08-16.png)


3. Haga clic en el botón «Asignar» para abrir el popup; en él pulse **«Crear bloque → bloque de datos → Formulario (Editar)»** y seleccione la tabla actual.
4. En el formulario marque solo el Field **«Responsable»** y, en su configuración, márquelo como **obligatorio**.
5. Añada el botón de acción **«Enviar»**.

![05-roles-and-permissions-2026-03-14-14-10-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-10-50.png)

Así, al pulsar «Asignar» en la lista de tickets, el administrador verá un formulario minimalista, seleccionará al responsable y enviará. Rápido, preciso y sin riesgo de modificar otros Field por error.

### Controlar la visibilidad del botón con reglas de campo

El botón «Asignar» solo lo necesita el administrador; verlo confunde a usuarios normales y técnicos. Podemos usar **reglas de campo** para mostrar/ocultar el botón según el rol del usuario actual:

1. En modo UI Editor, haga clic en la configuración del botón «Asignar» y busque **«Reglas de campo»**.
2. Añada una regla con la condición: **Usuario actual / Rol / Nombre del rol** distinto de **Administrador** (es decir, el nombre correspondiente al rol admin-helpdesk).
3. Acción cuando se cumple la condición: **Ocultar** este botón.

Así, solo los usuarios con rol de administrador verán el botón «Asignar»; en los demás roles, el botón se ocultará automáticamente.

![05-roles-and-permissions-2026-03-14-14-17-37](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-17-37.png)

## 5.6 Crear usuarios de prueba y experimentar

Los permisos están configurados; vamos a verificarlo en la práctica.

Vaya a **Gestión de usuarios** (centro de configuración o la página de gestión de usuarios que haya creado previamente) y cree 3 usuarios de prueba:

| Nombre de usuario | Rol |
|-------------------|-----|
| Alice | Administrador (admin-helpdesk) |
| Bob | Técnico (technician) |
| Charlie | Usuario normal (user) |

![05-roles-and-permissions-2026-03-13-22-23-47](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-23-47.png)

Tras crearlos, inicie sesión con cada uno y verifique dos cosas:

**1. ¿El menú se muestra como esperamos?**
- Alice → ve todos los menús

![05-roles-and-permissions-2026-03-14-14-19-29](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-14-14-19-29.png)

- Bob → solo ve la gestión de tickets y el dashboard

![05-roles-and-permissions-2026-03-13-22-26-50](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-26-50.png)

- Charlie → solo ve "Mis tickets"

![05-roles-and-permissions-2026-03-13-22-30-57](https://static-docs.nocobase.com/05-roles-and-permissions-2026-03-13-22-30-57.png)

**2. ¿Se filtran los datos como esperamos?**
- Primero, con Alice cree algunos tickets y asigne distintos responsables
- Cambie a Bob → solo verá los tickets asignados a él
- Cambie a Charlie → solo verá los tickets que ha enviado él

¿No es genial? Mismo sistema, distintos usuarios ven contenidos completamente distintos. Esa es la fuerza de los permisos.

## Resumen

En este capítulo hemos completado el sistema de permisos del sistema de tickets:

- **3 roles**: administrador, técnico, usuario normal
- **Permisos de menú**: controlan a qué páginas accede cada rol
- **Permisos de datos**: controlan qué datos ve cada rol (mediante el rango de datos)
- **Verificación de pruebas**: inicio de sesión con distintos usuarios y comprobación de que los permisos funcionan

A estas alturas, el sistema de tickets ya es bastante completo: permite registrar, consultar y controlar el acceso por rol. Pero todas las operaciones siguen siendo manuales.

## Avance del próximo capítulo

En el próximo capítulo aprenderemos **Workflow** — dejar que el sistema trabaje por nosotros. Por ejemplo, notificar automáticamente al responsable cuando se envía un ticket, o registrar automáticamente un log al cambiar de estado.

## Recursos relacionados

- [Gestión de usuarios](/users-permissions/user) — Detalles de la gestión de usuarios
- [Roles y permisos](/users-permissions/acl/role) — Descripción de la configuración de roles
- [Rango de datos](/users-permissions/acl/permissions) — Control de permisos a nivel de datos
