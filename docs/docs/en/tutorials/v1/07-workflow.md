# Chapter 7: Workflow

<iframe width="800" height="450" src="https://www.youtube.com/embed/AiadOy_XtN4?si=e-7pag6oOYo6ixxx" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Congratulations on reaching the final chapter! Here, we’ll introduce and briefly explore the powerful workflow features in **NocoBase**. This feature lets you automate tasks within the system, saving time and enhancing efficiency.

### Challenge Solution from the Previous Chapter

Before diving in, let’s quickly recap the solution to the last challenge. We successfully set up **comment permissions** for the "Partner" role as follows:

1. **Add Permission** : Allows users to post comments.
2. **View Permission** : Allows users to view all comments.
3. **Edit Permission** : Users can edit only their own comments.
4. **Delete Permission** : Users can delete only their own comments.

![](https://static-docs.nocobase.com/Solution/221734250582202415161612.png)

With these permissions, Tom can freely post comments, view others’ comments, and ensure that only he can edit or delete his own posts.

![](https://static-docs.nocobase.com/Solution/241734250764202415161912.png)

---

Now, let’s implement an automation: **whenever a task assignee is changed, the system will automatically send a notification to the new assignee, informing them of the task transfer**.

> **Workflow**: The Workflow Plugin is a powerful automation tool commonly used in Business Process Management (BPM) to design and configure business processes based on data models.
>
> By defining triggers and configuring process nodes, this plugin automates the flow of business processes, enabling efficient task management and data-driven operations.

### 7.1 Creating a Workflow

#### 7.1.1 Setting Up a Workflow in the Admin Page

First, switch to the **Root Role** – the system administrator role with all permissions. Then, navigate to the [**Workflow Module**](https://docs.nocobase.com/handbook/workflow).

![](https://static-docs.nocobase.com/Solution/001734250860202415162112.png)

Click the **“Add”** button in the top right corner to create a new workflow, and fill in the basic information:

- **Name**: Send a system notification when the assignee is changed.
- **Trigger Type**: Select "Collection Event."

![](https://static-docs.nocobase.com/Solution/151734250935202415162212.png)

#### 7.1.2 Explanation of Trigger Types

1. [**Collection Event**](https://docs.nocobase.com/handbook/workflow/triggers/collection): Triggers when changes occur within a collection (add, modify, delete). This is ideal for tracking updates to task fields, such as when the assignee changes.
2. [**Scheduled Task**](https://docs.nocobase.com/handbook/workflow/triggers/schedule): Automatically triggers at specified times, suitable for schedule-based automation.
3. [**Post-action Event**](https://docs.nocobase.com/handbook/workflow/triggers/post-action): Binds to an action button and triggers after a user action, like clicking "save" on a form.

In future cases, you may also find trigger types such as "Pre-action Event," "Custom Action Event," and "Approval," which can be unlocked through additional plugins.

In this scenario, we use the [**Collection Event**](https://docs.nocobase.com/handbook/workflow/triggers/collection) to monitor changes to the "Task Assignee" field in the "Task" collection. After submitting the workflow, click **Configure** to enter the workflow settings page.

![demov3N-37.gif](https://static-docs.nocobase.com/Solution/demoE3v1-41.gif)

---

### 7.2 Configuring Workflow Nodes

#### 7.2.1 Setting Trigger Conditions

Let’s begin building the automated notification process by configuring the first node and setting conditions to automatically activate the workflow under specific circumstances.

- **Collection**: Select "Task." (This collection triggers the workflow and pulls relevant data. We want the workflow to activate when the "Task" collection is updated.)
- **Trigger on**: Select "After adding or updating data."
- **Trigger Field**: Choose "Task Assignee."
- **Only triggers when match conditions**: Select "Task Assignee / ID" "exists," ensuring a notification is only sent when a task is assigned.
- **Preload associations**: Choose "Task Assignee," enabling its information to be used in the following steps.

![](https://static-docs.nocobase.com/Solution/demoE3v1-42.gif)

---

#### 7.2.2 Enabling the "In-app Message" Channel

Next, we’ll create a node to send notifications.

Before proceeding, we need to create an [“In-app Message” channel](https://docs.nocobase.com/handbook/notification-in-app-message) for notifications.

- Go back to Plugin Management, select "Notification Management," and create a task notification (task_message).
- After creating the channel, return to the workflow and add a “Notification” node.

![](https://static-docs.nocobase.com/Solution/demoE3v1-43.gif)

- **Node Configuration**:
  - **Channel**: Select "Task Notification."
  - **Receivers**: Choose “Trigger Variable / Trigger Data /Task Assignee / ID” to target the new assignee.
  - **Message Title**: Enter “Assignee Change Reminder.”
  - **Message Content**: Enter “You have been assigned as the new  task assignee.”

Once complete, click the toggle in the upper right to activate this workflow.

![](https://static-docs.nocobase.com/Solution/demoE3v1-44N%20-1.gif)

![](https://static-docs.nocobase.com/Solution/demoE3v1-44N%20-2.gif)

![](https://static-docs.nocobase.com/Solution/551734252475202415164712.png)

Configuration complete!

#### 7.2.3 Testing the Notification

It’s an exciting moment. Go back to the page, edit any task, change the assignee, and click submit. The system has now sent the notification!

![](https://static-docs.nocobase.com/Solution/001734252600202415165012.png)

![](https://static-docs.nocobase.com/Solution/141734252674202415165112.png)

---

That’s the basic workflow setup. However, there’s one more improvement to make:

The notification should dynamically insert task information so users know which task was reassigned.

### 7.3 Refining the Workflow

#### 7.3.1 Version Management

Return to the workflow configuration. You’ll notice the workflow interface is now grayed out and cannot be edited.

No worries. Click the ellipsis in the upper right corner > [**Duplicate to New Version**](https://docs.nocobase.com/handbook/workflow/advanced/revisions), and you’ll enter the new version’s configuration page. The previous version is retained, so by clicking the **Version** button, you can switch back to historical versions (note: executed workflow versions cannot be modified).

![](https://static-docs.nocobase.com/Solution/demoE3v1-45.gif)

#### 7.3.2 Enhancing Notification Content

Now, let’s personalize the notification by adding details about the task transfer.

- **Edit the Notification Node**.

Change the message content to: “Task 《【Task Name】》 has been reassigned to: 【Task Assignee / Nickname】.”

- Use the variable panel on the right to add the task name and Task Assignee fields.
- Then, click the toggle in the upper right to activate this version.

![](https://static-docs.nocobase.com/Solution/demoE3v1-46.gif)

With the updated workflow version activated, you’ll see the task name in the system notification upon the next test.

![](https://static-docs.nocobase.com/Solution/demoE3v1-47.gif)

---

### Summary

Fantastic! You’ve successfully created an automated workflow that triggers based on changes to task ownership. This feature not only saves time but also enhances team collaboration. At this point, our task management system has gained powerful capabilities.

---

### Conclusion and Next Steps

You’ve now completed a fully functional task management system from scratch – covering task creation, comments, role permissions, workflows, and system notifications.

The flexibility and extensibility of NocoBase open up limitless possibilities for you. In the future, you can explore more plugins, customize features, or create complex business logic. With this knowledge, you’ve mastered the basics and core concepts of NocoBase.

We look forward to seeing your next innovation! For any questions, feel free to consult the [NocoBase official documentation](https://docs.nocobase.com/) or join the [NocoBase community](https://forum.nocobase.com/) for discussions.

Keep exploring and unleash endless potential!
