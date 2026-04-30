---
title: "Gestión de publicación"
description: "El Skill de gestión de publicación sirve para realizar operaciones de publicación auditable entre varios entornos."
keywords: "Constructor de IA, gestión de publicación, publicación entre entornos, copia de seguridad y restauración, migración"
---

# Gestión de publicación

:::tip Requisitos previos

- Antes de leer esta página, asegúrese de haber instalado el NocoBase CLI y de haber completado la inicialización siguiendo la guía de [Inicio rápido del Constructor de IA](./index.md).
- Es necesario disponer de una licencia de la edición Profesional o superior de [NocoBase Edición Comercial](https://www.nocobase.com/cn/commercial).
- Asegúrese de haber activado los plugins de gestión de copias de seguridad y de gestión de migración y de haberlos actualizado a la última versión.

:::

:::warning Atención
La CLI relacionada con la gestión de publicación está aún en desarrollo y, por el momento, no se admite su uso.
:::
## Introducción

El Skill de gestión de publicación sirve para ejecutar operaciones de publicación entre varios entornos; admite dos modos de publicación: copia de seguridad y restauración, y migración.


## Capacidades

- Restauración con copia de seguridad en un solo entorno: restaura totalmente los datos locales utilizando un paquete de copia de seguridad.
- Restauración con copia de seguridad entre entornos: restaura totalmente los datos del entorno de destino utilizando un paquete de copia de seguridad.
- Migración entre entornos: utiliza un paquete de migración recién creado para actualizar de forma diferencial los datos del entorno de destino.

## Ejemplos de prompts

### Caso A: restauración con copia de seguridad en un solo entorno
:::tip Requisitos previos

El entorno actual debe disponer de un paquete de copia de seguridad, o bien debe realizar primero la copia y después la restauración.

:::

Modo prompt
```
Restaura usando <file-name>
```
Modo línea de comandos
```
// Consulta los paquetes de copia de seguridad disponibles; si no hay ninguno, ejecuta nb backup <file-name>
nb backup list 
nb restore <file-name> 
```
![Restauración con copia de seguridad](https://static-docs.nocobase.com/20260417150854.png)

### Caso B: restauración con copia de seguridad entre entornos

:::tip Requisitos previos

Es necesario disponer de dos entornos, por ejemplo, un entorno dev local y un entorno test remoto, o bien dos entornos instalados localmente.

:::

Modo prompt
```
Restaura dev en test
```
Modo línea de comandos
```
// Consulta los paquetes de copia de seguridad disponibles; si no hay ninguno, ejecuta nb backup <file-name> --env dev
nb backup list --env dev
// Restaura usando el paquete de copia de seguridad
nb restore <file-name> --env test
```
![Restauración con copia de seguridad](https://static-docs.nocobase.com/20260417150854.png)

### Caso C: migración entre entornos

:::tip Requisitos previos

De forma similar al caso B, es necesario disponer de dos entornos, por ejemplo, un entorno dev local y un entorno test remoto, o bien dos entornos instalados localmente.

:::

Modo prompt
```
Migra dev a test
```
Modo línea de comandos
```
// Crea una nueva regla de migración, que generará un nuevo ruleId; o bien, con nb migration rule list --env dev, obtén un ruleId histórico
nb migration rule add --env dev 
// Genera el paquete de migración con el ruleId
nb migration generate <ruleId> --env dev 
// Realiza la migración con el paquete generado
nb migration run <file-name> --env test
```
![Publicación por migración](https://static-docs.nocobase.com/20260417151022.png)

## Preguntas frecuentes

**¿Qué debo elegir, copia de seguridad o migración?**

Si ya dispone de un paquete de copia de seguridad utilizable, elija la restauración con copia de seguridad. Si necesita controlar mediante una política qué datos se sincronizan (por ejemplo, sincronizar solo la estructura sin los datos), elija la migración.

**¿A qué se debe que no aparezca el plugin de migración?**

El plugin de gestión de migración requiere la edición Profesional o superior; consulte [NocoBase Edición Comercial](https://www.nocobase.com/cn/commercial).

## Enlaces relacionados

- [Visión general del Constructor de IA](./index.md): resumen de todos los Skills del Constructor de IA y formas de instalación
- [Gestión de entornos](./env-bootstrap): comprobación del entorno, instalación, despliegue y diagnóstico de fallos
