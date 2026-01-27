# Overview

A trigger is the entry point for a workflow. When an event that meets the trigger's conditions occurs while the application is running, the workflow will be triggered and executed. The type of trigger is also the type of workflow, selected when creating the workflow, and cannot be modified after creation. The currently supported trigger types are as follows:

- [Collection Events](./collection) (Built-in)
- [Schedule](./schedule) (Built-in)
- [Before Action](./pre-action) (Provided by the @nocobase/plugin-workflow-request-interceptor plugin)
- [After Action](./post-action) (Provided by the @nocobase/plugin-workflow-action-trigger plugin)
- [Custom Action](./custom-action) (Provided by the @nocobase/plugin-workflow-custom-action-trigger plugin)
- [Approval](./approval) (Provided by the @nocobase/plugin-workflow-approval plugin)
- [Webhook](./webhook) (Provided by the @nocobase/plugin-workflow-webhook plugin)

The timing of when each event is triggered is shown in the figure below:


![Workflow Events](https://static-docs.nocobase.com/20251029221709.png)


For example, when a user submits a form, or when data in a collection changes due to user action or a program call, or when a scheduled task reaches its execution time, a configured workflow can be triggered.

Data-related triggers (such as actions, collection events) usually carry trigger context data. This data acts as variables and can be used by nodes in the workflow as processing parameters to achieve automated data processing. For example, when a user submits a form, if the submit button is bound to a workflow, that workflow will be triggered and executed. The submitted data will be injected into the execution plan's context environment for subsequent nodes to use as variables.

After creating a workflow, on the workflow view page, the trigger is displayed as an entry node at the beginning of the process. Clicking on this card will open the configuration drawer. Depending on the type of trigger, you can configure its relevant conditions.


![Trigger_Entry Node](https://static-docs.nocobase.com/20251029222231.png)