# Action Linkage Rules

## Introduction

Action linkage rules allow users to dynamically control the state of an action (such as show, enable, hide, disable, etc.) based on specific conditions. By configuring these rules, users can link the behavior of action buttons to the current record, user role, or contextual data.


![20251029150224](https://static-docs.nocobase.com/20251029150224.png)


## How to Use

When the condition is met (it passes by default if no condition is set), it triggers the execution of property settings or JavaScript. Constants and variables are supported in the conditional judgment.


![20251030224601](https://static-docs.nocobase.com/20251030224601.png)


The rule supports modifying button properties.


![20251029150452](https://static-docs.nocobase.com/20251029150452.png)


## Constants

Example: Paid orders cannot be edited.


![20251029150638](https://static-docs.nocobase.com/20251029150638.png)


## Variables

### System Variables


![20251029150014](https://static-docs.nocobase.com/20251029150014.png)


Example 1: Control the visibility of a button based on the current device type.


![20251029151057](https://static-docs.nocobase.com/20251029151057.png)


Example 2: The bulk update button in the header of the orders block table is only available to the Admin role; other roles cannot perform this action.


![20251029151209](https://static-docs.nocobase.com/20251029151209.png)


### Contextual Variables

Example: The Add button on the order opportunities (association block) is only enabled when the order status is "Pending Payment" or "Draft". In other statuses, the button will be disabled.


![20251029151520](https://static-docs.nocobase.com/20251029151520.png)



![20251029152200](https://static-docs.nocobase.com/20251029152200.png)


For more information on variables, see [Variables](/interface-builder/variables).