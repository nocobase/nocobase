---
title: 'Condition node'
description: 'Choose a yes or no workflow branch with a handler module that returns a boolean.'
---

# Condition node

:::warning Translation in progress
The complete English version of this page is being prepared.
:::

A Condition node runs a handler module that ships with the workflow package. The module receives `{ input, parameters, nodeResults }` and must return a boolean: `true` enters the `yes` branch and `false` enters the `no` branch.

Use the shared `FlowContext` described in [Typed handler context](../dsl.md#typed-handler-context) to read typed node results without casts. Every result may be `undefined`, including results from earlier nodes. Context checking does not prove execution order and adds no runtime output schema. Keep the condition node in a separate variable if its `output` reference is needed: `addNode()` returns the updated builder.
