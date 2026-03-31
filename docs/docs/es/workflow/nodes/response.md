---
pkg: "@nocobase/plugin-workflow-response-message"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Respuesta HTTP

## Introducción

Este nodo solo se admite en flujos de trabajo de Webhook síncronos y se utiliza para devolver una respuesta a un sistema de terceros. Por ejemplo, durante el procesamiento de una devolución de llamada de pago, si el proceso de negocio tiene un resultado inesperado (como un error o un fallo), puede usar el nodo de respuesta para devolver una respuesta de error al sistema de terceros, de modo que algunos sistemas de terceros puedan reintentarlo más tarde basándose en el estado.

Además, la ejecución del nodo de respuesta finalizará la ejecución del flujo de trabajo, y los nodos posteriores no se ejecutarán. Si no se configura ningún nodo de respuesta en todo el flujo de trabajo, el sistema responderá automáticamente según el estado de ejecución del flujo: devolviendo `200` para una ejecución exitosa y `500` para una ejecución fallida.

## Crear un nodo de respuesta

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ("+") en el flujo para añadir un nodo de "Respuesta":

![20241210115120](https://static-docs.nocobase.com/20241210115120.png)

## Configuración de la respuesta

![20241210115500](https://static-docs.nocobase.com/20241210115500.png)

Puede usar variables del contexto del flujo de trabajo en el cuerpo de la respuesta.