---
pkg: '@nocobase/plugin-workflow'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Visión general

## Introducción

El plugin de flujo de trabajo le ayuda a orquestar procesos de negocio automatizados en NocoBase, como aprobaciones diarias, sincronización de datos, recordatorios y otras tareas. En un flujo de trabajo, puede implementar lógica de negocio compleja simplemente configurando disparadores y nodos relacionados a través de una interfaz visual, sin necesidad de escribir código.

### Ejemplo

Cada flujo de trabajo se orquesta con un disparador y varios nodos. El disparador representa un evento en el sistema, y cada nodo representa un paso de ejecución. Juntos, describen la lógica de negocio que se procesará después de que ocurra el evento. La siguiente imagen muestra un proceso típico de deducción de inventario después de que se realiza un pedido de producto:

![Ejemplo de flujo de trabajo](https://static-docs.nocobase.com/20251029222146.png)

Cuando un usuario envía un pedido, el flujo de trabajo verifica automáticamente el inventario. Si el inventario es suficiente, deduce el stock y procede con la creación del pedido; de lo contrario, el proceso finaliza.

### Casos de uso

Desde una perspectiva más general, los flujos de trabajo en las aplicaciones de NocoBase pueden resolver problemas en diversos escenarios:

-   **Automatizar tareas repetitivas:** Las revisiones de pedidos, la sincronización de inventario, la limpieza de datos, los cálculos de puntuación, etc., ya no requieren operación manual.
-   **Apoyar la colaboración humano-máquina:** Organizar aprobaciones o revisiones en nodos clave y continuar con los pasos subsiguientes basándose en los resultados.
-   **Conectar a sistemas externos:** Enviar solicitudes HTTP, recibir notificaciones de servicios externos y lograr la automatización entre sistemas.
-   **Adaptarse rápidamente a los cambios del negocio:** Ajustar la estructura del proceso, las condiciones u otras configuraciones de nodos, y salir a producción sin una nueva versión.

## Instalación

El flujo de trabajo es un plugin integrado de NocoBase. No requiere instalación ni configuración adicional.

## Más información

-   [Inicio rápido](./getting-started)
-   [Disparadores](./triggers/index)
-   [Nodos](./nodes/index)
-   [Uso de variables](./advanced/variables)
-   [Ejecuciones](./advanced/executions)
-   [Gestión de versiones](./advanced/revisions)
-   [Configuración avanzada](./advanced/options)
-   [Desarrollo de extensiones](./development/index)