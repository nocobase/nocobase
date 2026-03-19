# Chapter 10: Dashboard Filters & Conditions

<iframe width="800" height="436" src="https://www.youtube.com/embed/TyV-9HHE4e8?si=e6zBGmmYVu4ms-4Q" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

In this chapter, we will guide you step by step through the next part of creating a task dashboard. If you have any questions, feel free to consult the forums at any time.

Let’s start this exploration journey by reviewing the content from the previous chapter!

### 10.1 Reveal the Previous Chapter's Solutions

#### 10.1.1 Status and Links

First, we need to add navigation links for data in different statuses to enable quick access. Below is the link structure for each status:

(Assume the base link is `http://xxxxxxx/admin/hliu6s5tp9xhliu6s5tp9x`)

##### Mystery Solved


| Status         | Link                                                   |
| -------------- | ------------------------------------------------------ |
| Not started    | hliu6s5tp9xhliu6s5tp9x?task_status=Not started</br>    |
| In progress    | hliu6s5tp9xhliu6s5tp9x?task_status=In progress</br>    |
| To be reviewed | hliu6s5tp9xhliu6s5tp9x?task_status=To be reviewed</br> |
| Completed      | hliu6s5tp9xhliu6s5tp9x?task_status=Completed</br>      |
| Cancelled      | hliu6s5tp9xhliu6s5tp9x?task_status=Cancelled</br>      |
| Archived       | hliu6s5tp9xhliu6s5tp9x?task_status=Archived</br>       |

#### 10.1.2 Adding a Multi-Select Option for Assignee

