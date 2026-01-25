# What is FlowEngine?

FlowEngine is a new front-end no-code/low-code development engine introduced in NocoBase 2.0. It combines Models and Flows to simplify front-end logic and improve reusability and maintainability. At the same time, it leverages the configurability of Flows to provide no-code configuration and orchestration capabilities for front-end components and business logic.

## Why is it called FlowEngine?

Because in FlowEngine, a component's properties and logic are no longer statically defined, but are driven and managed by **Flows**.

*   **Flow**, like a data stream, breaks down logic into ordered steps (Steps) that are progressively applied to the component.
*   **Engine** signifies that it is an engine that drives front-end logic and interactions.

Therefore, **FlowEngine = A front-end logic engine driven by Flows**.

## What is a Model?

In FlowEngine, a Model is an abstract model of a component, responsible for:

*   Managing the component's **properties (Props) and state**.
*   Defining the component's **rendering method**.
*   Hosting and executing **Flows**.
*   Uniformly handling **event dispatching** and **lifecycles**.

In other words, **a Model is the logical brain of a component**, transforming it from a static unit into a configurable and orchestratable dynamic unit.

## What is a Flow?

In FlowEngine, **a Flow is a logic stream that serves a Model**.
Its purpose is to:

*   Break down property or event logic into steps (Steps) and execute them sequentially in a stream.
*   Manage property changes as well as event responses.
*   Make logic **dynamic, configurable, and reusable**.

## How to understand these concepts?

You can think of a **Flow** as a **stream of water**:

*   **A Step is like a node along the water stream**
    Each Step performs a small task (e.g., setting a property, triggering an event, calling an API), just as a stream of water has an effect when it passes through a gate or a water wheel.

*   **Flows are ordered**
    A stream of water follows a predetermined path from upstream to downstream, passing through all Steps in sequence; similarly, the logic in a Flow is executed in the defined order.

*   **Flows can be branched and combined**
    A stream of water can be split into multiple smaller streams or merged together; a Flow can also be broken down into multiple sub-flows or combined into more complex logical chains.

*   **Flows are configurable and controllable**
    The direction and volume of a water stream can be adjusted with a sluice gate; the execution method and parameters of a Flow can also be controlled through configuration (stepParams).

Analogy Summary

*   A **component** is like a water wheel that needs a stream of water to turn.
*   A **Model** is the base and controller of this water wheel, responsible for receiving the water stream and driving its operation.
*   A **Flow** is that stream of water, passing through each Step in order, driving the component to continuously change and respond.

So, in FlowEngine:

*   **Flows allow logic to move naturally like a stream of water**.
*   **Models enable components to become the carriers and executors of this stream**.