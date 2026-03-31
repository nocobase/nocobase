---
pkg: "@nocobase/plugin-multi-space"
---

# Multi-space

<PluginInfo name="multi-space" licenseBundled="professional"></PluginInfo>

## Introducción

El **plugin Multi-space** permite crear múltiples espacios de datos independientes dentro de una sola instancia mediante aislamiento lógico.

#### Escenarios
- **Múltiples tiendas o fábricas**: procesos y configuración similares, con aislamiento de datos por unidad.
- **Múltiples organizaciones o filiales**: misma plataforma compartida, con datos de clientes/productos/pedidos separados por marca.

## Instalación

Activa el plugin **Multi-Space** desde el gestor de plugins.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## Guía de uso

### Gestión de espacios

Tras activar el plugin, entra en **Users & Permissions** y cambia a la pestaña **Spaces**.

> Inicialmente existe un **Unassigned Space** para visualizar datos antiguos no asociados.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Crear espacio

Pulsa **Add space** para crear un nuevo espacio.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Asignar usuarios

Selecciona un espacio y configura sus usuarios en el panel derecho.

> **Nota:** después de asignar usuarios, hay que **refrescar manualmente** para que se actualice la lista de cambio de espacio (arriba a la derecha).

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Cambiar y ver espacios

Puedes cambiar el espacio actual arriba a la derecha. Al hacer clic en el **icono de ojo** (resaltado), puedes ver datos de varios espacios a la vez.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Gestión de datos en multi-space

Al habilitar el plugin, el sistema agrega automáticamente un **campo Space** al crear una colección. **Solo las colecciones con este campo** se incluyen en la lógica de espacios.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

Para colecciones existentes, añade el campo Space manualmente.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Lógica por defecto

1. Al crear datos, se asocian automáticamente al espacio seleccionado.
2. Al filtrar, se limitan automáticamente al espacio seleccionado.

### Clasificar datos antiguos por espacio

Para datos anteriores a la activación del plugin:

#### 1. Añadir campo Space

Añade manualmente el campo Space a las tablas antiguas.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Asignar usuarios al Unassigned Space

Asocia los usuarios que gestionan datos antiguos a todos los espacios, incluyendo **Unassigned Space**.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Ver datos de todos los espacios

En la parte superior, activa la vista de todos los espacios.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configurar página de asignación

Crea una página para asignar datos antiguos y muestra el campo Space en la **lista** y en la **página de edición**.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Configura el campo Space como editable.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Asignar manualmente el espacio

Desde esa página, edita los datos y asigna progresivamente el espacio correcto (también puedes configurar edición por lote).
