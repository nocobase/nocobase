# A·B·C

At the no-code level, the core concept of NocoBase can be summarized as `A·B·C`.

`A·B·C` stands for `Action·Block·Collection`. We design data structure by `Collection`, organize and display data by `Block`, and interact with data by `Action`.

## **Separate "data structure" and "user interface"**

When defining data, focus on defining data; when defining views, focus on defining views.

Abstract the business by defining the data; then define blocks to organize the content to present the data in the way you want.

## **One Data table, Many Presentations**

Abstract a unified data model for the business, and then with blocks you can build a variety of presentations for the same data table for different scenarios, different roles, and different combinations.

## **Driven by Action**

`Collection`defines the structure of the data, and the `Block`organize the presentation of the data. So, what drives data interactions and changes? The answer is `Action`.

`Block`present the data to the user, and  `Action`send the user's instructions to the server to complete the interaction or change of the data.
