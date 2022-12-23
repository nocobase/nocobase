# Actions

An `action` is a collection of actions that accomplish a specific goal. An `action` is used in NocoBase to process data or communicate with the server. Actions are usually triggered by clicking a button.

## Action types

NocoBase currently supports more than 10 types of actions, and more can be supported in the future by way of plugins.

| Name | Description |
| --- | --- |
| Filter | Specifies the range of data to be displayed |
| Add | Opens a popup window for adding new data, which usually contains a form block. |
| View | Opens a popup window to view the specified data, which usually contains a detail block. |
| Edit | Opens a popup window to modify the specified data, which usually contains a form block. |
| Delete | Opens a dialog box to delete the specified data, and then delete it after confirmation. |
| Export | Exports data to Excel, often combined with filtering. |
| Print | Opens a browser print window to print the specified data, often combined with a detail block. |
| Submit | Submit the data of the specified form block to the server. |
| Refresh | Refreshes the data in the current block. |
| Import | Import data from an Excel template |
| Bulk Edit | Batch Edit Data |
| Bulk Update | Batch Update Data |
| Popup | Open a popup window or drawer in which you can place blocks |
| Update record | Automatically update specified fields when clicked |
| Customize request | Send requests to third parties |

## Configure actions

In UI Editor mode, move the mouse over an action button and the configuration items supported by that action will appear in the upper right corner. For example, for the filter action.

![action-config-5.jpg](./actions/action-config-5.jpg)