1. **Create a [Custom Fields](https://docs.nocobase.com/handbook/data-visualization/user/filter#custom-fields):** Add a "Assignee" field of type "multi-select," and populate it with members’ nicknames (or usernames) to facilitate quick assignment of tasks.

![](https://static-docs.nocobase.com/Solution/441734278924202416000812.png)

2. **Configure the Report:** Set up “Task Assignee / Nickname (Username)-  contains - Current Filter / Assignee” as a filter condition to quickly locate tasks associated with the selected assignee.

![](https://static-docs.nocobase.com/Solution/291734279089202416001112.png)

Perform several filter tests to confirm proper functionality.

![](https://static-docs.nocobase.com/Solution/431734279283202416001412.png)

---

### 10.2 Associating the Dashboard with Users

Content can be displayed based on different users. Here’s how to do it:

1. **Set the Default Value of the "Assignee" Field to "Current User/Nickname (Username)":** This allows the system to automatically display tasks related to the current user, improving operational efficiency.

![](https://static-docs.nocobase.com/Solution/441734279344202416001512.png)

![](https://static-docs.nocobase.com/Solution/101734279430202416001712.png)

2. **After Refreshing the Page:** The dashboard will automatically load data associated with the currently logged-in user. (Don’t forget to add user filter conditions to the relevant charts.)

![](https://static-docs.nocobase.com/Solution/191734279499202416001812.png)

---

### 10.3 Redesigning Task Filtering

Some users may notice a design flaw:
When filtering by status directly in the table block's "Set the Data Scope," tasks are prematurely restricted to a specific status. When attempting to filter by a different status later, the data appears empty!

Here’s how to resolve this by changing the filtering approach:

1. **Remove the Data Filtering Method:** Prevent status data from being locked into a specific range, allowing for flexible filtering needs.

![](https://static-docs.nocobase.com/Solution/591734279599202416001912.png)

2. **Configure Default Values in the Filtering Form Block:**

Do you remember our configured [Filter blocks](https://docs.nocobase.com/handbook/ui/blocks/filter-blocks/form)?

Create a form block for task table filtering block and configure **status** and other necessary fields to populate variables from the URL. (Ensure it connects to the task table block that needs filtering.)

- Set the default value of the status field to `URL search params/task_status`.

![](https://static-docs.nocobase.com/Solution/521734279772202416002212.png)

![](https://static-docs.nocobase.com/Solution/331734279873202416002412.png)

![](https://static-docs.nocobase.com/Solution/201734280160202416002912.png)

3. **Test the New Filtering Functionality:** Dynamically switch status filters as needed.

![](https://static-docs.nocobase.com/Solution/demoE3v1-50.gif)

- **Optional:** To focus each user on their tasks, set the default value of the "Assignee" field to "Current User."

---

### 10.4 News, Notifications, and Information Highlights

Let’s enhance the document library to display essential information on the dashboard.

In long-term document management, diverse requirements often emerge as the volume of materials grows:

- **News:** Highlight project updates, achievements, and milestones.
- Temporary announcements/reminders.

#### 10.4.1 Hot Information (News)

1. **Add a "Hot Information" Field:** Add a checkbox field named "Hot Information" in the document table to mark whether the document is significant news.

![](https://static-docs.nocobase.com/Solution/081734280628202416003712.png)

2. **Add and Select Document Information:** Choose a document and enable the "Hot Information" checkbox in the edit form.

![](https://static-docs.nocobase.com/Solution/331734280773202416003912.png)

3. **Create a "List" Block:** Go back to the dashboard and create a ["List" block](https://docs.nocobase.com/handbook/ui/blocks/data-blocks/list) to display the document table.

![](https://static-docs.nocobase.com/Solution/361734280836202416004012.png)

Drag it to the right, showing "Creation Date" and "Title." Adjust field widths and disable "Show Title."

![](https://static-docs.nocobase.com/Solution/011734281041202416004412.png)

4. **Display Hot Information:**

In order to reflect real-time, we can show the time at the same time.

![](https://static-docs.nocobase.com/Solution/021734281102202416004512.png)

![](https://static-docs.nocobase.com/Solution/131734281173202416004612.png)

Arrange in descending order by creation date to showcase the latest news.

![](https://static-docs.nocobase.com/Solution/551734281335202416004812.png)

![](https://static-docs.nocobase.com/Solution/291734281369202416004912.png)

A simple hot information section is now ready, allowing team members to keep up with critical project progress!

![](https://static-docs.nocobase.com/Solution/301734281430202416005012.png)

#### 10.4.2 Announcements Notification

The next step involves creating a straightforward announcement feature. This temporary notification doesn’t require long-term display or project tracking—it’s just for reminders or alerts about temporary matters.

1. **Create a [Markdown Block](https://docs.nocobase.com/handbook/ui/blocks/other-blocks/markdown):** Use Markdown syntax to add announcement content to any area of the dashboard.

![](https://static-docs.nocobase.com/Solution/231734281783202416005612.png)

For practical use of Markdown, you can refer to our official Demo, official documentation, or the[ “Lightweight Documentation” tutorial](https://www.nocobase.com/en/tutorials).

As an simple example, based on the HTML language written "A gorgeoAus announcement" to demonstrate the power of the [Markdown block](https://docs.nocobase.com/handbook/ui/blocks/other-blocks/markdown).

- Sample code:

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 10px; padding: 10px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 1.5em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Important Bulletin</h1>
    <p style="font-size: 0.8em; line-height: 1.2; color: #333;">Dear Colleagues: </p>
    <p style="font-size: 0.8em; line-height: 1.2;">In order to improve work efficiency, we will conduct an all-staff training in <span style="color: red; font-weight: bold; font-size: 1.2em;">November 10, 2024</span>.</p>
    <p style="font-size: 0.8em; line-height: 1.2; font-style: italic;">Thank you for your cooperation!</p>
    <p style="font-size: 0.8em; line-height: 1.2;">With best wishes</p>
    <p style="font-size: 0.8em; line-height: 1.2;">Management Team</p>
</div>
```

![](https://static-docs.nocobase.com/Solution/011734282061202416010112.png)

### 10.5 Summary

By following the configuration steps above, we successfully created a personalized dashboard that enables team members to efficiently manage tasks, monitor project progress, and promptly receive announcements and notifications.

From status filtering and Assignee settings to hot information display, these features aim to optimize user experience and enhance system convenience and flexibility.

With our personalized dashboard now ready, we invite you to explore and adapt it to your unique needs, let us step into [next chapter](https://www.nocobase.com/en/tutorials/project-tutorial-subtasks-and-work-hours-calculation)!

---

Keep exploring and creating endless possibilities! If you encounter any issues along the way, don’t forget to check the [NocoBase Documentation](https://docs.nocobase.com/) or join the [NocoBase Community](https://forum.nocobase.com/) for discussions and support.
