---
title: "Gestión de plugins"
description: "El Skill de gestión de plugins sirve para consultar, activar y desactivar plugins de NocoBase."
keywords: "Constructor de IA, gestión de plugins, activación de plugins, desactivación de plugins"
---

# Gestión de plugins

:::tip Requisitos previos

Antes de leer esta página, asegúrese de haber instalado el NocoBase CLI y de haber completado la inicialización siguiendo la guía de [Inicio rápido del Constructor de IA](./index.md).

:::

## Introducción

El Skill de gestión de plugins sirve para consultar, activar y desactivar plugins de NocoBase: identifica automáticamente si el entorno es local o remoto, selecciona el backend de ejecución adecuado y, mediante una verificación de relectura, garantiza que la operación se haya realizado correctamente.


## Capacidades

- Consultar el catálogo de plugins y su estado de activación.
- Activar plugins.
- Desactivar plugins.

## Ejemplos de prompts

### Caso A: consultar el estado de los plugins

Modo prompt
```
Qué plugins tiene el entorno actual
```
Modo línea de comandos
```
nb plugin list
```

Se mostrarán todos los plugins con su estado de activación y la información de versión.

![Consultar el estado de los plugins](https://static-docs.nocobase.com/20260417150510.png)

### Caso B: activar un plugin

Modo prompt
```
Ayúdame a activar el plugin de localización
```
Modo línea de comandos
```
nb plugin enable <localización>
```

El Skill activa los plugins en orden y, tras cada activación, los vuelve a leer para confirmar que `enabled=true`.

![Activar un plugin](https://static-docs.nocobase.com/20260417153023.png)

### Caso C: desactivar un plugin

Modo prompt
```
Ayúdame a desactivar el plugin de localización
```
Modo línea de comandos
```
nb plugin disable  <localización>
```

![Desactivar un plugin](https://static-docs.nocobase.com/20260417173442.png)

## Preguntas frecuentes

**¿Qué hago si tras activar un plugin no surte efecto?**

Algunos plugins requieren reiniciar la aplicación después de su activación para que surtan efecto. El Skill indicará en el resultado si es necesario reiniciar.

## Enlaces relacionados

- [Visión general del Constructor de IA](./index.md): resumen de todos los Skills del Constructor de IA y formas de instalación
- [NocoBase CLI](../ai/quick-start.md): herramienta de línea de comandos para instalar y gestionar NocoBase
