---
title: "Diseño móvil"
description: "Conoce la navegación móvil, la creación de páginas, la vista previa desde el escritorio, las interacciones de subpáginas, las rutas y los permisos en NocoBase."
keywords: "diseño móvil,páginas móviles,navegación inferior,vista previa móvil,rutas móviles,UI Editor,NocoBase"
---

# Diseño móvil

En NocoBase, el **diseño móvil** permite crear una navegación y páginas independientes para dispositivos móviles. Está disponible en `/mobile` de forma predeterminada y utiliza una barra de pestañas inferior como navegación principal. Resulta adecuado para introducir y consultar datos, aprobar solicitudes y gestionar tareas desde un teléfono.

Los diseños móvil y de escritorio utilizan las mismas fuentes de datos y los mismos datos de negocio, pero sus menús, rutas y páginas se configuran por separado. Así puedes reorganizar las páginas según el uso móvil sin depender de la estructura de las páginas de escritorio.

<!-- Se necesita una captura completa del diseño móvil en un dispositivo físico -->

## Abrir y previsualizar el diseño móvil

De forma predeterminada, puedes hacer clic en «Móvil» en la configuración para abrirlo. También puedes acceder directamente a `/mobile`.

Es recomendable crear las páginas desde el navegador del ordenador. En esta vista aparece un área de previsualización móvil y una barra de herramientas superior:

- «UI Editor» activa o desactiva el modo de diseño.
- «Vista previa de tableta» permite comprobar el resultado en dispositivos móviles más anchos.
- «Vista previa móvil» restaura el área de previsualización con el tamaño de un teléfono.
- «Código QR» abre la dirección móvil actual en un teléfono.

