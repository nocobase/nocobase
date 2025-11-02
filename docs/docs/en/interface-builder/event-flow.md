# Event flow

## Introduction

Event flow allows you to trigger custom actions when certain events occur, such as form changes. Beyond forms, pages, blocks, buttons, and fields can all use event flows to configure custom operations.

## How to use

Let's walk through a simple example to understand how to configure event flows. We'll create a linkage between two tables where clicking a row in the left table automatically filters the data in the right table.


![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)


Configuration steps:

1. Click the "lightning" icon in the top-right corner of the left table block to open the event flow configuration panel.

![20251031092425](https://static-docs.nocobase.com/20251031092425.png)

2. Click "Add event flow", select "Row click" as the "Trigger event", which means the flow will trigger when a table row is clicked.

![20251031092637](https://static-docs.nocobase.com/20251031092637.png)

3. "Trigger condition" is used to configure conditions. The event flow will only trigger when these conditions are met. In this case, we don't need to configure any conditions, so the flow will trigger on any row click.

![20251031092717](https://static-docs.nocobase.com/20251031092717.png)

4. Hover over "Add step" to add operation steps. Select "Set data scope" to configure the data scope for the right table.

![20251031092755](https://static-docs.nocobase.com/20251031092755.png)

5. Copy the UID of the right table and paste it into the "Target block UID" input field. A condition configuration panel will appear below, where you can configure the data scope for the right table.

![20251031092915](https://static-docs.nocobase.com/20251031092915.png)

6. Configure a condition as shown below:

![20251031093233](https://static-docs.nocobase.com/20251031093233.png)

7. After configuring the data scope, you need to refresh the block to display the filtered results. Add a "Refresh target blocks" step and enter the UID of the right table.

![20251031093150](https://static-docs.nocobase.com/20251031093150.png)


![20251031093341](https://static-docs.nocobase.com/20251031093341.png)

8. Finally, click the save button in the bottom-right corner to complete the configuration.

## Event types

### Before render

A universal event that can be used in pages, blocks, buttons, or fields. Use this event for initialization tasks, such as configuring different data scopes based on different conditions.

### Row click

A table block-specific event. Triggers when a table row is clicked. When triggered, it adds a "Clicked row record" to the context, which can be used as a variable in conditions and steps.

### Form values change

A form block-specific event. Triggers when form field values change. You can access form values through the "Current form" variable in conditions and steps.

### Click

A button-specific event. Triggers when the button is clicked.

## Step types

### Custom variable

Create a custom variable to use within the context.

#### Scope

Custom variables have scope. For example, a variable defined in a block's event flow can only be used within that block. To make a variable available across all blocks on the current page, configure it in the page's event flow.

#### Form variable

Use values from a form block as a variable. Configuration:


![20251031093516](https://static-docs.nocobase.com/20251031093516.png)


- Variable title: Variable title
- Variable identifier: Variable identifier
- Form UID: Form UID

#### Other variables

More variable types will be supported in the future.

### Set data scope

Set the data scope for a target block. Configuration:


![20251031093609](https://static-docs.nocobase.com/20251031093609.png)


- Target block UID: Target block UID
- Condition: Filter condition

### Refresh target blocks

Refresh target blocks. Multiple blocks can be configured. Configuration:


![20251031093657](https://static-docs.nocobase.com/20251031093657.png)


- Target block UID: Target block UID

### Navigate to URL

Navigate to a URL. Configuration:


![20251031093742](https://static-docs.nocobase.com/20251031093742.png)


- URL: Target URL, supports variables
- Search parameters: Query parameters in the URL
- Open in new window: If checked, opens the URL in a new browser tab

### Show message

Display global feedback messages.

#### When to use

- Provide success, warning, and error feedback.
- Display centered at the top and auto-dismiss, providing lightweight feedback without interrupting user operations.

#### Configuration


![20251031093825](https://static-docs.nocobase.com/20251031093825.png)


- Message type: Message type
- Message content: Message content
- Duration: How long to display (in seconds)

### Show notification

Display global notification alerts.

#### When to use

Display notification alerts in the four corners of the system. Commonly used for:

- Complex notification content.
- Interactive notifications that provide users with next steps.
- System-initiated notifications.

#### Configuration


![20251031093934](https://static-docs.nocobase.com/20251031093934.png)


- Notification type: Notification type
- Notification title: Notification title
- Notification description: Notification description
- Placement: Position, options: top-left, top-right, bottom-left, bottom-right

### Execute JavaScript


![20251031094046](https://static-docs.nocobase.com/20251031094046.png)


Execute JavaScript code.