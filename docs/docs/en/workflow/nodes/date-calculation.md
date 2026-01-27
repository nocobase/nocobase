---
pkg: '@nocobase/plugin-workflow-date-calculation'
---

# Date Calculation

## Introduction

The Date Calculation node provides nine calculation functions, including adding a time period, subtracting a time period, formatted output of a time string, and duration unit conversion. Each function has specific input and output value types, and can also receive results from other nodes as parameter variables. It uses a calculation pipeline to chain the results of configured functions to finally obtain an expected output.

## Create Node

In the workflow configuration interface, click the plus ("+") button in the flow to add a "Date Calculation" node:


![Date Calculation Node_Create Node](https://static-docs.nocobase.com/[图片].png)


## Node Configuration


![Date Calculation Node_Node Configuration](https://static-docs.nocobase.com/20240817184423.png)


### Input Value

The input value can be a variable or a date constant. The variable can be the data that triggered this workflow or the result of an upstream node in this workflow. For the constant, you can select any date.

### Input Value Type

Refers to the type of the input value. There are two possible values.

*   Date type: Means the input value can ultimately be converted to a date-time type, such as a numeric timestamp or a string representing time.
*   Number type: Since the input value type affects the selection of the following time calculation steps, it is necessary to correctly select the input value type.

### Calculation Steps

Each calculation step consists of a calculation function and its parameter configuration. It adopts a pipeline design, where the result from the previous function's calculation serves as the input value for the next function's calculation. In this way, a series of time calculations and conversions can be completed.

After each calculation step, the output type is also fixed and will affect the functions available for the next calculation step. The calculation can only continue if the types match. Otherwise, the result of a step will be the final output of the node.

## Calculation Functions

### Add a period of time

-   Receives input value type: Date
-   Parameters
    -   The amount to add, which can be a number or a built-in variable from the node.
    -   Time unit.
-   Output value type: Date
-   Example: When the input value is `2024-7-15 00:00:00`, the amount is `1`, and the unit is "day", the calculation result is `2024-7-16 00:00:00`.

### Subtract a period of time

-   Receives input value type: Date
-   Parameters
    -   The amount to subtract, which can be a number or a built-in variable from the node.
    -   Time unit.
-   Output value type: Date
-   Example: When the input value is `2024-7-15 00:00:00`, the amount is `1`, and the unit is "day", the calculation result is `2024-7-14 00:00:00`.

### Calculate the difference with another time

-   Receives input value type: Date
-   Parameters
    -   The date to calculate the difference with, which can be a date constant or a variable from the workflow context.
    -   Time unit.
    -   Whether to take the absolute value.
    -   Rounding operation: Options include keeping decimals, rounding, rounding up, and rounding down.
-   Output value type: Number
-   Example: When the input value is `2024-7-15 00:00:00`, the comparison object is `2024-7-16 06:00:00`, the unit is "day", absolute value is not taken, and decimals are kept, the calculation result is `-1.25`.

:::info{title=Tip}
When absolute value and rounding are configured simultaneously, the absolute value is taken first, then rounding is applied.
:::

### Get the value of a time in a specific unit

-   Receives input value type: Date
-   Parameters
    -   Time unit.
-   Output value type: Number
-   Example: When the input value is `2024-7-15 00:00:00` and the unit is "day", the calculation result is `15`.

### Set the date to the start of a specific unit

-   Receives input value type: Date
-   Parameters
    -   Time unit.
-   Output value type: Date
-   Example: When the input value is `2024-7-15 14:26:30` and the unit is "day", the calculation result is `2024-7-15 00:00:00`.

### Set the date to the end of a specific unit

-   Receives input value type: Date
-   Parameters
    -   Time unit.
-   Output value type: Date
-   Example: When the input value is `2024-7-15 14:26:30` and the unit is "day", the calculation result is `2024-7-15 23:59:59`.

### Check for leap year

-   Receives input value type: Date
-   Parameters
    -   No parameters
-   Output value type: Boolean
-   Example: When the input value is `2024-7-15 14:26:30`, the calculation result is `true`.

### Format as string

-   Receives input value type: Date
-   Parameters
    -   Format, refer to [Day.js: Format](https://day.js.org/docs/en/display/format)
-   Output value type: String
-   Example: When the input value is `2024-7-15 14:26:30` and the format is `the time is YYYY/MM/DD HH:mm:ss`, the calculation result is `the time is 2024/07/15 14:26:30`.

### Convert unit

-   Receives input value type: Number
-   Parameters
    -   Time unit before conversion.
    -   Time unit after conversion.
    -   Rounding operation, options include keeping decimals, rounding, rounding up, and rounding down.
-   Output value type: Number
-   Example: When the input value is `2`, the unit before conversion is "week", the unit after conversion is "day", and decimals are not kept, the calculation result is `14`.

## Example


![Date Calculation Node_Example](https://static-docs.nocobase.com/20240817184137.png)


Suppose there is a promotional event, and we want to add a promotion end time to a product's field when each product is created. This end time is at 23:59:59 on the last day of the week following the product's creation time. So we can create two time functions and run them in a pipeline:

-   Calculate the time for the next week
-   Reset the result to 23:59:59 on the last day of that week

This way, we get the desired time value and pass it to the next node, such as a collection modification node, to add the promotion end time to the collection.