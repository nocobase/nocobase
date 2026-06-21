---
title: "Gestión de publicaciones"
description: "Buenas prácticas de publicación: usar control de versiones, multiaplicación, copias de seguridad y migración para publicar entre desarrollo, preproducción y producción."
keywords: "Gestión de publicaciones,Release,despliegue multientorno,control de versiones,multiaplicación,copias de seguridad,migración,NocoBase"
---

# Gestión de publicaciones

## Introducción

La gestión de publicaciones regula cómo una aplicación pasa de desarrollo a producción. No es una operación aislada, sino un proceso repetible, verificable y recuperable.

Mantenga estable la producción. Complete los cambios en desarrollo, valídelos en preproducción y publíquelos después en producción. Conserve los archivos de migración, copias de seguridad, logs de ejecución y resultados de validación para diagnóstico y reversión.

~~~text
Entorno de desarrollo -> Entorno de preproducción -> Entorno de producción
~~~

Desarrollo sirve para configurar y ajustar. Preproducción reproduce restricciones de producción y valida el resultado. Producción atiende el negocio real.

## Modelo de publicación

| Capacidad | Problema que resuelve | Etapa |
| --- | --- | --- |
| Control de versiones | Guarda hitos de desarrollo y puntos de recuperación | Desarrollo |
| Variables y secretos | Aísla configuración y datos sensibles por entorno | Desarrollo, preproducción y producción |
| Multiaplicación | Divide límites por módulo de negocio | Arquitectura y colaboración |
| Copias de seguridad | Conserva un estado recuperable de producción | Antes de publicar y operación diaria |
| Gestión de migraciones | Publica configuración y estructura al entorno destino | Preproducción y producción |

## Configuración del entorno: usar variables y secretos

Use variables y secretos diferentes en desarrollo, preproducción y producción. Conexiones de base de datos, URLs de servicios externos, cuentas de prueba, tokens, API Keys y Webhooks no deben quedar escritos en páginas, workflows ni configuración de plugins. Al migrar, complete solo los valores que falten en el entorno destino.

Documentación relacionada: [Variables y secretos](../variables-and-secrets/index.md).

## Etapa de desarrollo: registrar puntos recuperables

Use control de versiones para guardar puntos importantes. Cree una versión antes de cambios grandes y otra después de modificar modelos, páginas, permisos, workflows o plugins. Escriba descripciones con significado de negocio.

El control de versiones sirve principalmente al desarrollo. En la publicación, sincronice cambios mediante migración. Para recuperar producción, use copias de seguridad.

Documentación relacionada: [Control de versiones](../version-control/index.md).

## División modular: controlar límites de publicación

Los sistemas pequeños pueden empezar con una sola aplicación. Cuando aumentan páginas, tablas, permisos y workflows, una publicación puede afectar a varios equipos. En ese caso, divida por módulos con multiaplicación: CRM, tickets, activos, HR, reportes u operaciones.

Planifique usuarios, organizaciones, autenticación, permisos y datos compartidos antes de dividir. Los límites claros reducen el impacto de cada publicación.

~~~text
CRM: Desarrollo -> Preproducción -> Producción
Tickets: Desarrollo -> Preproducción -> Producción
Activos: Desarrollo -> Preproducción -> Producción
~~~

Documentación relacionada: [Gestión multiaplicación](../../multi-app/multi-app/index.md).

## Preparación previa: confirmar recuperación

Antes de publicar en producción, cree una copia de seguridad. En publicaciones importantes, pruebe la restauración en un entorno independiente. La copia debe cubrir base de datos, archivos subidos y contenido de storage necesario para ejecutar la aplicación.

Documentación relacionada: [Gestión de copias de seguridad](../backup-manager/index.mdx).

## Ejecución: migrar al entorno destino

La gestión de migraciones publica configuración, estructuras de tablas, configuración de plugins y algunos datos necesarios. Publique primero en preproducción; si la validación pasa, use el mismo archivo para producción.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

### Publicar en preproducción

Ejecute allí el archivo generado desde desarrollo. Preproducción debe acercarse a producción en versión del núcleo, plugins, variables, secretos, permisos y conexiones externas. Valide páginas principales, permisos, workflows e integraciones.

### Publicar en producción

Reserve una ventana de mantenimiento, avise a los usuarios y detenga el acceso o muestre una página de mantenimiento. En despliegues multi-nodo, reduzca a un nodo antes de migrar. Tras la migración, valide procesos principales y restaure el acceso.

### Reglas de migración

Las reglas habituales son sobrescribir, solo estructura y omitir. Las tablas integradas de aplicación y plugins suelen seguir la estrategia predeterminada y usar sobrescritura. Las tablas definidas por el usuario con datos de negocio suelen usar solo estructura. Si guardan metadatos como configuraciones, categorías, plantillas o reglas, evalúe sobrescribir según el caso.

Consulte: [Tablas integradas de aplicaciones y plugins principales](../migration-manager/built-in-tables.md).

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

La migración trata principalmente la base de datos principal. Fuentes externas, datos de subaplicaciones y algunos directorios de storage deben gestionarse aparte.

Documentación relacionada: [Gestión de migraciones](../migration-manager/index.md).

## Reversión y recuperación

Si falla una publicación, use primero la copia previa mediante Backup Manager. Si la producción aún puede acceder a Backup Manager y solo falló la migración, restaure en el entorno actual. Si el entorno está inestable, restaure en un entorno independiente, valide procesos principales y cambie el tráfico.

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)

## Documentación relacionada

- [Variables y secretos](../variables-and-secrets/index.md)
- [Control de versiones](../version-control/index.md)
- [Gestión multiaplicación](../../multi-app/multi-app/index.md)
- [Gestión de copias de seguridad](../backup-manager/index.mdx)
- [Gestión de migraciones](../migration-manager/index.md)
