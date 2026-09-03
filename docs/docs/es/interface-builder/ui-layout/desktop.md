---
title: "Diseño de escritorio"
description: "Conoce la estructura de navegación, la creación de páginas, la administración de rutas y el comportamiento adaptable en pantallas estrechas del diseño de escritorio de NocoBase."
keywords: "diseño de escritorio,diseño de UI,pantalla estrecha,diseño adaptable,creación de páginas,administración de rutas,UI Editor,NocoBase"
---

# Diseño de escritorio

En NocoBase, el **diseño de escritorio** es la interfaz predeterminada de la aplicación. Resulta adecuado para administrar datos, introducir información en formularios, configurar procesos de negocio y realizar el trabajo diario desde un ordenador. También puede usarse en dispositivos móviles.

El diseño de escritorio está disponible en `/admin` de forma predeterminada. Si la aplicación tiene un prefijo de acceso propio, la URL real incluirá ese prefijo automáticamente.

![20260715224020](https://static-docs.nocobase.com/20260715224020.png)

![20260715224603](https://static-docs.nocobase.com/20260715224603.png)

## Crear una página

### Paso 1: abrir el diseño de escritorio

Accede a `/admin` para abrir el diseño de escritorio. Por lo general, la aplicación también abre esta vista directamente después de iniciar sesión.

![20260715225049](https://static-docs.nocobase.com/20260715225049.png)

### Paso 2: abrir UI Editor

Haz clic en «UI Editor» en la esquina superior derecha de la página para entrar en el modo de diseño. Aparecerán opciones de configuración junto a los menús, las páginas, los bloques, los campos y las acciones.

![20260715225155_rec_](https://static-docs.nocobase.com/20260715225155_rec_.gif)

### Paso 3: crear menús y páginas

Puedes añadir grupos, páginas o enlaces en el área de navegación, y activar pestañas en una página. Después de crear una página, ábrela y añade los bloques que necesites.

El contenido se crea del mismo modo que en otras interfaces: primero añade [bloques](../blocks/index.md) y después configura los [campos](../fields/index.md) y las [acciones](../actions/index.md) según las necesidades del negocio.

![20260715225316_rec_](https://static-docs.nocobase.com/20260715225316_rec_.gif)

### Paso 4: configurar el contenido de la página

Añade bloques de tabla, formulario, detalles, filtro u otros tipos, y después ajusta los campos, las acciones y la disposición de los bloques. Los cambios se reflejan directamente en la página actual.

![20260715225424_rec_](https://static-docs.nocobase.com/20260715225424_rec_.gif)

## Administrar rutas y menús

Al añadir una página o un enlace desde la navegación, también aparecerá en el [Administrador de Rutas](../../routes/index.md). Los cambios realizados en el Administrador de Rutas también actualizan el menú.

El diseño de escritorio admite estos tipos de ruta habituales:

- **Grupo (Group)** — Organiza varias páginas y enlaces dentro de un mismo grupo de navegación.
- **Página (Page)** — Abre una página en la que puedes seguir añadiendo bloques.
- **Enlace (Link)** — Abre una dirección interna o externa.
- **Pestaña (Tab)** — Organiza varias pestañas de contenido dentro de una página.

En el Administrador de Rutas puedes añadir, editar, eliminar, mostrar u ocultar rutas. Cuando necesites reorganizar toda la estructura del menú, suele resultar más cómodo hacerlo allí.

![20260715225711_rec_](https://static-docs.nocobase.com/20260715225711_rec_.gif)

## Adaptación a pantallas estrechas

El diseño de escritorio puede usarse directamente en un teléfono o en una ventana estrecha del navegador. En este modo sigue usando las rutas y páginas de escritorio originales. No cambia automáticamente al diseño móvil.

### Cambios en el diseño

El menú de navegación se contrae y las acciones superiores se agrupan en una opción más compacta. Los márgenes de la página y el espacio entre bloques también se reducen, mientras que el área de contenido se adapta a la altura visible del navegador móvil.

UI Editor no está disponible en pantallas estrechas. Para cambiar menús o páginas, es necesario volver al navegador del ordenador y realizar allí los ajustes.

![20260715224603](https://static-docs.nocobase.com/20260715224603.png)

### Adaptación del contenido

Los componentes habituales también ajustan sus interacciones en pantallas estrechas para facilitar el uso desde un teléfono. Por ejemplo, los bloques con varias columnas pasan a una sola columna, las tablas permiten desplazarse horizontalmente para ver las columnas que no caben, y la paginación y las acciones se vuelven más compactas. Las selecciones, las fechas y horas, los filtros y las subpáginas también utilizan interacciones más adecuadas para teléfonos.

:::tip Diseño adaptable de escritorio y diseño móvil

Si solo accedes ocasionalmente desde un teléfono, el diseño adaptable de escritorio suele ser suficiente. Si necesitas una navegación inferior, páginas móviles y flujos de trabajo específicos, crea también un [diseño móvil](./mobile.md).

:::

## Recomendaciones

- Utiliza el diseño de escritorio de forma predeterminada para el trabajo que se realiza principalmente desde un ordenador.
- Termina de crear la página en una pantalla ancha y después estrecha la ventana para comprobar el resultado.
- Si una página contiene muchas columnas de tabla o acciones horizontales, conserva solo el contenido necesario para reducir la carga de trabajo en pantallas pequeñas.
- Si los flujos de escritorio y móvil son muy diferentes, suele ser más claro crear páginas independientes.

## Enlaces relacionados

- [Visión general del diseño de UI](./index.md) — Compara los casos de uso de los diseños de escritorio y móvil
- [Diseño móvil](./mobile.md) — Crea una navegación y páginas específicas para móviles
- [Bloques](../blocks/index.md) — Añade y configura bloques en una página
- [Campos](../fields/index.md) — Configura campos de tablas, formularios y bloques de detalles
- [Acciones](../actions/index.md) — Configura acciones en páginas y bloques
- [Administrador de Rutas](../../routes/index.md) — Administra los menús y rutas de escritorio desde un mismo lugar
- [Configuración de permisos](../../users-permissions/acl/permissions.md) — Controla las rutas de escritorio a las que puede acceder cada rol
