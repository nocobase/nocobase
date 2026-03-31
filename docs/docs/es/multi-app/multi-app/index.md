---
pkg: '@nocobase/plugin-app-supervisor'
---

# Gestión multiaplicación

## Resumen

La gestión multiaplicación es una solución unificada de NocoBase para crear y administrar múltiples instancias de aplicaciones NocoBase **físicamente aisladas** en uno o varios entornos de ejecución. Con **AppSupervisor**, puedes administrar varias aplicaciones desde una sola entrada.

## Aplicación única

En etapas tempranas, la mayoría de equipos comienzan con una sola aplicación.

En este modo, solo se despliega una instancia de NocoBase. Toda la lógica de negocio, los datos y los usuarios viven en la misma aplicación. El despliegue es simple y el costo de configuración es bajo.

A medida que el negocio crece, aparecen límites naturales:

- Se acumulan funciones y el sistema se vuelve pesado
- Es difícil aislar dominios de negocio
- El costo de escalado y mantenimiento aumenta

En ese punto, suele ser necesario dividir el negocio en múltiples aplicaciones.

## Multiaplicación en memoria compartida

Si necesitas separar dominios de negocio sin introducir una arquitectura compleja de despliegue y operación, puedes usar el modo de memoria compartida.

En este modo, varias aplicaciones se ejecutan dentro de una sola instancia de NocoBase. Cada aplicación es independiente, puede conectarse a su propia base de datos y puede crearse/iniciarse/detenerse por separado. Sin embargo, comparten el mismo proceso y espacio de memoria.

![](https://static-docs.nocobase.com/202512231055907.png)

Ventajas principales:

- División del negocio por aplicación
- Funciones y configuración más claras entre aplicaciones
- Menor consumo de recursos que enfoques multi-proceso o multi-contenedor

Como todas las aplicaciones comparten proceso, también comparten CPU y memoria. Una falla o alta carga en una aplicación puede impactar a las demás.

Cuando aumenta el número de aplicaciones o se exige más aislamiento y estabilidad, se debe evolucionar la arquitectura.

## Despliegue híbrido multi-entorno

Cuando crecen la escala y la complejidad del negocio, el modo de memoria compartida enfrenta retos de recursos, estabilidad y seguridad. En esa fase, puede adoptarse un **despliegue híbrido multi-entorno**.

La idea central es introducir una **aplicación de entrada**: una instancia de NocoBase funciona como plano de control unificado, mientras varias instancias de NocoBase funcionan como entornos de ejecución que alojan las aplicaciones de negocio.

La aplicación de entrada se encarga de:

- Crear, configurar y gestionar el ciclo de vida de las aplicaciones
- Distribuir comandos de gestión y agregar estados

Los entornos de ejecución se encargan de:

- Alojar y ejecutar aplicaciones de negocio

Desde la perspectiva del usuario, todo sigue gestionándose desde una sola entrada. Internamente:

- Distintas aplicaciones pueden correr en diferentes nodos o clústeres
- Cada aplicación puede tener su propia base de datos y middleware
- Las aplicaciones de alta carga pueden aislarse o escalarse de forma independiente

![](https://static-docs.nocobase.com/202512231215186.png)

Este modelo es adecuado para plataformas SaaS, gran cantidad de entornos demo y escenarios multi-tenant.
