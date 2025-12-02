---
pkg: "@nocobase/plugin-client"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Administrador de Rutas

## Introducción

El administrador de rutas es una herramienta para gestionar las rutas de la página principal del sistema, compatible con dispositivos `de escritorio` y `móviles`. Las rutas que cree usando el administrador de rutas se sincronizarán con el menú (puede configurarlas para que no se muestren en el menú). A la inversa, los elementos de menú que añada en el menú de la página también se sincronizarán con la lista del administrador de rutas.

![20250107115449](https://static-docs.nocobase.com/20250107115449.png)

## Manual de Usuario

### Tipos de Rutas

El sistema soporta cuatro tipos de rutas:

- Grupo (`group`): Se utiliza para gestionar rutas agrupándolas, y puede incluir subrutas.
- Página (`page`): Una página interna del sistema.
- Pestaña (`tab`): Un tipo de ruta que se utiliza para cambiar entre pestañas dentro de una página.
- Enlace (`link`): Un enlace interno o externo que puede dirigir directamente a la dirección configurada.

### Añadir Ruta

Haga clic en el botón "Add new" en la esquina superior derecha para crear una nueva ruta:

1. Seleccione el tipo de ruta (`Type`).
2. Rellene el título de la ruta (`Title`).
3. Seleccione el icono de la ruta (`Icon`).
4. Configure si desea mostrarla en el menú (`Show in menu`).
5. Configure si desea habilitar las pestañas de página (`Enable page tabs`).
6. Para el tipo de página, el sistema generará automáticamente una ruta única (`Path`).

![20250124131803](https://static-docs.nocobase.com/20250124131803.png)

### Acciones de Ruta

Cada entrada de ruta soporta las siguientes acciones:

- `Add child`: Añadir una subruta.
- `Edit`: Editar la configuración de la ruta.
- `View`: Ver la página de la ruta.
- `Delete`: Eliminar la ruta.

### Acciones Masivas

La barra de herramientas superior ofrece las siguientes acciones masivas:

- `Refresh`: Actualizar la lista de rutas.
- `Delete`: Eliminar las rutas seleccionadas.
- `Hide in menu`: Ocultar las rutas seleccionadas en el menú.
- `Show in menu`: Mostrar las rutas seleccionadas en el menú.

### Filtrado de Rutas

Utilice la función "Filter" en la parte superior para filtrar la lista de rutas según sus necesidades.

:::info{title=Nota}
Modificar las configuraciones de ruta afectará directamente la estructura del menú de navegación del sistema. Por favor, proceda con precaución y asegúrese de la exactitud de las configuraciones de ruta.
:::