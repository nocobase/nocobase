---
title: "Diseño de escritorio"
description: "Conoce la estructura de navegación, la creación de páginas, la administración de rutas y el comportamiento adaptable en pantallas estrechas del diseño de escritorio de NocoBase."
keywords: "diseño de escritorio,diseño de UI,pantalla estrecha,diseño adaptable,creación de páginas,administración de rutas,UI Editor,NocoBase"
---

# Diseño de escritorio

En NocoBase, el **diseño de escritorio** es la interfaz predeterminada de la aplicación. Resulta adecuado para administrar datos, introducir información en formularios, configurar procesos de negocio y realizar el trabajo diario desde un ordenador. También ajusta la navegación y el contenido de las páginas en pantallas estrechas.

El diseño de escritorio está disponible en `/admin` de forma predeterminada. Si la aplicación tiene un prefijo de acceso propio, la URL real incluirá ese prefijo automáticamente.

<!-- Se necesita una captura completa del diseño de escritorio que muestre la navegación superior, la navegación lateral y el área de contenido -->

## Características del diseño

El diseño de escritorio se compone principalmente de las siguientes áreas:

- **Navegación superior** — Muestra el selector de aplicaciones y las acciones globales.
- **Navegación lateral** — Muestra las páginas y los enlaces del grupo actual.
- **Área de contenido** — Muestra las pestañas de página, los bloques, los campos y las acciones.
- **UI Editor** — Abre el modo de diseño para ajustar los menús y el contenido de las páginas.

La navegación superior y lateral mantienen seleccionada la ruta actual. Al cambiar de página, el contenido aparece en el área de la derecha y, por lo general, se conserva el estado de las páginas abiertas anteriormente.

## Crear una página

### Paso 1: abrir el diseño de escritorio

Accede a `/admin` para abrir el diseño de escritorio. Por lo general, la aplicación también abre esta vista directamente después de iniciar sesión.

<!-- Se necesita una captura del diseño de escritorio después de abrirlo -->

### Paso 2: abrir UI Editor

Haz clic en «UI Editor» en la esquina superior derecha de la página para entrar en el modo de diseño. Aparecerán opciones de configuración junto a los menús, las páginas, los bloques, los campos y las acciones.

<!-- Se necesita una captura que muestre la ubicación del botón «UI Editor» y el aspecto de la página después de activarlo -->

### Paso 3: crear menús y páginas

Puedes añadir grupos, páginas o enlaces en el área de navegación, y activar pestañas en una página. Después de crear una página, ábrela y añade los bloques que necesites.

El contenido se crea del mismo modo que en otras interfaces: primero añade [bloques](../blocks/index.md) y después configura los [campos](../fields/index.md) y las [acciones](../actions/index.md) según las necesidades del negocio.

<!-- Se necesita un vídeo que muestre cómo añadir un menú, crear una página y abrirla -->

### Paso 4: configurar el contenido de la página

Añade bloques de tabla, formulario, detalles, filtro u otros tipos, y después ajusta los campos, las acciones y la disposición de los bloques. Los cambios se reflejan directamente en la página actual.

<!-- Se necesita una captura de una página de escritorio en modo de diseño que muestre las opciones de configuración de bloques, campos y acciones -->

## Administrar rutas y menús

Los menús y las rutas de escritorio utilizan la misma configuración. Al añadir una página o un enlace desde la navegación, también aparecerá en el [Administrador de Rutas](../../routes/index.md). Los cambios realizados en el Administrador de Rutas también actualizan el menú.

El diseño de escritorio admite estos tipos de ruta habituales:

- **Grupo (Group)** — Organiza varias páginas y enlaces dentro de un mismo grupo de navegación.
- **Página (Page)** — Abre una página en la que puedes seguir añadiendo bloques.
- **Enlace (Link)** — Abre una dirección interna o externa.
- **Pestaña (Tab)** — Organiza varias pestañas de contenido dentro de una página.

En el Administrador de Rutas puedes añadir, editar, eliminar, mostrar u ocultar rutas. Cuando necesites reorganizar toda la estructura del menú, suele resultar más cómodo hacerlo allí.

<!-- Se necesita una captura de «Configuración / Rutas / Rutas de escritorio» -->

## Adaptación a pantallas estrechas

El diseño de escritorio puede usarse directamente en un teléfono o en una ventana estrecha del navegador. En este modo se siguen usando las mismas rutas y páginas de escritorio. No cambia automáticamente al diseño móvil.

### Cambios en el diseño

El menú de navegación se contrae y las acciones superiores se agrupan en una opción más compacta. Los márgenes de la página y el espacio entre bloques también se reducen, mientras que el área de contenido se adapta a la altura visible del navegador móvil.

UI Editor no está disponible en pantallas estrechas. Para cambiar menús o páginas, vuelve al navegador del ordenador y realiza allí los ajustes.

<!-- Se necesita un vídeo que muestre cómo una misma página de escritorio cambia de una pantalla ancha a una estrecha -->

### Adaptación del contenido

Los diseños y componentes habituales también se ajustan a las pantallas estrechas. Por ejemplo, los bloques con varias columnas se organizan para facilitar la lectura vertical, las tablas permiten desplazarse horizontalmente para ver las columnas que no caben, y la paginación y las acciones se vuelven más compactas. Las selecciones, las fechas y horas, los filtros y las subpáginas también utilizan interacciones más adecuadas para una pantalla pequeña.

El comportamiento adicional en pantallas estrechas depende de la compatibilidad de cada bloque. Las tablas siguen mostrándose como tablas y no se convierten automáticamente en tarjetas.

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
