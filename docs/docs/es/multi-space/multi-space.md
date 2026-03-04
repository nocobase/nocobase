---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/multi-space/multi-space).
:::

# Multiespacio

## Introducción

El **plugin Multiespacio** permite disponer de múltiples espacios de datos independientes dentro de una única instancia de la aplicación mediante el aislamiento lógico.

#### Casos de uso
- **Múltiples tiendas o fábricas**: Los procesos de negocio y las configuraciones del sistema son altamente consistentes (por ejemplo, gestión de inventario unificada, planificación de producción, estrategias de ventas y plantillas de informes), pero los datos de cada unidad de negocio deben permanecer independientes.
- **Gestión de múltiples organizaciones o subsidiarias**: Varias organizaciones o filiales de un grupo empresarial comparten la misma plataforma, pero cada marca dispone de datos independientes de clientes, productos y pedidos.


## Instalación

Busque el plugin **Multiespacio (Multi-Space)** en el Administrador de plugins y actívelo.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)


## Manual de usuario

### Gestión de multiespacio

Tras activar el plugin, diríjase a la página de configuración de **«Usuarios y permisos»** y cambie al panel de **Espacios** para gestionarlos.

> Por defecto, existe un **Espacio no asignado (Unassigned Space)** integrado, que se utiliza principalmente para visualizar datos antiguos que aún no se han asociado a un espacio.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Crear un espacio

Haga clic en el botón «Añadir espacio» para crear uno nuevo:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Asignar usuarios

Tras seleccionar un espacio creado, puede configurar en el lado derecho los usuarios que pertenecen a dicho espacio:

> **Consejo:** Después de asignar usuarios a un espacio, debe **actualizar la página manualmente** para que el conmutador de espacios en la esquina superior derecha se actualice y muestre los espacios más recientes.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)


### Cambio y visualización de espacios

Puede cambiar el espacio actual en la esquina superior derecha.  
Al hacer clic en el **icono del ojo** de la derecha (estado resaltado), podrá visualizar simultáneamente los datos de varios espacios.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gestión de datos multiespacio

Una vez activado el plugin, el sistema preconfigurará automáticamente un **campo de espacio** al crear una colección (Collection).  
**Solo las colecciones que contengan este campo se incluirán en la lógica de gestión de espacios.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Para las colecciones existentes, puede añadir manualmente un campo de espacio para habilitar la gestión de espacios:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Lógica por defecto

En las colecciones que incluyen un campo de espacio, el sistema aplica automáticamente la siguiente lógica:

1. Al crear datos, estos se asocian automáticamente al espacio seleccionado actualmente;
2. Al filtrar datos, estos se restringen automáticamente a los del espacio seleccionado actualmente.


### Clasificación de datos antiguos en espacios

Para los datos que ya existían antes de activar el plugin Multiespacio, puede clasificarlos en espacios siguiendo estos pasos:

#### 1. Añadir campo de espacio

Añada manualmente un campo de espacio a la colección antigua:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Asignar usuarios al espacio no asignado

Asocie a los usuarios que gestionan datos antiguos con todos los espacios, incluyendo el **Espacio no asignado (Unassigned Space)**, para visualizar los datos que aún no han sido asignados a un espacio:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Cambiar para ver todos los datos de los espacios

Seleccione la opción en la parte superior para ver los datos de todos los espacios:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configurar la página de asignación de datos antiguos

Cree una nueva página para la asignación de datos antiguos. Muestre el «campo de espacio» tanto en el **bloque de lista** como en el **formulario de edición** para ajustar manualmente la asignación del espacio.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Configure el campo de espacio en modo editable:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Asignar espacios de datos manualmente

A través de la página mencionada anteriormente, edite manualmente los datos para asignar gradualmente el espacio correcto a los datos antiguos (también puede configurar la edición por lotes usted mismo).