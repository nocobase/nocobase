---
title: "Multiportal"
description: "Conozca el concepto, los casos de uso, la configuración y la relación entre Multiportal, Multiaplicación y Multiespacio en NocoBase."
keywords: "espacio de trabajo, portal, multiportal, NocoBase"
pkg: "@nocobase/plugin-multi-portal"
---

# Multiportal

## Qué es un portal

Un portal se utiliza para ofrecer múltiples entradas de acceso dentro de la misma aplicación.

Cada portal puede tener de forma independiente:

- Páginas
- Menús
- Estructura de navegación
- Diseño
- Configuración de permisos

El plugin Multiportal ofrece las siguientes capacidades:

- Gestión de portales
- Cambio de portal
- Control de permisos del portal

Con estas capacidades, puede ofrecer experiencias diferenciadas para distintos roles compartiendo los mismos datos y capacidades de negocio.

## Por qué se necesitan portales

En escenarios de negocio reales, distintos roles suelen necesitar interfaces diferentes.

Por ejemplo, en un sistema de gestión minorista:

```text
Sistema de gestión minorista

├─ Portal de la sede
├─ Portal de tienda
├─ Portal de distribuidor
└─ Portal móvil
```

El personal de la sede se enfoca en:

- Gestión de productos
- Gestión de inventario
- Análisis de datos

El personal de tienda se enfoca en:

- Cobro
- Conteo de inventario
- Procesamiento de pedidos

Los distribuidores se enfocan en:

- Compras
- Conciliación
- Estado de envío

Aunque todos usan el mismo sistema, no todos los roles necesitan ver los mismos menús y páginas.

Ese es precisamente el problema que resuelven los portales.

## Relación entre portales y menús

Cada portal tiene su propio árbol de menús.

Los menús de distintos portales no se afectan entre sí.

Por ejemplo:

```text
Portal de la sede
├─ Gestión de productos
├─ Gestión de la cadena de suministro
└─ Análisis de datos

Portal de tienda
├─ Cobro
├─ Gestión de pedidos
└─ Conteo de inventario
```

## Relación entre portales y páginas

Las páginas pertenecen a sus respectivos portales.

La misma página también puede mostrarse solo en portales específicos.

Esto permite diseñar flujos de trabajo completamente distintos para distintos roles.

## Relación entre portales y permisos

Los propios portales pueden configurarse con permisos de acceso.

Solo los usuarios autorizados pueden acceder al portal correspondiente.

Los portales no autorizados:

- No aparecen en la lista del selector
- No pueden accederse directamente

## Gestión de portales

Después de habilitar el plugin Multiportal, el sistema proporciona por defecto dos portales integrados:

| Portal | Ruta | Propósito |
|----------|----------|----------|
| Desktop | `/v/admin` | Entrada de escritorio |
| Mobile | `/v/mobile` | Entrada móvil |

### Portales integrados

![2026-07-10-08-01-50](https://static-docs.nocobase.com/2026-07-10-08-01-50.png)

### Portal de escritorio

Ruta de acceso:

```text
/v/admin
```

![2026-07-10-08-03-12](https://static-docs.nocobase.com/2026-07-10-08-03-12.png)

### Portal móvil

Ruta de acceso:

```text
/v/mobile
```

![2026-07-10-08-04-59](https://static-docs.nocobase.com/2026-07-10-08-04-59.png)

## Crear un portal

Además de los portales integrados, puede crear más portales según las necesidades del negocio.

Por ejemplo:

- Portal de tienda
- Portal de distribuidor
- Portal de atención al cliente
- Portal de análisis de datos

Después de crearlo, puede configurar:

- Páginas
- Menús
- Permisos
- Navegación

![2026-07-10-08-06-15](https://static-docs.nocobase.com/2026-07-10-08-06-15.png)

## Cambiar de portal

Los usuarios pueden cambiar rápidamente entre portales mediante el selector de portales.

### Cambiar de portal dentro de una sola aplicación

Añádalo al panel del selector de portales en la esquina superior izquierda

![2026-07-10-08-20-41](https://static-docs.nocobase.com/2026-07-10-08-20-41.png)

Añádalo al bloque del panel de acciones

![2026-07-10-08-21-15](https://static-docs.nocobase.com/2026-07-10-08-21-15.png)

### Cambiar de portal entre aplicaciones

Después de habilitar Multiaplicación y configurar SSO, los usuarios también pueden cambiar entre portales de distintas aplicaciones mediante el selector de portales.

Añádalo al panel del selector de portales en la esquina superior izquierda

![2026-07-10-08-25-19](https://static-docs.nocobase.com/2026-07-10-08-25-19.png)

Añádalo al bloque del panel de acciones

![2026-07-10-08-25-50](https://static-docs.nocobase.com/2026-07-10-08-25-50.png)

## Permisos del portal

Puede controlar a qué portales puede acceder un usuario mediante permisos de rol.

Los portales no autorizados no aparecen en la lista del selector de portales y los usuarios no pueden acceder directamente a esas entradas.

![2026-07-10-08-29-22](https://static-docs.nocobase.com/2026-07-10-08-29-22.png)

## Enlaces relacionados

Para ver las diferencias y las formas de combinación entre Multiportal, Multiaplicación y Multiespacio, consulte: [Multiaplicación vs Multiportal vs Multiespacio](../multi-app-vs-multi-portal-vs-multi-space.md).
