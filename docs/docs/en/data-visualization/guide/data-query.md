# Data query

The chart configuration panel is divided into three sections: Data query, Chart options, and Interaction events, plus Cancel, Preview, and Save buttons at the bottom.

This section focuses on the Data query panel, covering the two query modes (Builder/SQL) and common features.

## Panel layout
![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Tips: To configure more easily, collapse other panels first.

Top action bar:
- Mode: Builder (visual, simple) / SQL (handwritten statements, more flexible).
- Run query: Execute the query request.
- View result: Open the result panel and switch between Table/JSON. Click again to collapse.

From top to bottom:
- Data source and collection: Required. Select the data source and table.
- Measures: Required. Numeric fields to display.
- Dimensions: Group by fields (date/category/region, etc.).
- Filters: Set conditions (=, ≠, >, <, contains, range, etc.); multiple conditions can be combined.
- Sort: Choose the sort field and ascending/descending.
- Pagination: Control the range and return order.

## Builder mode

### Select data source and collection
- In the Data query panel, set mode to Builder.
- Select a data source and collection (table). If the collection is not selectable or empty, first check permissions and whether it exists.

### Configure measures
- Choose one or more numeric fields and set aggregation: `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Common cases: `Count` for record count, `Sum` for total amount.

### Configure dimensions
- Choose one or more fields as grouping dimensions.
- For date/time fields, set a format (such as `YYYY-MM`, `YYYY-MM-DD`) to group by month/day.

### Filters, sort, and pagination
- Filters: Add conditions (=, ≠, contains, range, etc.); combine multiple conditions if needed.
- Sort: Choose the field and ascending/descending order.
- Pagination: Set `Limit` and `Offset` to control returned rows; when debugging, start with a small `Limit`.

### Run query and view result
- Click Run query. After the response, use View data to switch between `Table / JSON` and check columns and values.
- Before mapping chart fields, confirm column names and types here to avoid empty charts or errors later.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Field mapping afterwards
Later, in Chart options, map fields based on the selected data source and collection.

## SQL mode

### Write the query
- Switch to SQL mode, enter the query, and click Run query.
- Example (order amount by month):
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Run query and view result
- Click Run query. After the response, use View data to switch between `Table / JSON` and check columns and values.
- Before mapping chart fields, confirm column names and types here to avoid empty charts or errors later.

### Field mapping afterwards
Later, in Chart options, map fields based on the query result columns.

For more on SQL mode, see Advanced — query data in SQL mode.