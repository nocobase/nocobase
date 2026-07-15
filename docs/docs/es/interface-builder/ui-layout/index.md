---
title: "Diseño de UI"
description: "Visión general de los diseños de UI de NocoBase, con las características y casos de uso de los diseños de escritorio y móvil, y la relación entre sus configuraciones."
keywords: "diseño de UI,diseño de escritorio,diseño móvil,diseño adaptable,páginas móviles,NocoBase"
---

# Diseño de UI

NocoBase ofrece diseños de escritorio y móvil. En ambos puedes usar el Diseñador de UI para crear páginas y configurar bloques, campos y acciones.

El diseño de escritorio es la opción predeterminada y resulta adecuado para la administración diaria y el procesamiento de datos desde un ordenador. Si necesitas una navegación y páginas específicas para dispositivos móviles, también puedes crear un diseño móvil.

<!-- Se necesita una captura general que compare los diseños de escritorio y móvil -->

## Diseño de escritorio

El [diseño de escritorio](./desktop.md) está disponible en `/admin` de forma predeterminada. Se compone de una navegación superior, una navegación lateral y un área de contenido, y resulta adecuado para tareas habituales como administrar tablas, introducir datos en formularios y consultar registros.

El diseño de escritorio también se adapta a pantallas estrechas. Cuando una página se muestra en una pantalla pequeña, la navegación, los espacios y los componentes habituales se ajustan al espacio disponible, pero se siguen usando los mismos menús y páginas de escritorio.

<!-- Se necesita una captura de la página completa del diseño de escritorio -->

## Diseño móvil

El [diseño móvil](./mobile.md) está disponible en `/mobile` de forma predeterminada. Utiliza una barra de pestañas inferior como navegación principal y ofrece páginas, enlaces y pestañas de página específicos para móviles.

El diseño móvil resulta adecuado para tareas frecuentes desde el teléfono, como la introducción de datos sobre el terreno, las aprobaciones, la gestión de tareas y la consulta de datos. Puedes crear y previsualizar las páginas en el navegador del ordenador y usar un código QR para comprobar el resultado en un dispositivo físico.

<!-- Se necesita una captura de la página completa del diseño móvil -->

## Qué diseño elegir

Utiliza el diseño de escritorio de forma predeterminada.

| Quiero... | Diseño recomendado |
| --- | --- |
| Trabajar principalmente desde un ordenador y acceder ocasionalmente desde un teléfono | [Diseño de escritorio](./desktop.md) |
| Diseñar una navegación, páginas y flujos específicos para teléfonos | [Diseño móvil](./mobile.md) |
| Ofrecer una experiencia completa tanto en ordenadores como en dispositivos móviles | Crear por separado los diseños de escritorio y móvil |

## Relación entre las configuraciones

Los diseños de escritorio y móvil utilizan las mismas fuentes de datos, colecciones y datos de negocio. Puedes usar una misma colección para crear páginas diferentes, adaptadas a cada dispositivo.

Los menús, las rutas y las páginas se administran por separado. Los cambios en una página de escritorio no actualizan automáticamente la página móvil, y los cambios en la navegación móvil tampoco afectan a la navegación de escritorio. Los [permisos de acceso a las rutas](../../users-permissions/acl/permissions.md) también deben configurarse por separado para cada diseño.

## Enlaces relacionados

- [Diseño de escritorio](./desktop.md) — Crea páginas de escritorio y conoce su comportamiento en pantallas estrechas
- [Diseño móvil](./mobile.md) — Crea una navegación y páginas específicas para móviles
- [Administrador de Rutas](../../routes/index.md) — Administra páginas, enlaces y menús de escritorio y móvil
- [Configuración de permisos](../../users-permissions/acl/permissions.md) — Controla los menús y páginas a los que puede acceder cada rol
