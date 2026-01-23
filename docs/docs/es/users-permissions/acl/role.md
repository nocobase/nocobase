---
pkg: '@nocobase/plugin-acl'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Roles

## Centro de Gestión

### Gestión de Roles

![](https://static-docs.nocobase.com/da7083c67d794e23dc6eb0f85b1de86c.png)

La aplicación incluye dos roles predefinidos: "Admin" y "Member". Cada uno de ellos cuenta con configuraciones de permisos predeterminadas distintas, adaptadas a sus funcionalidades.

### Añadir, Eliminar y Modificar Roles

El identificador del rol es único en el sistema y permite personalizar los roles predeterminados. Sin embargo, los roles predefinidos del sistema no se pueden eliminar.

![](https://static-docs.nocobase.com/35f323b346db4f9f12f9bee4dea63302.png)

### Configurar el Rol Predeterminado

El rol predeterminado es el que se asigna automáticamente a los nuevos usuarios si no se les proporciona un rol específico durante su creación.

![](https://static-docs.nocobase.com/f41bba7ff55ca28715c486dc45bc1708.png)

## Centro Personal

### Cambio de Rol

Se puede asignar múltiples roles a un usuario. Cuando un usuario tiene varios roles, puede cambiarlos en el Centro Personal.

![](https://static-docs.nocobase.com/e31bba7ff55ca28715c486dc45bc1708.png)

El rol predeterminado al iniciar sesión se determina por el rol que se cambió más recientemente (este valor se actualiza con cada cambio) o, si no aplica, por el primer rol (el rol predeterminado del sistema).