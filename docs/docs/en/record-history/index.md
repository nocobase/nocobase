---
pkg: '@nocobase/plugin-record-history'
---

# Record History

## Introduction

The **Record History** plugin tracks data changes by automatically saving snapshots and differences of **create**, **update**, and **delete** operations. It helps users quickly review data modifications and audit operation activities.

![](https://static-docs.nocobase.com/202511011338499.png)

## Enabling Record History

### Add Collections and Fields

Open the Record History plugin settings and add the collections and fields you want to track.  
To improve efficiency and avoid redundant data, it’s recommended to include only essential fields such as **unique ID**, **createdAt**, **updatedAt**, **createdBy**, and **updatedBy**.  
Ordinary business fields usually do not need to be recorded.

![](https://static-docs.nocobase.com/202511011315010.png)

![](https://static-docs.nocobase.com/202511011316342.png)

### Sync Historical Data Snapshots

- For records created before history tracking is enabled, changes can only be logged after the first update generates a snapshot; the initial update or deletion will not be recorded.
- To preserve past data history, a one-time snapshot sync can be performed.
- The snapshot size per table = number of records × number of tracked fields.
- For large datasets, it is recommended to filter by data scope and sync only important records.

![](https://static-docs.nocobase.com/202511011319386.png)

![](https://static-docs.nocobase.com/202511011319284.png)

Click **“Sync Historical Snapshots”**, configure the fields and data scope, and start synchronization.

![](https://static-docs.nocobase.com/202511011320958.png)

The synchronization task will run in the background. You can refresh the list to check its completion status.

## Using the Record History Block

### Add a Block

Select the **Record History Block**, choose a target collection, and insert the corresponding history view.

![](https://static-docs.nocobase.com/202511011323410.png)

![](https://static-docs.nocobase.com/202511011331667.png)

If you’re adding a block inside a record detail modal, select **“Current Record”** to display the history specific to that record.

![](https://static-docs.nocobase.com/202511011338042.png)

![](https://static-docs.nocobase.com/202511011338499.png)

### Edit Description Templates

Click **Edit Template** in the block settings to configure the text template used for displaying operation history.

![](https://static-docs.nocobase.com/202511011340406.png)

You can define separate templates for **create**, **update**, and **delete** operations.  
For updates, you can further configure field changes template, either globally or per specific field.

![](https://static-docs.nocobase.com/202511011346400.png)

Variables can be used within templates.

![](https://static-docs.nocobase.com/202511011347163.png)

After editing, you can choose whether the template applies to **All record history blocks of the current table** or **Only this record history block**.

![](https://static-docs.nocobase.com/202511011348885.png)
