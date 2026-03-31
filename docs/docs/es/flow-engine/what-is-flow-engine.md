:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# ¿Qué es FlowEngine?

FlowEngine es un motor de desarrollo de front-end sin código/de bajo código recién lanzado en NocoBase 2.0. Combina los Modelos (Model) con los Flujos (Flow) para simplificar la lógica del front-end y mejorar la reutilización y la mantenibilidad. Al mismo tiempo, aprovecha la capacidad de configuración de los Flujos para proporcionar capacidades de configuración y orquestación sin código para los componentes de front-end y la lógica de negocio.

## ¿Por qué se llama FlowEngine?

Porque en FlowEngine, las propiedades y la lógica de un componente ya no se definen de forma estática, sino que son impulsadas y gestionadas por **Flujos (Flow)**.

*   Un **Flow**, como un flujo de datos, descompone la lógica en pasos (Step) ordenados que se aplican progresivamente al componente.
*   **Engine** (motor) significa que es un motor que impulsa la lógica y las interacciones del front-end.

Por lo tanto, **FlowEngine = Un motor de lógica de front-end impulsado por Flujos**.

## ¿Qué es un Modelo?

En FlowEngine, un Modelo es un modelo abstracto de un componente, responsable de:

*   Gestionar las **propiedades (Props) y el estado** del componente.
*   Definir el **método de renderizado** del componente.
*   Alojar y ejecutar **Flujos**.
*   Manejar de forma unificada el **despacho de eventos** y los **ciclos de vida**.

En otras palabras, **un Modelo es el cerebro lógico de un componente**, transformándolo de una unidad estática en una unidad dinámica, configurable y orquestable.

## ¿Qué es un Flow?

En FlowEngine, **un Flow es un flujo lógico que sirve a un Modelo**.
Su propósito es:

*   Descomponer la lógica de propiedades o eventos en pasos (Step) y ejecutarlos secuencialmente como un flujo.
*   Gestionar cambios de propiedades, así como respuestas a eventos.
*   Hacer que la lógica sea **dinámica, configurable y reutilizable**.

## ¿Cómo entender estos conceptos?

Puede imaginar un **Flow** como una **corriente de agua**:

*   Un **Step es como un nodo a lo largo de la corriente de agua**
    Cada Step realiza una pequeña tarea (por ejemplo, establecer una propiedad, activar un evento, llamar a una API), al igual que una corriente de agua tiene un efecto cuando pasa por una compuerta o una noria.

*   Los **Flujos son ordenados**
    Una corriente de agua sigue un camino predeterminado de aguas arriba a aguas abajo, pasando por todos los Steps en secuencia; de manera similar, la lógica en un Flow se ejecuta en el orden definido.

*   Los **Flujos se pueden ramificar y combinar**
    Una corriente de agua puede dividirse en varias corrientes más pequeñas o unirse; un Flow también puede dividirse en múltiples sub-flujos o combinarse en cadenas lógicas más complejas.

*   Los **Flujos son configurables y controlables**
    La dirección y el volumen de una corriente de agua se pueden ajustar con una compuerta; el método de ejecución y los parámetros de un Flow también se pueden controlar mediante la configuración (`stepParams`).

Resumen de la analogía

*   Un **componente** es como una noria que necesita una corriente de agua para girar.
*   Un **Modelo** es la base y el controlador de esta noria, responsable de recibir la corriente de agua e impulsar su funcionamiento.
*   Un **Flow** es esa corriente de agua, que pasa por cada Step en orden, impulsando al componente a cambiar y responder continuamente.

Así, en FlowEngine:

*   Los **Flujos permiten que la lógica fluya naturalmente como una corriente de agua**.
*   Los **Modelos permiten que los componentes se conviertan en los portadores y ejecutores de esta corriente**.