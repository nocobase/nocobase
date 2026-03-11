---
pkg: "@nocobase/plugin-multi-space"
---

# Multi-workspace

## Introduction

The **Multi-workspace plugin** allows for multiple independent data spaces within a single application instance through logical isolation.

#### Use Cases
- **Multiple stores or factories**: Business processes and system configurations are highly consistent—such as unified inventory management, production planning, sales strategies, and report templates—but data for each business unit must remain independent.
- **Multi-organization or subsidiary management**: Multiple organizations or subsidiaries under a group company share the same platform, but each brand has independent customer, product, and order data.

## Installation

Find the **Multi-workspace** plugin in the Plugin Manager and enable it.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## User Manual

### Multi-workspace Management

After enabling the plugin, go to the **Users & Permissions** settings page and switch to the **Workspaces** panel to manage workspaces.

> By default, there is a built-in **Unassigned Space**, primarily used to view legacy data that has not yet been associated with a workspace.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### Create Workspace

Click the "Add workspace" button to create a new workspace:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### Assign Users

After selecting a created workspace, you can set the users belonging to that workspace on the right side:

> **Tip:** After assigning users to a workspace, you must **manually refresh the page** for the workspace switcher in the top right corner to update and display the latest workspaces.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### Switching and Viewing Workspaces

You can switch the current workspace in the top right corner.  
When you click the **eye icon** on the right (highlighted state), you can view data from multiple workspaces simultaneously.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### Multi-workspace Data Management

Once the plugin is enabled, the system will automatically pre-configure a **Workspace field** when creating a collection.  
**Only collections containing this field will be included in the workspace management logic.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

For existing collections, you can manually add a workspace field to enable workspace management:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### Default Logic

In collections that include a workspace field, the system automatically applies the following logic:

1. When creating data, it is automatically associated with the currently selected workspace;
2. When filtering data, it is automatically restricted to the data of the currently selected workspace.

### Categorizing Legacy Data into Workspaces

For data that existed before enabling the Multi-workspace plugin, you can categorize it into workspaces using the following steps:

#### 1. Add Workspace Field

Manually add a workspace field to the legacy collection:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. Assign Users to the Unassigned Space

Associate the users managing legacy data with all workspaces, including the **Unassigned Space**, to view data that has not yet been assigned to a workspace:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. Switch to View All Workspace Data

Select the option at the top to view data from all workspaces:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. Configure Legacy Data Assignment Page

Create a new page for legacy data assignment. Display the "Workspace field" in both the **List block** and **Edit form** to manually adjust the workspace assignment.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

Set the workspace field to editable mode:

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. Manually Assign Data Workspaces

Using the page mentioned above, manually edit the data to gradually assign the correct workspace to legacy data (you can also configure bulk editing yourself).