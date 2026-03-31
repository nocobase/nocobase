# Query data in SQL mode

In the Data query panel, switch to SQL mode, write and run the query, and use the returned result directly for chart mapping and rendering.


![20251027075805](https://static-docs.nocobase.com/20251027075805.png)


## Write SQL statements
- In the Data query panel, choose SQL mode.
- Enter SQL and click Run query.
- Supports complex statements including multi‑table JOIN and VIEW.

Example: order amount by month
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## View results
- Click View data to open the preview panel.


![20251027080014](https://static-docs.nocobase.com/20251027080014.png)


Data supports pagination; you can switch between Table and JSON to check column names and types.

![20251027080100](https://static-docs.nocobase.com/20251027080100.png)


## Field mapping
- In Chart options, map fields based on the query result columns.
- By default, the first column is used as the dimension (X axis or category), and the second column as the measure (Y axis or value). Mind the column order in SQL:

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- dimension field in the first column
  SUM(total_amount) AS total -- measure field afterwards
```


![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)


## Use context variables
Click the x button at the top‑right of the SQL editor to choose context variables.


![20251027081752](https://static-docs.nocobase.com/20251027081752.png)


After confirming, the variable expression is inserted at the cursor (or replaces the selected text).

For example, `{{ ctx.user.createdAt }}`. Do not add extra quotes.


![20251027081957](https://static-docs.nocobase.com/20251027081957.png)


## More examples
For more examples, see the NocoBase [Demo app](https://demo3.sg.nocobase.com/admin/5xrop8s0bui)

**Recommendations:**
- Stabilize column names before mapping to charts to avoid errors later.
- During debugging, set `LIMIT` to reduce returned rows and speed up preview.

## Preview, save, and rollback
- Click Run query to request data and refresh the chart preview.
- Click Save to persist the current SQL text and related configuration to the database.
- Click Cancel to revert to the last saved state and discard current unsaved changes.