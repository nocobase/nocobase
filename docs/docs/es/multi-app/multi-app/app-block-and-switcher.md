---
pkg: '@nocobase/plugin-app-supervisor'
title: 'Bloque de aplicaciones y selector'
description: 'Bloque de aplicaciones y selector en multiaplicación: mostrar entradas de subaplicaciones en el frontend, configurar iconos, visibilidad y el selector de la esquina superior izquierda.'
keywords: 'multiaplicación,bloque de aplicaciones,selector de aplicaciones,entrada de subaplicación,NocoBase'
---

# Bloque de aplicaciones y selector

Además de gestionar subaplicaciones en el panel de administración, la función multiaplicación también puede ofrecer entradas de aplicaciones en el frontend. Las formas habituales son:

- Añadir un bloque "Aplicaciones" a una página para mostrar juntas las subaplicaciones disponibles
- Habilitar el selector de aplicaciones en la esquina superior izquierda para que los usuarios puedan cambiar entre la aplicación principal y las subaplicaciones

## Bloque de aplicaciones

![](https://static-docs.nocobase.com/202605271350840.png)

El bloque "Aplicaciones" muestra una lista de subaplicaciones en una página del frontend. Es adecuado para crear un portal sencillo de aplicaciones, desde el que los usuarios finales pueden entrar en diferentes aplicaciones de negocio.

Cada aplicación del bloque muestra:

- Icono de la aplicación
- Nombre de la aplicación
- Entrada de acceso

Al hacer clic en una aplicación, se abre la subaplicación correspondiente.

### Configurar el icono de la aplicación

Al crear o editar una aplicación en App Supervisor, puede subir un icono de aplicación en "Configuración de visualización".

Si no se sube ningún icono, el sistema genera un icono predeterminado a partir de la primera letra del nombre de la aplicación para facilitar su identificación en la lista.

![](https://static-docs.nocobase.com/202605271402603.png)

### Ocultar aplicaciones

Si una aplicación no debe aparecer en el bloque "Aplicaciones" del frontend, marque "Ocultar en el bloque de aplicaciones" en la configuración de la aplicación.

Después de ocultarla:

- La aplicación aún puede gestionarse en el panel de administración
- La aplicación aún puede abrirse mediante su URL directa
- Simplemente deja de mostrarse en el bloque "Aplicaciones" del frontend

![](https://static-docs.nocobase.com/202605271403980.png)

## Selector de aplicaciones

![](https://static-docs.nocobase.com/202605271403304.png)

El selector de aplicaciones aparece en la esquina superior izquierda y se utiliza para cambiar rápidamente a otras aplicaciones.

Si desea que una aplicación aparezca en el selector, habilite "Mostrar en el selector de aplicaciones" en la configuración de la aplicación.

Una vez habilitado, los usuarios pueden ver el selector en la esquina superior izquierda de la aplicación principal o de las subaplicaciones y entrar en otras aplicaciones desde la lista.

![](https://static-docs.nocobase.com/202605271404322.png)

### Forma de apertura

El selector de aplicaciones abre las aplicaciones de la siguiente manera:

- Desde la aplicación principal a una subaplicación: se abre en una pestaña nueva
- Desde una subaplicación a otra: se abre en la pestaña actual

Así se evita interrumpir el trabajo en la aplicación principal y el cambio entre subaplicaciones resulta más natural.
