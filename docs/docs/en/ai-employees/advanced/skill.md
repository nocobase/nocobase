# Advanced

# Introduction

Mainstream large language models have the ability to use tools. The AI employee plugin has some built-in common tools for large language models to use.

The skills set on the AI employee settings page are the tools available for the large language model to use.


![20251022142348](https://static-docs.nocobase.com/20251022142348.png)


## Set Skills

Go to the AI employee plugin configuration page, click the `AI employees` tab to enter the AI employee management page.

Select the AI employee for which you want to set skills, click the `Edit` button to enter the AI employee editing page.

In the `Skills` tab, click the `Add Skill` button to add a skill for the current AI employee.


![20251022145748](https://static-docs.nocobase.com/20251022145748.png)


## Skill Introduction

### Frontend

The Frontend group allows the AI employee to interact with front-end components.

- The `Form filler` skill allows the AI employee to backfill generated form data into a user-specified form.


![20251022145954](https://static-docs.nocobase.com/20251022145954.png)



### Data modeling

The Data modeling group of skills gives the AI employee the ability to call NocoBase's internal APIs for data modeling.

- `Intent Router` routes intents, determining whether the user wants to modify a collection structure or create a new one.
- `Get collection names` gets the names of all existing collections in the system.
- `Get collection metadata` gets the structure information of a specified collection.
- `Define collections` allows the AI employee to create collections in the system.


![20251022150441](https://static-docs.nocobase.com/20251022150441.png)


### Workflow caller

`Workflow caller` gives the AI employee the ability to execute workflows. Workflows configured with `Trigger type` as `AI employee event` in the workflow plugin will be available here as skills for the AI employee to use.


![20251022153320](https://static-docs.nocobase.com/20251022153320.png)


### Code Editor

The skills under the Code Editor group mainly enable the AI employee to interact with the code editor.

- `Get code snippet list` gets the list of preset code snippets.
- `Get code snippet content` gets the content of a specified code snippet.


![20251022153811](https://static-docs.nocobase.com/20251022153811.png)


### Others

- `Chart generator` gives the AI employee the ability to generate charts and output them directly in the conversation.


![20251022154141](https://static-docs.nocobase.com/20251022154141.png)