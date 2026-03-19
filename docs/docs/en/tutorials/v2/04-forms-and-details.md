# Chapter 4: Forms & Details — Input, Display, All in One

In the last chapter, we built the ticket list and used a quick form to enter test data. In this chapter, we'll **refine the form experience** — optimize [Form block](/interface-builder/blocks/data-blocks/form) field layouts, add [Details blocks](/interface-builder/blocks/data-blocks/details), configure [linkage rules](/interface-builder/linkage-rules), and use [change history](https://docs.nocobase.com/record-history/) to track every modification.

:::tip
Section 4.4 "Change History" requires the [Professional edition](https://www.nocobase.com/en/commercial). Skipping it won't affect later chapters.
:::

## 4.1 Refining the New Ticket Form

In the last chapter, we quickly created a working "Add new" form. Now let's refine it — adjust field order, set default values, and optimize the layout. If you skipped the quick form in the previous chapter, no worries — we'll walk through creating one from scratch here.

### Adding the "Add new" Action Button

1. Make sure you're in [UI Editor](/get-started/how-nocobase-works) mode (top-right toggle is on).
2. Go to the "All Tickets" page, and click **"[Actions](/interface-builder/actions)"** above the Table block.
3. Check the **"Add new"** action button.
4. An "Add new" button will appear above the table. Clicking it opens a [popup](/interface-builder/actions/pop-up).

![04-forms-and-details-2026-03-13-09-43-54](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-43-54.png)

### Configuring the Form in the Popup

1. Click the "Add new" button to open the popup.
2. In the popup, click **"Add block" -> Data blocks -> [Form (Add new)](/interface-builder/blocks/data-blocks/form)**.
3. Select **"Current collection"**. The popup already knows which collection it's associated with — no need to specify manually.

   ![04-forms-and-details-2026-03-13-09-44-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-44-50.png)
4. In the form, click **"[Fields](/data-sources/field)"** and check the following fields:

| Field | Configuration Notes |
|-------|-------------------|
| Title | Required (auto-inherited) |
| Description | Rich text input |
| Status | Dropdown select (we'll set a default via linkage rules later) |
| Priority | Dropdown select |
| Category | A relation field that automatically appears as a dropdown selector |
| Submitter | Relation field (we'll set a default via linkage rules later) |
| Assignee | Relation field |

![04-forms-and-details-2026-03-13-12-44-49](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-44-49.png)

You'll notice a red asterisk `*` next to "Title" automatically — because we set it as required when creating the field in Chapter 2. Forms automatically inherit required rules from the [collection](/data-sources/main/collection)'s field settings; no extra configuration needed.

![04-forms-and-details-2026-03-13-12-46-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-46-34.png)

> **Tip**: If a field isn't required at the collection level but you want it required in this specific form, you can set it individually in the field's settings.

![04-forms-and-details-2026-03-13-12-47-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-47-26.png)

### Adding the Submit Button

1. Below the Form block, click **"Actions"**.
2. Check the **"Submit"** button.

![04-forms-and-details-2026-03-13-16-30-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-30-06.png)

3. After filling in the form, users can click Submit to create a new ticket.

![04-forms-and-details-2026-03-13-16-32-19](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-32-19.gif)

## 4.2 Linkage Rules: Defaults & Field Linkage

Some fields should be auto-filled (e.g., Status defaults to "Pending"), while others need to change dynamically based on conditions (e.g., urgent tickets require a description). The default value feature in 2.0 is still evolving, so in this tutorial we'll use **Linkage Rules** for both default values and field linkage.

1. Click the **block settings** icon (three-line icon) in the top-right corner of the Form block.
2. Find **"Linkage rules"** — clicking it opens a configuration panel in the sidebar.

![04-forms-and-details-2026-03-13-16-43-35](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-43-35.png)

### Setting Default Values

Let's first set default values for "Status" and "Submitter":

1. Click **"Add linkage rule"**.
2. **Leave the condition empty** — an unconditional linkage rule executes immediately when the form loads.

![04-forms-and-details-2026-03-13-16-47-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-47-34.png)

3. Configure the Actions:
   - Status field -> **Set default value** -> Pending
   - Submitter field -> **Set default value** -> Current user

> **Important notes on setting values**: Always select **"Current form"** as the data source first. For relation fields (like Category, Submitter, Assignee — any many-to-one field), you must select the object property itself, not its expanded sub-fields.
>
> When selecting variables (like "Current user"), first **single-click** to select it, then **double-click** to fill it into the selection bar.

![04-forms-and-details-2026-03-13-17-01-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-01-06.png)

![04-forms-and-details-2026-03-13-17-02-20](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-02-20.png)

![04-forms-and-details-2026-03-13-17-03-41](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-03-41.png)

If you want a field to be non-editable by the submitter (e.g., Status), you can set its **"Display mode"** to **"Readonly"** in the field settings.

![04-forms-and-details-2026-03-13-17-22-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-22-15.png)

> **Three display modes**: Editable, Readonly (editing disabled but field appearance preserved), and Easy-reading (displays as plain text only).

![04-forms-and-details-2026-03-13-12-54-53](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-54-53.png)

### Urgent Ticket Requires Description

Next, add a conditional linkage rule: when a user selects Priority as "Urgent", the Description field becomes **required**, reminding the submitter to clearly describe the situation.

1. Click **"Add linkage rule"**.

![04-forms-and-details-2026-03-13-17-07-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-07-34.png)

2. Configure the rule:
   - **Condition**: Current form / Priority **equals** Urgent
   - **Actions**: Description field -> set to **Required**

![04-forms-and-details-2026-03-13-17-08-46](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-08-46.png)

![04-forms-and-details-2026-03-13-17-18-16](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-18-16.png)

3. Save the rule.

Now test it: select Priority as "Urgent" and a red asterisk `*` will appear next to the Description field, indicating it's required. Select any other priority and it reverts to optional.

![04-forms-and-details-2026-03-13-17-20-18](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-20-18.gif)

Finally, apply what we've learned and adjust the layout a bit.

![04-forms-and-details-2026-03-13-17-25-55](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-25-55.png)

> **What else can linkage rules do?** Beyond setting defaults and controlling required status, they can also show/hide fields and dynamically assign values. For example: when Status is "Closed", hide the Assignee field. We'll explore more in later chapters as we encounter these scenarios.

## 4.3 Details Block

In the last chapter, we added a "View" button to table rows that opens a Drawer. Now let's configure what goes inside the Drawer.

1. In the table, click the **"View"** button on any row to open the Drawer.
2. In the Drawer, click **"Add block" -> Data blocks -> [Details](/interface-builder/blocks/data-blocks/details)**.
3. Select **"Current collection"**.

![04-forms-and-details-2026-03-13-17-27-02](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-27-02.png)

4. In the Details block, click **"Fields"** with this layout:

| Area | Fields |
|------|--------|
| Top | Title, Status (tag style) |
| Main body | Description (rich text area) |
| Side info | Category name, Priority, Submitter, Assignee, Created at |

How to add a large title? Select Fields > Markdown > Edit Markdown > in the editing area, select a variable > Current record > Title. This dynamically inserts the record's title into a Markdown block. Delete the default text and use Markdown syntax to make it a heading (add `##` followed by a space before it).

![04-forms-and-details-2026-03-13-17-36-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-36-26.png)

![04-forms-and-details-2026-03-13-17-39-51](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-39-51.png)

Now the original Title field can be removed. Adjust the details layout:

![04-forms-and-details-2026-03-13-17-43-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-43-36.png)

> **Tip**: You can drag multiple fields onto the same row for a more compact and visually appealing layout.

5. In the Details block's **"Actions"**, check the **"Edit"** button so users can jump straight from the details view into edit mode.

![04-forms-and-details-2026-03-13-17-45-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-45-15.png)

### Configuring the Edit Form

Click the "Edit" button and a new popup opens — it needs an edit form inside. The edit form has nearly the same fields as the "Add new" form. Do we really have to check all those fields again from scratch?

Nope. Let's **save the "Add new" form as a template** first, then the edit form can reference it directly.

**Step 1: Go back to the "Add new" form and save as template**

1. Close the current drawer, go back to the ticket list, and click "Add new" to open the form.
2. Click the **block settings** icon (three-line icon) at the top-right of the Form block, and find **"Save as template"**.

![04-forms-and-details-2026-03-13-17-47-21](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-21.png)

3. Click save — it defaults to **"Reference"**. All forms referencing this template share the same configuration. Update one place and all stay in sync.

![04-forms-and-details-2026-03-13-17-47-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-44.png)


![04-forms-and-details-2026-03-13-18-39-05](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-39-05.png)

> Since our ticket form isn't complex, "Reference" is simpler to maintain. If you choose "Duplicate", each form gets an independent copy that can be modified separately.

**Step 2: Reference the template in the edit popup**

1. Go back to the details drawer or the table's row actions, and click the "Edit" button to open the edit popup.

You might think: just use **"Add block -> Other blocks -> Block templates"** to create the form, right? Try it and you'll find — this creates an **"Add new" form**, and the fields aren't actually populated. This is a common pitfall.

![04-forms-and-details-2026-03-13-17-59-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-59-36.png)

The correct approach:

2. In the popup, click **"Add block" -> Data blocks -> Form (Edit)** to create an edit form block first.
3. In the edit form, click **"Fields" -> "Field templates"**, and select the template you saved earlier.
4. All fields will be populated at once, matching the "Add new" form exactly.
5. Don't forget to add a **"Submit"** action button so users can save their changes.

![04-forms-and-details-2026-03-13-18-05-13](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-05-13.png)

![04-forms-and-details-2026-03-13-18-15-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-15-11.gif)

Want to add a field later? Just modify the template once — both the "Add new" and edit forms update automatically.

### Quick Editing: Change Data Without Opening a Popup

Besides popup editing, NocoBase also supports **quick editing** directly in the table — no popups needed, just hover and click.

There are two places to enable it:

- **Table block level**: Click the Table block's **block settings** (three-line icon), find **"Quick editing"**, and toggle it on. This enables quick editing for all fields in the table.
- **Individual field level**: Click a column's field settings, find **"Quick editing"**, and toggle it on per field.

![04-forms-and-details-2026-03-13-18-20-07](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-20-07.png)

Once enabled, hovering over a table cell reveals a small pencil icon. Click it to open an inline editor for that field — changes save automatically.

![04-forms-and-details-2026-03-13-18-21-09](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-21-09.gif)

> **When is this useful?** Quick editing is perfect for batch updates like changing status or assignee. For example, an admin browsing the ticket list can click the "Status" column to quickly change a ticket from "Pending" to "In Progress" without opening each one individually.

## 4.4 Enabling Change History

:::info Commercial Plugin
"[Record History](https://docs.nocobase.com/record-history/)" is included in the NocoBase [Professional edition](https://www.nocobase.com/en/commercial) and requires a commercial license. If you're using the Community edition, feel free to skip this section — it won't affect later chapters.
:::

One of the most important aspects of a ticket system: **who changed what and when must be traceable**. NocoBase's "Record History" plugin automatically logs every data change.

### Configuring Change History

1. Go to **Settings -> Plugin manager** and make sure the "Record History" plugin is enabled.

![04-forms-and-details-2026-03-13-18-22-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-22-44.png)

2. Enter the plugin configuration page and click **"Add collection"**, then select **"Tickets"**.
3. Choose which fields to track: **Title, Status, Priority, Assignee, Description**, etc.

![04-forms-and-details-2026-03-13-18-25-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-25-11.png)

> **Recommendation**: You don't need to track every field. Fields like ID and Created at that are never manually changed don't need to be tracked. Only record changes to fields that matter for the business.

4. Back in the settings, click **"Sync history data snapshot"**. The plugin will automatically create an initial history record for all existing tickets. Every subsequent change will add a new history entry.

![04-forms-and-details-2026-03-13-18-27-01](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-27-01.png)

![04-forms-and-details-2026-03-13-18-28-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-28-50.png)

### Viewing History in the Details Page

1. Go back to the ticket details Drawer (click the "View" button on a table row).
2. In the Drawer, click **"Add block" -> Record History**.
3. Select **"Current collection"** and choose **"Current record"** as the data source.
4. A timeline will appear at the bottom of the details page, clearly showing every change: who changed which field from what value to what value, and when.

![04-forms-and-details-2026-03-13-18-31-45](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-31-45.png)

![04-forms-and-details-2026-03-13-18-33-00](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-33-00.gif)

This way, even if a ticket passes through multiple people, every change is crystal clear.

## Summary

In this chapter, we completed the full data lifecycle:

- **Form** — Users can submit new tickets with default values and validation
- **Linkage rules** — Urgent tickets automatically require a description
- **Details block** — Clearly displays a ticket's complete information
- **[Change history](/collection-templates/audit-log)** — Automatically tracks every modification for worry-free auditing (commercial plugin, optional)

From "visible" to "enterable" to "traceable" — our ticket system now has basic usability.

## Related Resources

- [Form Block](/interface-builder/blocks/data-blocks/form) — Form block configuration guide
- [Details Block](/interface-builder/blocks/data-blocks/details) — Details block setup
- [Linkage Rules](/interface-builder/linkage-rules) — Field linkage configuration
