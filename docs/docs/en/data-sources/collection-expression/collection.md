# Expression Collection

## Creating an "Expression Collection" Template

Before using dynamic expression operation nodes within a workflow, you need to create an "Expression" template collection using the data table management tool. This collection serves as a repository for various expressions.

![Creating an Expression Template Table](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Entering Expression Data

Next, create a table block and add several formula entries to the template collection. Each record in the "Expression" template collection can be understood as a calculation rule for a specific data model. Each formula entry can use fields from different collections as variables to build various expressions as calculation rules. You can also choose different calculation engines as needed.

![Entering Expression Data](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Tip}
After creating the formulas, you need to associate them with business data. Linking each business record directly to formula data can be cumbersome, so it is usually recommended to use a metadata collection (similar to a classification table) and establish a many-to-one (or one-to-one) relationship with the formula collection. Then, link the business data to the metadata collection through a many-to-one relationship. This way, when creating business data, you only need to specify the relevant metadata, and the corresponding formula data can be accessed later through this association path.
:::

## Loading Relevant Data into the Process

For example, create a workflow triggered by a data table event. When an order is created, the trigger can preload related product data and corresponding expression data.

![Data Table Event_Trigger Configuration](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)
