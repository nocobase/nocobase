:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Permisos de Operación

## Introducción

En NocoBase 2.0, los permisos de operación se controlan principalmente mediante los permisos de recursos de la colección:

- **Permiso de recurso de colección**: Se utiliza para controlar de forma unificada los permisos de operación básicos (como Crear, Ver, Actualizar y Eliminar) que tienen los diferentes roles sobre una colección. Este permiso se aplica a toda la colección dentro de la fuente de datos, asegurando que los permisos de operación de un rol para esa colección se mantengan consistentes en diferentes páginas, ventanas emergentes y bloques.

### Permiso de recurso de colección

En el sistema de permisos de NocoBase, los permisos de operación de la colección se dividen fundamentalmente según las dimensiones CRUD, lo que garantiza la coherencia y estandarización en la gestión de permisos. Por ejemplo:

- **Permiso de creación (Create)**: Controla todas las operaciones relacionadas con la creación en la colección, incluyendo las acciones de añadir, duplicar, etc. Siempre que un rol tenga el permiso de creación para esta colección, las acciones de añadir, duplicar y otras operaciones de creación serán visibles en todas las páginas y ventanas emergentes.
- **Permiso de eliminación (Delete)**: Controla la operación de eliminación para esta colección. El permiso se mantiene consistente, ya sea una eliminación masiva en un bloque de tabla o la eliminación de un solo registro en un bloque de detalles.
- **Permiso de actualización (Update)**: Controla las operaciones de tipo actualización para esta colección, como las acciones de edición y las de actualizar registros.
- **Permiso de visualización (View)**: Controla la visibilidad de los datos de esta colección. Los bloques de datos relacionados (Tabla, Lista, Detalles, etc.) solo serán visibles cuando el rol tenga permiso de visualización para esta colección.

Este método de gestión de permisos universal es adecuado para el control estandarizado de permisos de datos, asegurando que para la `misma colección`, la `misma operación` tenga reglas de permiso `consistentes` en `diferentes páginas, ventanas emergentes y bloques`, lo que proporciona uniformidad y mantenibilidad.

#### Permisos Globales

Los permisos de operación globales se aplican a todas las colecciones dentro de la fuente de datos y se clasifican por tipo de recurso de la siguiente manera:

![20250306204756](https://static-docs.nocobase.com/20250306204756.png)

#### Permisos de Operación de Colección Específicos

Los permisos de operación de colección específicos tienen prioridad sobre los permisos generales de la fuente de datos, lo que permite una mayor granularidad en la configuración de permisos personalizados para el acceso a los recursos de una colección específica. Estos permisos se dividen en dos aspectos:

1.  Permisos de operación: Los permisos de operación incluyen las acciones de añadir, ver, editar, eliminar, exportar e importar. Estos permisos se configuran según la dimensión del alcance de los datos:
    -   Todos los registros: Permite a los usuarios realizar operaciones sobre todos los registros de la colección.
    -   Registros propios: Restringe a los usuarios a realizar operaciones únicamente sobre los registros de datos que ellos mismos han creado.

2.  Permisos de campo: Los permisos de campo permiten configurar permisos para cada campo en diferentes operaciones. Por ejemplo, algunos campos pueden configurarse para ser solo de visualización y no editables.

![20250306205042](https://static-docs.nocobase.com/20250306205042.png)

## Documentación Relacionada

[Configurar Permisos]
<!-- (/users-and-permissions) -->