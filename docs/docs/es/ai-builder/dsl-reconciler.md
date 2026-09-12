---
title: "Soluciones"
description: "El Skill de soluciones sirve para construir aplicaciones de NocoBase de forma masiva a partir de archivos de configuración YAML."
keywords: "Constructor de IA, soluciones, construcción de aplicaciones, YAML, creación masiva de tablas, dashboards"
---

# Soluciones

:::tip Requisitos previos

Antes de leer esta página, asegúrese de haber instalado el NocoBase CLI y de haber completado la inicialización siguiendo la guía de [Inicio rápido del Constructor de IA](./index.md).

:::

:::warning Atención

La función de soluciones se encuentra todavía en fase de pruebas, su estabilidad es limitada y se ofrece únicamente para una experiencia preliminar.

:::

## Introducción

El Skill de soluciones sirve para construir aplicaciones de NocoBase de forma masiva a partir de archivos de configuración YAML: crea tablas, configura páginas y genera dashboards y gráficos en un solo paso.

Es adecuado para escenarios en los que se necesita construir rápidamente un sistema de negocio completo, como CRM, gestión de tickets o sistemas de inventario.


## Capacidades

Lo que puede hacer:

- Diseñar la solución completa de la aplicación a partir de la descripción de los requisitos, incluyendo tablas, páginas y dashboards
- Crear tablas y páginas de forma masiva mediante `structure.yaml`
- Configurar ventanas emergentes y formularios mediante `enhance.yaml`
- Generar dashboards automáticamente, con tarjetas KPI y gráficos
- Actualización incremental: utiliza siempre el modo `--force` y no destruye los datos existentes

Lo que no puede hacer:

- No es adecuado para ajustar campos uno a uno (para ello es más apropiado el [Skill de modelado de datos](./data-modeling))
- No realiza migración ni importación de datos
- No configura permisos ni flujos de trabajo (necesita combinarse con otros Skills)

## Ejemplos de prompts

### Caso A: construir un sistema completo

```
Ayúdame a construir un sistema de gestión de tickets con la skill nocobase-dsl-reconciler, que incluya dashboard, lista de tickets, gestión de usuarios y configuración de SLA
```

El Skill mostrará primero la solución de diseño, enumerando todas las tablas y la estructura de páginas; tras la confirmación, ejecutará la construcción por rondas.

![Solución de diseño](https://static-docs.nocobase.com/20260420100420.png)

![Resultado de la construcción](https://static-docs.nocobase.com/20260420100450.png)

### Caso B: modificar un módulo existente

```
Ayúdame con la skill nocobase-dsl-reconciler a añadir en la tabla de tickets un campo desplegable «Nivel de urgencia» con las opciones P0 a P3
```

Modifique `structure.yaml` y, a continuación, actualice con `--force`.

### Caso C: gráfico personalizado

```
Ayúdame con la skill nocobase-dsl-reconciler a cambiar en el dashboard «Tickets nuevos de esta semana» por «Tickets nuevos de este mes»
```

![Gráfico personalizado](https://static-docs.nocobase.com/20260420100517.png)

Edite el archivo SQL correspondiente, cambie el rango temporal de `'7 days'` a `'1 month'` y, a continuación, ejecute `--verify-sql` para validarlo.

## Preguntas frecuentes

**¿Qué hago si la verificación de SQL falla?**

NocoBase utiliza PostgreSQL: los nombres de columna deben escribirse en camelCase y entre comillas dobles (por ejemplo, `"createdAt"`), y las funciones de fecha deben usar `NOW() - '7 days'::interval` en lugar de la sintaxis de SQLite. Ejecutar `--verify-sql` permite detectar este tipo de problemas antes del despliegue.

**¿Qué hago si después de construir el sistema necesito ajustar un campo concreto?**

Para construir todo el sistema utilice el Skill de soluciones; para los ajustes posteriores, son más flexibles el [Skill de modelado de datos](./data-modeling) o el [Skill de configuración de la interfaz](./ui-builder).

## Enlaces relacionados

- [Visión general del Constructor de IA](./index.md): resumen de todos los Skills del Constructor de IA y formas de instalación
- [Modelado de datos](./data-modeling): para ajustes campo a campo, utilice el Skill de modelado de datos
- [Configuración de la interfaz](./ui-builder): ajuste el diseño de páginas y bloques tras la construcción