![20260715221712](https://static-docs.nocobase.com/20260715221712.png)

Después de crear las páginas en el ordenador, escanea el código QR y comprueba el resultado en un dispositivo físico. Revisa especialmente la navegación, el desplazamiento, la entrada de datos, las páginas emergentes y las áreas seguras.

## Crear la navegación móvil

El diseño móvil utiliza una barra de pestañas inferior como navegación principal. Actualmente, esta navegación admite principalmente páginas y enlaces.

### Añadir una página

1. Abre «UI Editor».
2. Haz clic en el botón de añadir situado a la derecha de la barra de pestañas inferior.
3. Selecciona «Página».
4. Introduce el título de la página y selecciona un icono.
5. Guarda la configuración para abrir la nueva página y continúa añadiendo su contenido.

![20260715221823_rec_](https://static-docs.nocobase.com/20260715221823_rec_.gif)

### Añadir un enlace

Si necesitas abrir una dirección interna o externa, selecciona «Enlace» y configura el título, el icono y la URL.

El enlace puede abrirse en la ventana actual o en una nueva, según su configuración.

![20260715221950](https://static-docs.nocobase.com/20260715221950.png)

### Ordenar la navegación

En el modo de diseño puedes arrastrar las pestañas inferiores para cambiar su orden. También puedes editar el título y el icono de cada pestaña, configurar reglas de vinculación, copiar su UID o eliminarla.

Para consultar, mostrar, ocultar o eliminar las rutas móviles desde un mismo lugar, abre «Configuración / Rutas / Rutas móviles».

![20260715222113_rec_](https://static-docs.nocobase.com/20260715222113_rec_.gif)

## Crear una página móvil

Crea y abre una página móvil antes de añadirle bloques. El planteamiento para crear el contenido de la página es básicamente el mismo que en el diseño de escritorio: utiliza [bloques](../blocks/index.md), [campos](../fields/index.md) y [acciones](../actions/index.md) para organizar el contenido del negocio. No obstante, la navegación móvil y algunas interacciones de los componentes se ajustan a las pantallas pequeñas.

### Añadir contenido a la página

1. Abre la página móvil que quieres crear.
2. Comprueba que «UI Editor» está activado.
3. Haz clic en «Añadir bloque» dentro de la página.
4. Selecciona una tabla, un formulario, un bloque de detalles, un filtro u otro tipo de bloque.
5. Continúa configurando los campos, las acciones y los ajustes del bloque.

![20260715222230_rec_](https://static-docs.nocobase.com/20260715222230_rec_.gif)

### Usar pestañas de página

Una página móvil también puede utilizar pestañas. Si varios contenidos deben aparecer bajo una misma opción de navegación, pero son relativamente independientes, puedes colocarlos en pestañas separadas.

1. Abre la configuración de la página y activa «Activar pestañas de página». También puedes editar la página en «Configuración / Rutas / Rutas móviles» y marcar «Activar pestañas de página».
2. Activa «UI Editor».
3. Haz clic en «Añadir pestaña» a la derecha de la barra de pestañas de la página.
4. Añade la pestaña y configura su nombre y el contenido de la página.

Si la página móvil contiene poco contenido, utiliza una sola página. No es necesario activar las pestañas.

![20260715222354_rec_](https://static-docs.nocobase.com/20260715222354_rec_.gif)

### Interacciones móviles de los componentes habituales

Los componentes habituales ajustan su disposición e interacción al diseño móvil. Por ejemplo, el contenido con varias columnas pasa automáticamente a una sola columna que facilita la lectura vertical, los campos de selección y fecha y hora utilizan selectores adaptados al móvil, y los filtros, la selección de registros asociados y las subpáginas usan interfaces pensadas para la interacción táctil.

Las tablas siguen mostrándose como tablas en el móvil, con desplazamiento horizontal para las columnas que no caben en la pantalla. El comportamiento móvil adicional depende de la compatibilidad de cada bloque.

## Páginas y subpáginas

El contenido que se abre desde acciones como ver, editar o seleccionar registros asociados aparece como una subpágina móvil. La subpágina incluye un botón para volver a la página anterior.

Al abrir una subpágina más profunda, la barra de pestañas inferior se oculta para dejar más espacio al contenido actual. Vuelve a aparecer al cerrar la subpágina o regresar al nivel anterior.

Al cambiar entre las pestañas inferiores, se conserva el estado de las páginas abiertas. Así puedes alternar con facilidad entre varias tareas móviles.

![20260715222828_rec_](https://static-docs.nocobase.com/20260715222828_rec_.gif)

## Administrar rutas y permisos

Las rutas móviles se pueden administrar desde el [Administrador de Rutas](../../routes/index.md). Abre «Configuración / Rutas / Rutas móviles» para añadir, editar, eliminar, mostrar u ocultar páginas y enlaces, y para configurar las pestañas de una página.

Los permisos de acceso a las rutas móviles se configuran por separado de los permisos de escritorio. En los permisos del rol, abre «Rutas móviles» y selecciona las páginas a las que puede acceder el rol actual. Consulta [Configuración de permisos](../../users-permissions/acl/permissions.md) para obtener más información.

![20260715223016_rec_](https://static-docs.nocobase.com/20260715223016_rec_.gif)

![20260715223106_rec_](https://static-docs.nocobase.com/20260715223106_rec_.gif)

## Relación con el diseño de escritorio

Puedes crear páginas de escritorio y móvil diferentes a partir de una misma tabla de datos. Por ejemplo, la página de escritorio puede usar una tabla con muchos campos para procesar datos, mientras que la página móvil utiliza una lista o un formulario más sencillo para introducir datos sobre el terreno.

Las páginas de ambos diseños no se sincronizan automáticamente. Los cambios en las páginas, los menús o las rutas de escritorio no actualizan la configuración móvil, y los cambios móviles tampoco afectan al escritorio.

:::tip Recomendación

Si desde el móvil solo necesitas consultar ocasionalmente las páginas de escritorio, prueba primero el [diseño de escritorio](./desktop.md) adaptable. Crea un diseño móvil independiente solo cuando necesites una navegación y flujos de página propios para dispositivos móviles.

:::

## Enlaces relacionados

- [Visión general del diseño de UI](./index.md) — Compara los casos de uso de los diseños de escritorio y móvil
- [Diseño de escritorio](./desktop.md) — Utiliza el diseño de escritorio predeterminado y su adaptación a pantallas estrechas
- [Bloques](../blocks/index.md) — Añade contenido de negocio a las páginas móviles
- [Campos](../fields/index.md) — Configura formularios móviles y campos de visualización de datos
- [Acciones](../actions/index.md) — Configura acciones en las páginas móviles
- [Administrador de Rutas](../../routes/index.md) — Administra páginas móviles, enlaces y pestañas
- [Configuración de permisos](../../users-permissions/acl/permissions.md) — Controla las rutas móviles a las que puede acceder cada rol
