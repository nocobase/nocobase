:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Bifurcación de múltiples condiciones <Badge>v2.0.0+</Badge>

## Introducción

Funciona de manera similar a las sentencias `switch / case` o `if / else if` en lenguajes de programación. El sistema evaluará las múltiples condiciones configuradas de forma secuencial. Una vez que se cumpla una condición, se ejecutará el flujo correspondiente a esa rama y se omitirán las comprobaciones de las condiciones siguientes. Si ninguna condición se cumple, se ejecutará la rama "De lo contrario".

## Crear un nodo

En la interfaz de configuración del flujo de trabajo, haga clic en el botón de signo más ("+") en el flujo para añadir un nodo de "Bifurcación de múltiples condiciones":

![Crear nodo de bifurcación de múltiples condiciones](https://static-docs.nocobase.com/20251123222134.png)

## Gestión de ramas

### Ramas predeterminadas

Después de crear el nodo, este incluye dos ramas de forma predeterminada:

1.  **Rama de condición**: Para configurar condiciones de evaluación específicas.
2.  **Rama "De lo contrario"**: Se activa cuando ninguna de las ramas de condición se cumple; no requiere configuración de condiciones.

Haga clic en el botón "Añadir rama" debajo del nodo para añadir más ramas de condición.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Añadir rama

Después de hacer clic en "Añadir rama", la nueva rama se añadirá antes de la rama "De lo contrario".

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Eliminar rama

Cuando existan varias ramas de condición, haga clic en el icono de la papelera a la derecha de una rama para eliminarla. Si solo queda una rama de condición, no podrá eliminarla.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Nota}
Al eliminar una rama, también se eliminarán todos los nodos que contenga; proceda con precaución.

La rama "De lo contrario" es una rama integrada y no se puede eliminar.
:::

## Configuración del nodo

### Configuración de condiciones

Haga clic en el nombre de la condición en la parte superior de una rama para editar los detalles específicos de la condición:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Etiqueta de condición

Admite etiquetas personalizadas. Una vez rellenada, se mostrará como el nombre de la condición en el diagrama de flujo. Si no se configura (o se deja en blanco), se mostrará por defecto como "Condición 1", "Condición 2", etc., en secuencia.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Motor de cálculo

Actualmente, se admiten tres motores:

-   **Básico**: Utiliza comparaciones lógicas simples (por ejemplo, igual a, contiene) y combinaciones "Y"/"O" para determinar los resultados.
-   **Math.js**: Admite el cálculo de expresiones utilizando la sintaxis de [Math.js](https://mathjs.org/).
-   **Formula.js**: Admite el cálculo de expresiones utilizando la sintaxis de [Formula.js](https://formulajs.info/) (similar a las fórmulas de Excel).

Los tres modos admiten el uso de variables de contexto del flujo de trabajo como parámetros.

### Cuando ninguna condición se cumple

En el panel de configuración del nodo, puede establecer la acción a seguir cuando ninguna condición se cumple:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Terminar el flujo de trabajo con error (predeterminado)**: Marca el estado del flujo de trabajo como fallido y termina el proceso.
*   **Continuar ejecutando nodos posteriores**: Después de que el nodo actual finalice, continúa ejecutando los nodos posteriores en el flujo de trabajo.

:::info{title=Nota}
Independientemente del método de manejo elegido, cuando ninguna condición se cumple, el flujo entrará primero en la rama "De lo contrario" para ejecutar los nodos que contiene.
:::

## Historial de ejecución

En el historial de ejecución del flujo de trabajo, el nodo de bifurcación de múltiples condiciones identifica el resultado de cada condición utilizando diferentes colores:

-   **Verde**: Condición cumplida; se entró en esta rama.
-   **Rojo**: Condición no cumplida (o error de cálculo); se omitió esta rama.
-   **Azul**: Evaluación no ejecutada (se omitió porque una condición anterior ya se había cumplido).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Si un error de configuración provoca una excepción en el cálculo de la condición, además de mostrarse en rojo, al pasar el ratón sobre el nombre de la condición se mostrará información específica del error:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Cuando se produce una excepción en el cálculo de una condición, el nodo de bifurcación de múltiples condiciones finalizará con un estado de "Error" y no continuará ejecutando los nodos posteriores.