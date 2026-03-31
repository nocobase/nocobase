# Expression Collection

## Creating an "Expression collection" Template

Before utilizing dynamic expression operation nodes within a workflow, it's essential to first create an "Expression" template collection using the collection management tool. This collection serves as a repository for various expressions:

![Creating an Expression Collection](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Entering Expression Data

Following this, you can set up a table block and input several formula entries into the template collection. Each row in the "Expression" template collection can be viewed as a calculation rule designed for a specific data model within the collection. You can utilize different fields from the data models of various collections as variables, crafting unique expressions as calculation rules. Moreover, you can leverage different calculation engines as needed.

![Entering Expression Data](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Tip}
Once the formulas are established, they need to be linked to the business data. Directly associating each row of business data with formula data can be tedious, so a common approach is to use a metadata collection, similar to a classification collection, to create a many-to-one (or one-to-one) relationship with the formula collection. Then, the business data is associated with the classified metadata in a many-to-one relationship. This approach allows you to simply specify the relevant classified metadata when creating business data, making it easy to locate and utilize the corresponding formula data through the established association path.
:::

## Loading Relevant Data into the Process

As an example, consider creating a workflow triggered by a collection event. When an order is created, the trigger should preload the associated product data along with the product-related expression data:

![Collection Event_Trigger Configuration](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)
