:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# ¿Qué es FlowEngine?

FlowEngine es el nuevo motor de desarrollo front-end sin código y de bajo código presentado en NocoBase 2.0. Combina modelos (Model) con flujos (Flow) para simplificar la lógica front-end y mejorar la reutilización y la mantenibilidad. Al mismo tiempo, al aprovechar la naturaleza configurable de Flow, proporciona capacidades de configuración y orquestación sin código para los componentes front-end y la lógica de negocio.

## ¿Por qué se llama FlowEngine?

Porque en FlowEngine, las propiedades y la lógica de los componentes ya no se definen estáticamente, sino que son impulsadas y gestionadas por un **flujo (Flow)**.

*   **Flow**, como un flujo de datos, descompone la lógica en pasos (Step) ordenados y los aplica al componente de forma secuencial.
*   **Engine** significa que es un motor que impulsa la lógica y las interacciones front-end.

Por lo tanto, **FlowEngine = Un motor de lógica front-end impulsado por flujos**.

## ¿Qué es un Model?

En FlowEngine, un Model es un modelo abstracto de un componente, responsable de:

*   Gestionar las **propiedades (Props) y el estado** del componente.
*   Definir el **método de renderizado** del componente.
*   Alojar y ejecutar el **Flow**.
*   Manejar de forma unificada la **distribución de eventos** y los **ciclos de vida**.

En otras palabras, **el Model es el cerebro lógico del componente**, convirtiéndolo de un elemento estático en una unidad dinámica configurable y orquestable.

## ¿Qué es un Flow?

En FlowEngine, un **Flow es un flujo lógico que sirve al Model**.
Su propósito es:

*   Descomponer la lógica de propiedades o eventos en pasos (Step) y ejecutarlos secuencialmente como un flujo.
*   Gestionar los cambios de propiedades, así como las respuestas a eventos.
*   Hacer que la lógica sea **dinámica, configurable y reutilizable**.

## ¿Cómo entender estos conceptos?

Puede imaginar un **Flow** como un **flujo de agua**:

*   **Un Step es como un nodo en el camino del flujo de agua**
    Cada Step realiza una pequeña tarea (por ejemplo, establecer una propiedad, activar un evento, llamar a una API), así como el agua tiene un efecto al pasar por una compuerta o una noria.

*   **El flujo es ordenado**
    El agua fluye por un camino predeterminado de aguas arriba a aguas abajo, pasando por todos los Steps en secuencia; de manera similar, la lógica en un Flow se ejecuta en el orden definido.

*   **El flujo puede ramificarse y combinarse**
    Un flujo de agua puede dividirse en múltiples arroyos más pequeños o unirse; un Flow también puede dividirse en múltiples subflujos o combinarse en cadenas lógicas más complejas.

*   **El flujo es configurable y controlable**
    La dirección y el volumen de un flujo de agua se pueden ajustar con una compuerta; el método de ejecución y los parámetros de un Flow también se pueden controlar mediante la configuración (stepParams).

Resumen de la analogía

*   Un **componente** es como una noria que necesita un flujo de agua para girar.
*   El **Model** es la base y el controlador de esta noria, responsable de recibir el agua e impulsar su funcionamiento.
*   El **Flow** es ese flujo de agua que pasa por cada Step en orden, haciendo que el componente cambie y responda continuamente.

Así, en FlowEngine:

*   **Flow** permite que la lógica se mueva naturalmente como un flujo de agua.
*   El **Model** convierte al componente en el portador y ejecutor de este flujo.