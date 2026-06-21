# Calculation

The Calculation node can evaluate an expression, and the result is saved in the result of the corresponding node for use by subsequent nodes. It is a tool for calculating, processing, and transforming data. To some extent, it can replace the function in programming languages of calling a function on a value and assigning it to a variable.

## Create Node

In the workflow configuration interface, click the plus ("+") button in the flow to add a "Calculation" node:


![Calculation Node_Add](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)


## Node Configuration


![Calculation Node_Configuration](https://static-docs.nocobase.com/6a155de3f6a883d8cd1881b2d9c33874.png)


### Calculation Engine

The calculation engine defines the syntax supported by the expression. The currently supported calculation engines are [Math.js](https://mathjs.org/) and [Formula.js](https://formulajs.info/). Each engine has a large number of built-in common functions and methods for data operations. For specific usage, you can refer to their official documentation.

:::info{title=Tip}
It should be noted that different engines differ in array index access. Math.js indices start from `1`, while Formula.js starts from `0`.
:::

In addition, if you need simple string concatenation, you can directly use "String Template". This engine will replace the variables in the expression with their corresponding values and then return the concatenated string.

### Expression

An expression is a string representation of a calculation formula, which can consist of variables, constants, operators, and supported functions. You can use variables from the flow context, such as the result of a preceding node of the calculation node, or local variables of a loop.

If the expression input does not conform to the syntax, an error will be prompted in the node configuration. If a variable does not exist or the type does not match during execution, or if a non-existent function is used, the calculation node will terminate prematurely with an error status.

## Example

### Calculate Order Total Price

An order may contain multiple items, and each item has a different price and quantity. The total price of the order needs to be the sum of the products of the price and quantity of all items. After loading the list of order details (a one-to-many relationship dataset), you can use a calculation node to calculate the total price of the order:


![Calculation Node_Example_Configuration](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)


Here, the `SUMPRODUCT` function from Formula.js can calculate the sum of products for two arrays of the same length, which yields the total price of the order.