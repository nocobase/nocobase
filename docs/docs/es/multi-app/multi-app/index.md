---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/multi-app/multi-app/index).
:::

# Gestión multiaplicación

## Resumen de funciones

La gestión multiaplicación es la solución de gestión de aplicaciones unificada proporcionada por NocoBase para crear y gestionar múltiples instancias de aplicaciones NocoBase físicamente aisladas en uno o más entornos de ejecución. A través del regulador de aplicaciones (AppSupervisor), usted puede crear y mantener múltiples aplicaciones desde un punto de entrada unificado para satisfacer las necesidades de diferentes negocios y etapas de escala.

## Aplicación única

En las etapas iniciales de un proyecto, la mayoría de los usuarios comienzan con una sola aplicación.

En este modo, el sistema solo necesita desplegar una instancia de NocoBase, y todas las funciones de negocio, datos y usuarios se ejecutan en la misma aplicación. El despliegue es sencillo y el costo de configuración es bajo, lo que lo hace ideal para la validación de prototipos, proyectos pequeños o herramientas internas.

Sin embargo, a medida que el negocio se vuelve más complejo, una sola aplicación enfrenta algunas limitaciones naturales:

- Las funciones se acumulan continuamente, haciendo que el sistema se vuelva pesado.
- Es difícil aislar diferentes negocios entre sí.
- El costo de expansión y mantenimiento de la aplicación sigue aumentando.

En este punto, los usuarios desearán dividir los diferentes negocios en múltiples aplicaciones para mejorar la mantenibilidad y escalabilidad del sistema.

## Multiaplicación de memoria compartida

Cuando usted desee dividir el negocio pero no quiera introducir una arquitectura de despliegue y operación compleja, puede actualizar al modo de multiaplicación de memoria compartida.

En este modo, se pueden ejecutar simultáneamente múltiples aplicaciones en una sola instancia de NocoBase. Cada aplicación es independiente, puede conectarse a una base de datos independiente y puede crearse, iniciarse y detenerse por separado, pero comparten el mismo proceso y espacio de memoria; usted solo necesita mantener una instancia de NocoBase.

![](https://static-docs.nocobase.com/202512231055907.png)

Este enfoque aporta mejoras significativas:

- El negocio se puede dividir por la dimensión de la aplicación.
- Las funciones y configuraciones entre aplicaciones son más claras.
- En comparación con las soluciones de múltiples procesos o múltiples contenedores, el consumo de recursos es menor.

Sin embargo, debido a que todas las aplicaciones se ejecutan en el mismo proceso, comparten recursos como la CPU y la memoria. Una anomalía o una carga elevada en una sola aplicación puede afectar la estabilidad de otras aplicaciones.

Cuando el número de aplicaciones sigue aumentando, o cuando se plantean mayores requisitos de aislamiento y estabilidad, es necesario actualizar aún más la arquitectura.

## Despliegue híbrido multientorno

Cuando la escala y la complejidad del negocio alcanzan un cierto nivel y el número de aplicaciones necesita expandirse a gran escala, el modo de multiaplicación de memoria compartida enfrentará desafíos como la competencia por los recursos, la estabilidad y la seguridad. En la etapa de escalamiento, usted puede considerar adoptar un método de despliegue híbrido multientorno para soportar escenarios de negocio más complejos.

El núcleo de esta arquitectura es la introducción de una aplicación de entrada, es decir, desplegar un NocoBase como centro de gestión unificado, mientras se despliegan múltiples NocoBase como entornos de ejecución de aplicaciones para ejecutar realmente las aplicaciones de negocio.

La aplicación de entrada es responsable de:

- La creación, configuración y gestión del ciclo de vida de las aplicaciones.
- El envío de comandos de gestión y el resumen de estados.

El entorno de la aplicación de instancia es responsable de:

- Alojar y ejecutar realmente las aplicaciones de negocio a través del modo de multiaplicación de memoria compartida.

Para el usuario, todavía se pueden crear y gestionar múltiples aplicaciones a través de una sola entrada, pero internamente:

- Diferentes aplicaciones pueden ejecutarse en diferentes nodos o clústeres.
- Cada aplicación puede utilizar bases de datos y middleware independientes.
- Se pueden ampliar o aislar las aplicaciones de alta carga según sea necesario.

![](https://static-docs.nocobase.com/202512231215186.png)

Este método es adecuado para plataformas SaaS, una gran cantidad de entornos de demostración o escenarios multi-inquilino, mejorando la estabilidad y la capacidad de mantenimiento del sistema al tiempo que garantiza la flexibilidad.