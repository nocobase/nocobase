# Advanced

## Introduction

AI Employees can be bound to pages or blocks. After binding, you can configure tasks for the current business, allowing users to quickly use the AI Employee to process tasks on the page or block.

## Bind AI Employee to a Page

After the page enters UI edit mode, a '+' sign will appear next to the AI Employee quick-access button in the bottom right corner. Hover over the '+' sign, and a list of AI Employees will appear. Select an AI Employee to bind it to the current page.


![20251022134656](https://static-docs.nocobase.com/20251022134656.png)


After the binding is complete, the AI Employee bound to the current page will be displayed in the bottom right corner each time you enter the page.


![20251022134903](https://static-docs.nocobase.com/20251022134903.png)


## Bind AI Employee to a Block

After the page enters UI edit mode, on a block that supports setting `Actions`, select the `AI employees` menu under `Actions`, and then choose an AI Employee to bind it to the current block.


![20251022135306](https://static-docs.nocobase.com/20251022135306.png)


After the binding is complete, the AI Employee bound to the current block will be displayed in the block's `Actions` area each time you enter the page.


![20251022135438](https://static-docs.nocobase.com/20251022135438.png)


## Configure Tasks

After the page enters UI edit mode, hover over the icon of the AI Employee bound to the page or block. A menu button will appear. Select `Edit tasks` to enter the task configuration page.


![20251022135710](https://static-docs.nocobase.com/20251022135710.png)


After entering the task configuration page, you can add multiple tasks for the current AI Employee.

Each tab represents an independent task. Click the '+' sign next to it to add a new task.


![20251022140058](https://static-docs.nocobase.com/20251022140058.png)


Task configuration form:

- In the `Title` input box, enter the task title. Briefly describe the task content. This title will appear in the AI Employee's task list.
- In the `Background` input box, enter the main content of the task. This content will be used as the system prompt when conversing with the AI Employee.
- In the `Default user message` input box, enter the default user message to be sent. It will be automatically populated in the user input box after selecting the task.
- In `Work context`, select the default application context information to send to the AI Employee. This operation is the same as in the dialog.
- The `Skills` selection box shows the skills available to the current AI Employee. You can deselect a skill to make the AI Employee ignore and not use it when performing this task.
- The `Send default user message automatically` checkbox configures whether to automatically send the default user message after clicking to execute the task.


![20251022140805](https://static-docs.nocobase.com/20251022140805.png)


## Task List

After configuring tasks for an AI Employee, these tasks will be displayed in the AI Employee's profile popover and in the greeting message before a conversation starts. Click a task to execute it.


![20251022141231](https://static-docs.nocobase.com/20251022141231.png)