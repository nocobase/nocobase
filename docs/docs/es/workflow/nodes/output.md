---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Salida del Flujo de Trabajo

## Introducción

El nodo "Salida del Flujo de Trabajo" se utiliza en un flujo de trabajo invocado para definir su valor de salida. Cuando un flujo de trabajo es llamado por otro, puede usar el nodo "Salida del Flujo de Trabajo" para pasar un valor de vuelta al flujo de trabajo que lo invocó.

## Crear Nodo

En el flujo de trabajo invocado, añada un nodo "Salida del Flujo de Trabajo":

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Configurar Nodo

### Valor de Salida

Introduzca o seleccione una variable como valor de salida. Este valor puede ser de cualquier tipo: una constante (como una cadena de texto, un número, un valor booleano, una fecha o un JSON personalizado) o cualquier otra variable dentro del flujo de trabajo.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Consejo}
Si añade varios nodos "Salida del Flujo de Trabajo" en un flujo de trabajo invocado, al llamar a dicho flujo de trabajo, se utilizará como salida el valor del último nodo "Salida del Flujo de Trabajo" que se haya ejecutado.
:::