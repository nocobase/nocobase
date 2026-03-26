# Chapter 8: Knowledge Base - Tree Collection

<iframe width="800" height="436" src="https://www.youtube.com/embed/2Usn5osORz4?si=_XglvOoOXUlXvsqR" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

### 8.1 Welcome to a New Chapter

In this chapter, we embark on creating a knowledge base—a comprehensive module designed to help us manage and organize documents, tasks, and information seamlessly. By designing and implementing a tree-structured document collection, we’ll establish an efficient system for tracking document status, managing attachments, and linking related tasks.

### 8.2 Exploring Database Design

#### 8.2.1 Initial Design and Creating the Document Collection

We’ll begin with a straightforward database design by building a "Document Collection" to catalog all document information. Key fields in the Document Collection include:

* **Title**: Single line text.
* **Content**: Markdown(Vditor).
* **Document Status**: Single select, with options including Draft, Published, Archived, and Deleted.
* **Attachment**: Attachment, Allows adding files and images to enrich document content.
* **Related Task**: A many-to-one relationship field to link the document with a task for easy reference in task management.

![](https://static-docs.nocobase.com/Solution/331734255873202415174412.png)

As our system evolves, we’ll continue to add fields for more detailed document management.

#### 8.2.2 Constructing a Tree Structure for Directory Management

> A tree collection (provided by the plugin [plugin-collection-tree](https://docs.nocobase.com/handbook/collection-tree)), is a collection structure mirrors a tree, where each data item may have one or more child items, and those child items can, in turn, have their own descendants.

To ensure organization and hierarchy, we’ll structure our Document Collection as a [**Tree collection**](https://docs.nocobase.com/handbook/collection-tree), allowing for intuitive parent-child classification. This setup automatically generates the following fields:

![](https://static-docs.nocobase.com/Solution/381734255938202415174512.png)

- **Parent ID**: Identifies the parent document for the current document.
- **Parent**: A many-to-one field establishing parent-child relationships.
- **Children**: A one-to-many field that enables viewing all child documents under a parent document.
  ![](https://static-docs.nocobase.com/Solution/581734256018202415174612.png)

These fields are essential to maintaining the directory hierarchy, so it’s recommended not to alter them.

We’ll also establish an association with the Task Collection [(Many-to-One)](https://docs.nocobase.com/handbook/data-modeling/collection-fields/associations/m2o), complete with inverse field, so that document lists can be directly created within the task association popup.

### 8.3 Creating the Document Management Page

#### 8.3.1 Adding a New Document Management Menu

In the main system menu, add a new page—"Document Management", then select an appropriate icon. Next, create a table block for our Document Collection, enabling basic actions like Add, Delete, Edit, and Search, and input test data to validate the design of the data collection.

![](https://static-docs.nocobase.com/Solution/111734257351202415180912.png)

#### Exercise

1. Add a parent document named “Document 1” on the Document Management page.
2. Under “Document 1,” add a child document named “Chapter 1.”

#### 8.3.2 Converting to a Tree Table View

I know you're probably wondering why it's not a catalog tree structure.

By default, the table block displays as a regular table. Here’s how to convert it to a tree table view:

1. Click on the top right corner of the table block > Tree Table.

   You will notice that the moment you select it, a "Expand All" toggle appears below the Tree Table.

   At the same time, the previously created "Chapter One" disappears.
2. Click on the "Expand All" option below the Tree Table to activate it.

   Now, we can see the parent-child structure of the document displayed more intuitively, allowing us to easily view and expand all document levels.

   Let's proceed with the "Add Sub-record" action.

Tree table conversion complete!

![](https://static-docs.nocobase.com/Solution/291734257429202415181012.png)

![](https://static-docs.nocobase.com/Solution/321734257492202415201112.png)

#### 8.3.3 Configuring “Add Child Record”

To add child records, we’ll configure the necessary elements. When the Parent Record field is selected, it defaults to "read-only" as new entries are created within the current document directory.

![](https://static-docs.nocobase.com/Solution/351734262415202415193312.png)

If there is too much task data, you might find it particularly troublesome to assign related tasks. We can set a default value for task filtering, making it equal to the tasks associated with the parent record.

![](https://static-docs.nocobase.com/Solution/171734262577202415193612.png)

![](https://static-docs.nocobase.com/Solution/211734262761202415193912.png)

The default value may not take effect immediately, let's close and click again to see that it has been auto-filled~!

### 8.4 Configuring Form Templates and Task Associations

#### 8.4.1 Creating Table and Form [Templates](https://docs.nocobase.com/handbook/block-template)

To ease future management, save the Document Table along with its create/edit forms as [templates](https://docs.nocobase.com/handbook/block-template) for reuse on other pages.

![](https://static-docs.nocobase.com/Solution/571734263097202415194412.png)

#### 8.4.2 Displaying a Copied Document Table

In the Task view popup, [add a new tab](https://docs-cn.nocobase.com/manual/ui/pages#%E6%A0%87%E7%AD%BE%E9%A1%B5) titled "Documents." Within this tab, add a form block > Other Records > Documents > “Copy Template” > and import the previously created document table template. (Ensure you select [**Copy Template**](https://docs.nocobase.com/handbook/block-template)).

![](https://static-docs.nocobase.com/Solution/111734263351202415194912.png)

This method streamlines document list creation.

#### 8.4.3 Adjusting Task Associations

Since we copied an external table template, it’s not yet linked with the Task Collection. You might notice it displays all document data, which isn’t ideal.

This situation is quite common. If we have not created a corresponding relationship field but still need to display related data, we must manually link the two. (**Note:** We use a [copy of the template](https://docs.nocobase.com/handbook/block-template), not a [reference template](https://docs.nocobase.com/handbook/block-template); otherwise, all changes we make will synchronize with other tables block!)

- Data Display Association

We click on the top right corner of the table block and [Set the data scope"](https://docs.nocobase.com/handbook/ui/blocks/block-settings/data-scope) to:

【Task/ID】= 【Current Popup Record/ID】

![](https://static-docs.nocobase.com/Solution/581734263458202415195012.png)

![](https://static-docs.nocobase.com/Solution/291734263669202415195412.png)

Successfully, the documents retained within the table are those associated with our task.

- Add form block association.

Enter the Add Block screen:

For fields related to associated tasks, set the [default value](https://docs.nocobase.com/handbook/ui/fields/field-settings/default-value) to > [Parent Popup Record].

The parent popup is part of the “View” operation for the current task data and will directly link to the corresponding task data.

Setting it to [read-only (view mode)](https://docs.nocobase.com/handbook/ui/fields/field-settings/pattern)indicates that only the current task can be linked within this popup.

![](https://static-docs.nocobase.com/Solution/051734264005202415200012.png)

![](https://static-docs.nocobase.com/Solution/571734264117202415200112.png)

Done! Now, newly added and displayed items will all be associated with the document of the current task.

If you're attentive, you might add the association filter in “Edit” and “Add Subtask.”

To make the tree structure clearer and the Actions Column neater, let's move the title to the first column.

![](https://static-docs.nocobase.com/Solution/451734264225202415200312.png)

### 8.5 Filtering and Searching in Document Management

##### 8.5.1 Adding a [Filter Block](https://docs.nocobase.com/handbook/ui/blocks/filter-blocks/form)

Add a filter block to Documents to enable advanced search options.

- Add a filter block on the Document Management page.
- Select the form for filtering and drag it to the top.
- Check fields such as Title, Status, and Task as filter criteria.
- Add “Filter” and “Reset” actions.

This filter form acts as a search box, allowing for rapid document retrieval with keyword entry.

![](https://static-docs.nocobase.com/Solution/571734264297202415200412.png)

![](https://static-docs.nocobase.com/Solution/111734264491202415200812.png)

#### 8.5.2 [Connecting Data Blocks](https://docs.nocobase.com/handbook/ui/blocks/block-settings/connect-block)

At this point, you may notice that clicking yields no result. We need one final step: linking blocks with search functionality to each other.

- Click on **Settings** in the upper right corner of the block and select [**Connecting Data Blocks**](https://docs.nocobase.com/handbook/ui/blocks/block-settings/connect-block).

  ```
  Here, you’ll see a list of available blocks that can be linked.

  Since we created a document form, it will search for all data blocks related to the document table (there’s only one on this page) and display them as options.

  No need to worry about getting confused, as moving the mouse over an option will automatically focus the screen on the corresponding block.
  ```
- Click to enable the block you want to link and test the search.

![](https://static-docs.nocobase.com/Solution/demoE3v1-48.gif)

Click the configuration button in the top-right corner of the filter block to link it to the main data block of the document table. This way, whenever you set a condition in the filter block, the table block automatically updates the results based on the condition.

### 8.6 [Setting Permissions](https://docs.nocobase.com/handbook/acl) for the Knowledge Base

To protect documents and standardize management, assign permissions based on user roles, allowing different users to view, edit, or delete documents according to their [permissions](https://docs.nocobase.com/handbook/acl).

However, we will be upgrading the document database to add features for news and task announcements, allowing for more flexible permissions.

### 8.7 Summary and Next Steps

In this chapter, we built the foundation of a knowledge base, incorporating a Document Collection, [Tree Collection](https://docs.nocobase.com/handbook/collection-tree), and task associations. With added filter blocks and reusable templates, we’ve optimized document management for efficiency.

[Next](https://www.nocobase.com/en/tutorials/project-tutorial-task-dashboard-part-1), we’ll build a personal dashboard featuring data analysis [charts](https://docs.nocobase.com/handbook/data-visualization) and key information displays!

---

Keep exploring and creating endless possibilities! If you encounter any issues along the way, don’t forget to check the [NocoBase Documentation](https://docs.nocobase.com/) or join the [NocoBase Community](https://forum.nocobase.com/) for discussions and support.s
