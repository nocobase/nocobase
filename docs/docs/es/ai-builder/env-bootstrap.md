---
title: "Gestión de entornos"
description: "El Skill de gestión de entornos se encarga de la instalación, actualización, parada e inicio de aplicaciones NocoBase, así como de la gestión de varios entornos (desarrollo, pruebas, producción, etc.), desde «aún no se ha instalado NocoBase» hasta «ya se puede iniciar sesión»."
keywords: "Constructor de IA, gestión de entornos, instalación, actualización, Docker"
---

# Gestión de entornos

:::tip Requisitos previos

Antes de leer esta página, asegúrese de haber instalado el NocoBase CLI y de haber completado la inicialización siguiendo la guía de [Inicio rápido del Constructor de IA](./index.md).

:::

## Introducción

El Skill de gestión de entornos se encarga de la instalación, actualización, parada e inicio de aplicaciones NocoBase, así como de la gestión de varios entornos (desarrollo, pruebas, producción, etc.), desde «aún no se ha instalado NocoBase» hasta «ya se puede iniciar sesión».


## Capacidades

- Consultar los entornos de NocoBase y su estado
- Añadir, eliminar y cambiar entre instancias de NocoBase
- Instalación, actualización, parada e inicio de instancias de NocoBase


## Ejemplos de prompts

### Caso A: consulta del estado de los entornos
Modo prompt
```
¿Qué instancias de NocoBase hay actualmente? ¿En qué entorno estoy ahora?
```
Modo línea de comandos
```
nb env list
```

### Caso B: añadir un entorno existente
:::tip Requisitos previos

Es necesario disponer de una instancia de NocoBase, ya sea local o remota.

:::

Modo prompt
```
Ayúdame a añadir el entorno dev http://localhost:13000
```
Modo línea de comandos
```
nb env add <dev> --base-url http://localhost:13000/api
```
### Caso C: instalar una nueva instancia de NocoBase
:::tip Requisitos previos

La forma más rápida y cómoda de instalar NocoBase es mediante el modo Docker. Antes de ejecutar el comando, asegúrese de tener instalados en su equipo los entornos imprescindibles: Node, Docker y Yarn.

:::

Modo prompt
```
Ayúdame a instalar NocoBase
```
Modo línea de comandos
```
nb init --ui
```

### Caso D: actualización de la instancia

Modo prompt
```
Ayúdame a actualizar la instancia actual a la última versión
```
Modo línea de comandos
```
nb upgrade
```

### Caso E: detener la instancia

Modo prompt
```
Ayúdame a detener la instancia actual
```
Modo línea de comandos
```
nb app stop
```

### Caso E: iniciar la instancia

Modo prompt
```
Ayúdame a iniciar la instancia actual
```
Modo línea de comandos
```
nb app start
```

## Preguntas frecuentes

**Tras la instalación, ¿qué hago si no puedo utilizar las capacidades del Constructor de IA?**

Por ahora todas las capacidades del Constructor de IA están disponibles únicamente en la imagen alpha. Compruebe si ha utilizado esa imagen para la instalación; si no es así, puede actualizar a esa imagen.

**¿Qué hago si Docker da un conflicto de puertos al iniciarse?**

Cambie el puerto (por ejemplo, `port=14000`) o detenga primero el proceso que ocupa el puerto 13000. La fase de comprobación previa del Skill avisará proactivamente del conflicto de puertos.

## Enlaces relacionados

- [Visión general del Constructor de IA](./index.md): resumen de todos los Skills del Constructor de IA y formas de instalación
- [NocoBase CLI](../ai/quick-start.md): herramienta de línea de comandos para instalar y gestionar NocoBase
