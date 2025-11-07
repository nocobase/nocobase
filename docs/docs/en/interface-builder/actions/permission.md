# Action Permissions

## Introduction

In NocoBase 2.0, action permissions are currently mainly controlled by collection resource permissions:

- **Collection Resource Permission**: Used to uniformly control the basic action permissions of different roles for a collection, such as Create, View, Update, and Delete. This permission applies to the entire collection under the data source, ensuring that a role's corresponding action permissions for that collection remain consistent across different pages, popups, and blocks.
<!-- - **Independent Action Permission**: Used for fine-grained control over which actions are visible to different roles, suitable for managing permissions for specific actions like Trigger Workflow, Custom Request, External Link, etc. This type of permission is suitable for action-level permission control, allowing different roles to perform specific actions without affecting the permission configuration of the entire collection. -->

### Collection Resource Permission

In the NocoBase permission system, collection action permissions are basically divided along CRUD dimensions to ensure consistency and standardization in permission management. For example:

- **Create Permission**: Controls all create-related actions for the collection, including add actions, duplicate actions, etc. As long as a role has the create permission for this collection, its add, duplicate, and other create-related actions will be visible on all pages and in all popups.
- **Delete Permission**: Controls the delete action for this collection. The permission remains consistent, whether it's a bulk delete action in a table block or a delete action for a single record in a details block.
- **Update Permission**: Controls update-type actions for this collection, such as edit actions and update record actions.
- **View Permission**: Controls the data visibility of this collection. Related data blocks (Table, List, Details, etc.) are only visible when the role has view permission for this collection.

This universal permission management method is suitable for standardized data permission control, ensuring that for the `same collection`, the `same action` has `consistent` permission rules across `different pages, popups, and blocks`, providing uniformity and maintainability.

#### Global Permissions

Global action permissions apply to all collections under the data source, categorized by resource type as follows


![20250306204756](https://static-docs.nocobase.com/20250306204756.png)


#### Specific Collection Action Permissions

Specific collection action permissions override the general permissions of the data source, further refining action permissions and allowing for custom permission configurations for accessing resources of a specific collection. These permissions are divided into two aspects:

1. Action Permissions: Action permissions include add, view, edit, delete, export, and import actions. These permissions are configured based on the data scope dimension:

   - All records: Allows users to perform actions on all records in the collection.
   - Own records: Restricts users to perform actions only on the data records they have created.

2. Field Permissions: Field permissions allow for configuring permissions for each field in different actions. For example, some fields can be configured to be view-only and not editable.


![20250306205042](https://static-docs.nocobase.com/20250306205042.png)


<!-- ### Independent Action Permissions

> **Note**: This feature is supported **from v1.6.0-beta.13 onwards**

Unlike unified action permissions, independent action permissions only control the action itself, allowing the same action to have different permission configurations in different locations.

This permission method is suitable for personalized actions, for example:

Trigger workflow actions may need to call different workflows on different pages or blocks, thus requiring independent permission control.
Custom actions in different locations execute specific business logic and are suitable for separate permission management.

Currently, independent permissions can be configured for the following actions

- Popup (controls the visibility and action permissions of the popup action)
- Link (restricts whether a role can access external or internal links)
- Trigger workflow (for calling different workflows on different pages)
- Actions in the action panel (e.g., scan code, popup action, trigger workflow, external link)
- Custom request (sends a request to a third party)

Through independent action permission configuration, you can manage the action permissions of different roles more granularly, making permission control more flexible.


![20250306215749](https://static-docs.nocobase.com/20250306215749.png)


If no role is set, it is visible to all roles by default.


![20250306215854](https://static-docs.nocobase.com/20250306215854.png)

 -->

## Related Documentation

[Configure Permissions]
<!-- (/users-and-permissions) -->