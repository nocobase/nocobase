---
pkg: '@nocobase/plugin-workflow-variable'
---

# Variable

## Introduction

You can declare variables in a flow or assign values to declared variables. This is typically used to store temporary data within the flow.

## Create Node

In the workflow configuration interface, click the plus ("+") button in the flow to add a "Variable" node:


![Add Variable Node](https://static-docs.nocobase/53b1e48e777bfff7f2a08271526ef3ee.png)


## Configure Node

### Mode

The variable node is similar to variables in programming; it must be declared before it can be used and assigned a value. Therefore, when creating a variable node, you need to select its mode. There are two modes to choose from:


![Select Mode](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)


- Declare a new variable: Creates a new variable.
- Assign to an existing variable: Assigns a value to a variable that has been declared earlier in the flow, which is equivalent to modifying the variable's value.

When the node being created is the first variable node in the flow, you can only select the declare mode, as there are no variables available for assignment yet.

When you choose to assign a value to a declared variable, you also need to select the target variable, which is the node where the variable was declared:


![Select the variable to assign a value to](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)


### Value

The value of a variable can be of any type. It can be a constant, such as a string, number, boolean, or date, or it can be another variable from the flow.

In declare mode, setting the variable's value is equivalent to assigning it an initial value.


![Declare initial value](https://static-docs.nocobase.com/4ce2c508986565ad537343013758c6a4.png)


In assignment mode, setting the variable's value is equivalent to modifying the value of the declared target variable to a new value. Subsequent uses will retrieve this new value.


![Assign a trigger variable to a declared variable](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)


## Using the Variable's Value

In subsequent nodes after the variable node, you can use the variable's value by selecting the declared variable from the "Node Variables" group. For example, in a query node, use the variable's value as a query condition:


![Use variable value as a query filter condition](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)


## Example

A more useful scenario for the variable node is in branches, where new values are calculated or merged with previous values (similar to `reduce`/`concat` in programming), and then used after the branch ends. The following is an example of using a loop branch and a variable node to concatenate a recipient string.

First, create a collection-triggered workflow that triggers when "Article" data is updated, and preload the related "Author" association data (to get recipients):


![Configure Trigger](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)


Then, create a variable node to store the recipient string:


![Recipient variable node](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)


Next, create a loop branch node to iterate through the article's authors and concatenate their recipient information into the recipient variable:


![Loop through authors in the article](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)


Inside the loop branch, first create a calculation node to concatenate the current author with the already stored author string:


![Concatenate recipient string](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)


After the calculation node, create another variable node. Select the assignment mode, choose the recipient variable node as the assignment target, and select the result of the calculation node as the value:


![Assign the concatenated recipient string to the recipient node](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)


This way, after the loop branch finishes, the recipient variable will store the recipient string of all the article's authors. Then, after the loop, you can use an HTTP Request node to call a mail sending API, passing the value of the recipient variable as the recipient parameter to the API:


![Send mail to recipients via the request node](https://static-docs.nocobase.com/37f71aa1a63e172bcb2dce10a250947e.png)


At this point, a simple bulk email feature has been implemented using a loop and a variable node.