---
pkg: '@nocobase/plugin-acl'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Configuración de Permisos

## Configuración General de Permisos

![](https://static-docs.nocobase.com/119a9650259f9be71210121d0d3a435d.png)

### Permisos de Configuración

1.  **Permite configurar la interfaz**: Este permiso controla si un usuario puede configurar la interfaz de usuario. Al activarlo, verá un botón para la configuración de la interfaz. El rol "admin" tiene este permiso habilitado por defecto.
2.  **Permite instalar, activar y deshabilitar plugins**: Este permiso determina si un usuario puede habilitar o deshabilitar **plugins**. Al activarlo, el usuario tendrá acceso a la interfaz del gestor de **plugins**. El rol "admin" tiene este permiso habilitado por defecto.
3.  **Permite configurar plugins**: Este permiso permite al usuario configurar los parámetros de los **plugins** o gestionar sus datos de backend. El rol "admin" tiene este permiso habilitado por defecto.
4.  **Permite limpiar la caché y reiniciar la aplicación**: Este permiso está vinculado a tareas de mantenimiento del sistema, como limpiar la caché y reiniciar la aplicación. Una vez activado, los botones de operación relacionados aparecerán en su centro de usuario. Este permiso está deshabilitado por defecto.
5.  **Los nuevos elementos de menú se permiten acceder por defecto**: Los menús que se crean son accesibles por defecto, y esta configuración está habilitada por defecto.

### Permisos de Operación Global

Los permisos de operación global se aplican universalmente a todas las **colecciones** y se categorizan por tipo de operación. Estos permisos se pueden configurar según el alcance de los datos: **todos los datos** o **los datos propios del usuario**. El primero permite realizar operaciones en toda la **colección**, mientras que el segundo restringe las operaciones a los datos relevantes para el usuario.

## Permisos de Operación de Colección

![](https://static-docs.nocobase.com/6a6e0281391cecdea5b381e6173c5d7.png)

![](https://static-docs.nocobase.com/9814140434ff9e1bf028a6c282a5a165.png)

Los permisos de operación de **colección** permiten un ajuste más preciso de los permisos de operación global, configurando el acceso a los recursos dentro de cada **colección**. Estos permisos se dividen en dos aspectos:

1.  **Permisos de operación**: Incluyen las acciones de añadir, ver, editar, eliminar, exportar e importar. Los permisos se configuran según el alcance de los datos:
    -   **Todos los datos**: Permite al usuario realizar operaciones en todos los registros dentro de la **colección**.
    -   **Datos propios**: Restringe al usuario a realizar operaciones solo en los registros que ha creado.

2.  **Permisos de campo**: Le permiten establecer permisos específicos para cada campo durante diferentes operaciones. Por ejemplo, algunos campos se pueden configurar para ser solo de visualización, sin privilegios de edición.

## Permisos de Acceso a Menús

Los permisos de acceso a menús controlan el acceso basándose en los elementos del menú.

![](https://static-docs.nocobase.com/28eddfc843d27641162d9129e3b6e33f.png)

## Permisos de Configuración de Plugins

Los permisos de configuración de **plugins** controlan la capacidad de configurar parámetros específicos de **plugins**. Cuando están habilitados, la interfaz de gestión de **plugins** correspondiente aparece en el centro de administración.

![](https://static-docs.nocobase.com/5a742ae20a9de93dc2722468b9fd7475.png)