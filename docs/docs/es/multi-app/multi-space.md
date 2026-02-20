---
pkg: "@nocobase/plugin-multi-space"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



pkg: "@nocobase/plugin-multi-space"
---

# Multiespacio

## Introducción

El **plugin Multiespacio** le permite crear múltiples espacios de datos independientes dentro de una única instancia de aplicación, mediante un aislamiento lógico.

#### Casos de uso
- **Múltiples tiendas o fábricas**: Los procesos de negocio y las configuraciones del sistema son altamente consistentes (por ejemplo, gestión unificada de inventario, planificación de producción, estrategias de ventas y plantillas de informes), pero es necesario asegurar que los datos de cada unidad de negocio no interfieran entre sí.
- **Gestión de múltiples organizaciones o subsidiarias**: Varias organizaciones o subsidiarias de un grupo empresarial comparten la misma plataforma, pero cada marca tiene datos independientes de clientes, productos y pedidos.

## Instalación

En el gestor de plugins, busque el **plugin Multiespacio** y actívelo.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Manual de usuario

### Gestión de multiespacios

Después de activar el plugin, vaya a la página de configuración **"Usuarios y Permisos"** y cambie al panel de **Espacios** para gestionar los espacios.

> Inicialmente, existe un **Espacio no asignado** incorporado, que se utiliza principalmente para ver datos antiguos que no están asociados a ningún espacio.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Crear un espacio

Haga clic en el botón "Añadir espacio" para crear un nuevo espacio:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Asignar usuarios

Después de seleccionar un espacio creado, puede configurar los usuarios que pertenecen a ese espacio en el lado derecho:

> **Consejo:** Después de asignar usuarios a un espacio, deberá **actualizar la página manualmente** para que la lista de cambio de espacios en la esquina superior derecha se actualice y muestre el espacio más reciente.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Cambiar y ver multiespacios

Puede cambiar el espacio actual en la esquina superior derecha.
Cuando haga clic en el **icono del ojo** a la derecha (en su estado resaltado), podrá ver datos de múltiples espacios simultáneamente.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gestión de datos en multiespacios

Después de activar el plugin, el sistema añadirá automáticamente un **campo de espacio** al crear una **colección** (tabla de datos).
**Solo las colecciones que contengan este campo se incluirán en la lógica de gestión de espacios.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Para las colecciones existentes, puede añadir manualmente un campo de espacio para habilitar la gestión de espacios:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Lógica predeterminada

En las colecciones que contienen el campo de espacio, el sistema aplicará automáticamente la siguiente lógica:

1. Al crear datos, se asocian automáticamente con el espacio seleccionado actualmente.
2. Al filtrar datos, se limitan automáticamente a los datos del espacio seleccionado actualmente.

### Clasificación de datos antiguos en multiespacios

Para los datos que existían antes de activar el plugin Multiespacio, puede clasificarlos en espacios siguiendo estos pasos:

#### 1. Añadir el campo de espacio

Añada manualmente el campo de espacio a la colección antigua:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Asignar usuarios al Espacio no asignado

Asocie al usuario que gestiona los datos antiguos con todos los espacios, incluyendo el **Espacio no asignado**, para poder ver los datos que aún no han sido asignados a un espacio:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Cambiar para ver todos los datos del espacio

En la parte superior, seleccione ver los datos de todos los espacios:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configurar una página para la asignación de datos antiguos

Cree una nueva página para la asignación de datos antiguos. Muestre el "campo de espacio" en la **página de lista** y en la **página de edición** para poder ajustar manualmente el espacio de pertenencia.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Haga que el campo de espacio sea editable.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Asignar datos a espacios manualmente

A través de la página creada anteriormente, edite manualmente los datos para asignar gradualmente el espacio correcto a los datos antiguos (también puede configurar la edición masiva por su cuenta).