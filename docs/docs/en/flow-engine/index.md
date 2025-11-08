# What is FlowEngine?

FlowEngine is a new front-end no-code, low-code development engine introduced in NocoBase 2.0. It combines models (Model) with flows (Flow) to simplify front-end logic and enhance reusability and maintainability. At the same time, by leveraging the configurable nature of Flow, it provides no-code configuration and orchestration capabilities for front-end components and business logic.

## Why is it called FlowEngine?

Because in FlowEngine, the properties and logic of components are no longer statically defined, but are driven and managed by a **Flow**.

*   **Flow**, like a data stream, breaks down logic into ordered steps (Step) and applies them to the component sequentially;
*   **Engine** signifies that it is an engine that drives front-end logic and interactions.

Therefore, **FlowEngine = A front-end logic engine driven by flows**.

## What is a Model?

In FlowEngine, a Model is an abstract model of a component, responsible for:

*   Managing the component's **properties (Props) and state**;
*   Defining the component's **rendering method**;
*   Hosting and executing the **Flow**;
*   Uniformly handling **event dispatching** and **lifecycles**.

In other words, **the Model is the logical brain of the component**, turning it from a static element into a configurable and orchestratable dynamic unit.

## What is a Flow?

In FlowEngine, a **Flow is a logical flow that serves the Model**.
Its purpose is to:

*   Break down property or event logic into steps (Step) and execute them sequentially in a flow-like manner;
*   Manage property changes as well as event responses;
*   Make logic **dynamic, configurable, and reusable**.

## How to understand these concepts?

You can think of a **Flow** as a **stream of water**:

*   **A Step is like a node along the stream's path**
    Each Step performs a small task (e.g., setting a property, triggering an event, calling an API), just as water has an effect when it passes through a gate or a waterwheel.

*   **The flow is ordered**
    Water flows along a predetermined path from upstream to downstream, passing through all Steps in sequence; similarly, the logic in a Flow is executed in the defined order.

*   **The flow can be branched and combined**
    A stream of water can be split into multiple smaller streams or merged together; a Flow can also be broken down into multiple sub-flows or combined into more complex logical chains.

*   **The flow is configurable and controllable**
    The direction and volume of a water stream can be adjusted with a sluice gate; the execution method and parameters of a Flow can also be controlled through configuration (stepParams).

Analogy Summary

*   A **component** is like a waterwheel that needs a stream of water to turn;
*   The **Model** is the base and controller of this waterwheel, responsible for receiving the water and driving its operation;
*   The **Flow** is that stream of water that passes through each Step in order, causing the component to continuously change and respond.

So in FlowEngine:

*   **Flow allows logic to move naturally like a stream of water**;
*   **Model makes the component the carrier and executor of this stream**.