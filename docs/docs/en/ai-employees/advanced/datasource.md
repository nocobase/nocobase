# Advanced

## Introduction

In the AI Employee plugin, you can configure data sources and preset some collection queries. These are then sent as application context when conversing with the AI employee, who will answer based on the collection query results.

## Data Source Configuration

Go to the AI Employee plugin configuration page, click the `Data source` tab to enter the AI employee data source management page.


![20251022103526](https://static-docs.nocobase.com/20251022103526.png)


Click the `Add data source` button to enter the data source creation page.

Step 1: Enter basic `Collection` information:
- In the `Title` input box, enter a memorable name for the data source;
- In the `Collection` input box, select the data source and collection to use;
- In the `Description` input box, enter a description for the data source.
- In the `Limit` input box, enter the query limit for the data source to avoid returning too much data that exceeds the AI conversation context.


![20251022103935](https://static-docs.nocobase.com/20251022103935.png)


Step 2: Select the fields to query:

In the `Fields` list, check the fields you want to query.


![20251022104516](https://static-docs.nocobase.com/20251022104516.png)


Step 3: Set query conditions:


![20251022104635](https://static-docs.nocobase.com/20251022104635.png)


Step 4: Set sorting conditions:


![20251022104722](https://static-docs.nocobase.com/20251022104722.png)


Finally, before saving the data source, you can preview the data source query results.


![20251022105012](https://static-docs.nocobase.com/20251022105012.png)


## Sending Data Sources in Conversations

In the AI employee dialog box, click the `Add work context` button in the lower-left corner, select `Data source`, and you will see the data source you just added.


![20251022105240](https://static-docs.nocobase.com/20251022105240.png)


Check the data source you want to send, and the selected data source will be attached to the dialog box.


![20251022105401](https://static-docs.nocobase.com/20251022105401.png)


After entering your question, just like sending a regular message, click the send button, and the AI employee will reply based on the data source.

The data source will also appear in the message list.


![20251022105611](https://static-docs.nocobase.com/20251022105611.png)


## Notes

The data source will automatically filter data based on the current user's ACL permissions, showing only the data the user has access to.