# Query Data

Used to query and retrieve data records from a collection that meet specific conditions.

You can configure it to query a single record or multiple records. The query result can be used as a variable in subsequent nodes. When querying multiple records, the result is an array. When the query result is empty, you can choose whether to continue executing subsequent nodes.

## Create Node

In the workflow configuration interface, click the plus ("+") button in the flow to add a "Query Data" node:


![Add Query Data Node](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)


## Node Configuration


![Query Node Configuration](https://static-docs.nocobase.com/20240520131324.png)


### Collection

Select the collection from which to query data.

### Result Type

The result type is divided into "Single Record" and "Multiple Records":

-   Single Record: The result is an object, which is only the first matching record, or `null`.
-   Multiple Records: The result will be an array containing records that match the conditions. If no records match, it will be an empty array. You can process them one by one using a Loop node.

### Filter Conditions

Similar to the filter conditions in a regular collection query, you can use the workflow's context variables.

### Sort

When querying one or more records, you can use sorting rules to control the desired result. For example, to query the latest record, you can sort by the "Creation Time" field in descending order.

### Pagination

When the result set might be very large, you can use pagination to control the number of query results. For example, to query the latest 10 records, you can sort by the "Creation Time" field in descending order, and then set the pagination to 1 page with 10 records.

### Handling Empty Results

In single record mode, if no data meets the conditions, the query result will be `null`. In multiple records mode, it will be an empty array (`[]`). You can choose whether to check "Exit workflow when query result is empty". If checked, and the query result is empty, subsequent nodes will not be executed, and the workflow will exit early with a failed status.