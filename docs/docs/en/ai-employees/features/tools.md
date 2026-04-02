# Use Tools

tools define what an AI Employee can do.

## Tool Structure

The tools page is split into three sections:

1. `General tools`: shared by all AI Employees, read-only.
2. `Employee-specific tools`: specific to the current employee, usually read-only.
3. `Custom tools`: custom tools that can be added/removed and configured with default permissions.

![20260331182248](https://static-docs.nocobase.com/20260331182248.png)

## Tool Permissions

Tool permissions are unified as:

- `Ask`: ask for confirmation before calling.
- `Allow`: allow direct calling.

Recommendation: use `Ask` by default for data-modifying tools.

![20260331182832](https://static-docs.nocobase.com/20260331182832.png)

## Add and Maintain

Create a workflow in the workflow module with the trigger type set to `AI employee event`.

![20260331185556](https://static-docs.nocobase.com/20260331185556.png)

Click `Add skill` in `Custom tools` to add workflow as tool and configure permissions based on business risk.

![20260331185711](https://static-docs.nocobase.com/20260331185711.png)
