# Condition

## Introduction

Similar to the `if` statement in programming languages, it determines the subsequent flow direction based on the result of the configured condition.

## Create Node

The Condition node has two modes: "Continue if true" and "Branch on true/false". You must select one of these modes when creating the node, and it cannot be changed in the node's configuration afterward.


![Condition_Mode_Selection](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)


In the "Continue if true" mode, when the condition's result is "true", the workflow will continue to execute subsequent nodes. Otherwise, the workflow will terminate and exit prematurely with a failed status.


!["Continue if true" mode](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)


This mode is suitable for scenarios where the workflow should not proceed if the condition is not met. For example, a form submission button for submitting an order is bound to a "Before action event". If the stock for the product in the order is insufficient, the order creation process should not continue but should fail and exit.

In the "Branch on true/false" mode, the condition node will create two subsequent branches, corresponding to the "true" and "false" results of the condition. Each branch can be configured with its own subsequent nodes. After either branch completes its execution, it will automatically merge back into the parent branch of the condition node to continue executing the following nodes.


!["Branch on true/false" mode](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)


This mode is suitable for scenarios where different actions need to be performed depending on whether the condition is met or not. For example, checking if a piece of data exists: if it doesn't, create it; if it does, update it.

## Node Configuration

### Calculation Engine

Currently, three engines are supported:

- **Basic**: Obtains a logical result through simple binary calculations and "AND"/"OR" grouping.
- **Math.js**: Calculates expressions supported by the [Math.js](https://mathjs.org/) engine to obtain a logical result.
- **Formula.js**: Calculates expressions supported by the [Formula.js](https://formulajs.info/) engine to obtain a logical result.

In all three calculation types, variables from the workflow context can be used as parameters.