---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Ramificación Paralela

El nodo de ramificación paralela puede dividir un flujo de trabajo en múltiples ramas. Cada rama puede configurarse con diferentes nodos, y el método de ejecución varía según el modo de la rama. Utilice el nodo de ramificación paralela en escenarios donde necesite ejecutar múltiples acciones simultáneamente.

## Instalación

Es un plugin integrado, por lo que no requiere instalación.

## Crear Nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de más ("+") en el flujo para añadir un nodo de "Ramificación Paralela":

![Añadir Ramificación Paralela](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Después de añadir un nodo de ramificación paralela al flujo de trabajo, se añadirán dos sub-ramas por defecto. También puede añadir más ramas haciendo clic en el botón para añadir ramas. Puede añadir cualquier número de nodos a cada rama. Las ramas innecesarias pueden eliminarse haciendo clic en el botón de eliminar al inicio de la rama.

![Gestionar Ramificaciones Paralelas](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Configuración del Nodo

### Modo de Ramificación

El nodo de ramificación paralela tiene los siguientes tres modos:

- **Todas exitosas**: El flujo de trabajo solo continuará ejecutando los nodos posteriores a las ramas si todas las ramas se ejecutan con éxito. De lo contrario, si alguna rama termina prematuramente, ya sea por fallo, error o cualquier otro estado no exitoso, todo el nodo de ramificación paralela terminará prematuramente con ese estado. También se conoce como "Modo All".
- **Cualquiera exitosa**: El flujo de trabajo continuará ejecutando los nodos posteriores a las ramas tan pronto como cualquier rama se ejecute con éxito. El nodo de ramificación paralela solo terminará prematuramente si todas las ramas terminan prematuramente, ya sea por fallo, error o cualquier otro estado no exitoso. También se conoce como "Modo Any".
- **Cualquiera exitosa o fallida**: El flujo de trabajo continuará ejecutando los nodos posteriores a las ramas tan pronto como cualquier rama se ejecute con éxito. Sin embargo, si algún nodo falla, toda la ramificación paralela terminará prematuramente con ese estado. También se conoce como "Modo Race".

Independientemente del modo, cada rama se ejecutará en orden de izquierda a derecha hasta que se cumplan las condiciones del modo de rama preestablecido, momento en el que continuará con los nodos subsiguientes o saldrá prematuramente.

## Ejemplo

Consulte el ejemplo en [Nodo de Retraso](./delay.md).