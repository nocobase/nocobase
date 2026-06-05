# Use context variables

With context variables, you can reuse information from the current page, user, time, and filter inputs to render charts and enable linkage based on context.

## Applicable scope
- Data query in Builder mode: select variables for filter conditions.

![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)


- Data query in SQL mode: choose variables and insert expressions (for example, `{{ ctx.user.id }}`).

![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)


- Chart options in Custom mode: write JS expressions directly.

![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)


- Interaction events (for example, click to open a drill‑down dialog and pass data): write JS expressions directly.

![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)


**Note:**
- Do not wrap `{{ ... }}` with single or double quotes; binding is handled safely based on variable type (string, number, time, NULL).
- When a variable is `NULL` or undefined, handle nulls explicitly in SQL using `COALESCE(...)` or `IS NULL`.