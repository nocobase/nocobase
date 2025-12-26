# Use Skills

Mainstream large language models have the ability to use Tools. The AI Employee plugin has built-in some commonly used Tools for large language models to use.

The Skills set on the AI Employee configuration page are the Tools used by large language models.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Configure Skills

Enter the AI Employee plugin configuration page, click the `AI employees` tab to enter the AI Employee management page.

Select the AI Employee to configure Skills for, click the `Edit` button to enter the AI Employee editing page.

Click the `Add Skill` button in the `Skills` tab to add Skills for the current AI Employee.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Skills Introduction

### Frontend

The Frontend group allows AI Employees to interact with frontend components.

- `Form filler` Skill allows AI Employees to fill generated form data back into the form specified by the user.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)


### Data modeling

The Data modeling group Skills enable AI Employees to call NocoBase internal interfaces for data modeling.

- `Intent Router`: Judges whether the user wants to modify the data table structure or create a new data table structure.
- `Get collection names`: Gets the names of all existing data tables in the system.
- `Get collection metadata`: Gets the structure information of the specified data table.
- `Define collections`: Allows AI Employees to create data tables in the system.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow caller

`Workflow caller` enables AI Employees to execute workflows. Workflows configured with `Trigger type` as `AI employee event` in the Workflow plugin will be available here as Skills for AI Employees to use.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code Editor

Skills under the Code Editor group mainly enable AI Employees to interact with the code editor.

- `Get code snippet list`: Gets the list of preset code snippets.
- `Get code snippet content`: Gets the content of the specified code snippet.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Others

- `Chart generator`: Enables AI Employees to generate charts and output charts directly in the Chat.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)