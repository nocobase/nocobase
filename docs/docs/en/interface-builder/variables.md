# Variables

## Introduction

Variables are a set of tokens used to identify a value in the current context. They can be used in scenarios such as configuring block data scopes, field default values, linkage rules, and workflows.


![20251030114458](https://static-docs.nocobase.com/20251030114458.png)


## Currently Supported Variables

### Current User

Represents the data of the currently logged-in user.


![20240416154950](https://static-docs.nocobase.com/20240416154950.png)


### Current Role

Represents the role identifier (role name) of the currently logged-in user.


![20240416155100](https://static-docs.nocobase.com/20240416155100.png)


### Current Form

The values of the current form, used only in form blocks. Use cases include:

- Linkage rules for the current form
- Default values for form fields (only effective when adding new data)
- Data scope settings for association fields
- Field values configuration

#### Linkage rules for the current form


![20251027114920](https://static-docs.nocobase.com/20251027114920.png)


#### Default values for form fields (add form only)


![20251027115016](https://static-docs.nocobase.com/20251027115016.png)


<!-- 

![20240416171129_rec_](https://static-docs.nocobase.com/20240416171129_rec_.gif)

 -->

#### Data scope settings for association fields

Used to dynamically filter the options of a downstream field based on an upstream field, ensuring accurate data entry.

**Example:**

1. The user selects a value for the **Owner** field.
2. The system automatically filters the options for the **Account** field based on the selected Owner's **userName**.


![20251030151928](https://static-docs.nocobase.com/20251030151928.png)


<!-- 

![20240416171743_rec_](https://static-docs.nocobase.com/20240416171743_rec_.gif)

 -->

<!-- #### Field value assignment configuration for submit actions


![20240416171215_rec_](https://static-docs.nocobase.com/20240416171215_rec_.gif)

 -->

### Current item

`Current item` is used in sub-forms/sub-tables and other “list item” scenarios. It represents the data object of the current row/item.

Common use cases:

- Field values configuration in sub-forms/sub-tables (e.g. default values / fixed values)
- Linkage rules inside sub-forms
- Data scope for sub-association fields

You can also use `Index (starts from 0)` to get the position of the current item in the list, which is useful for calculations or distinguishing items.

![Variables - Current item & Index (starts from 0)](https://static-docs.nocobase.com/placeholder.png)

### Parent item

`Parent item` represents the parent object of the current item (such as the parent form record, or the upper-level association object).

Common use cases:

- Inherit values from the parent form to sub-form fields (e.g. `Parent item/Customer`, `Parent item/Project`)
- Read parent information in sub-form linkage rules

![Variables - Parent item](https://static-docs.nocobase.com/placeholder.png)

### Current Record

A record refers to a row in a collection, where each row represents a single record. The "Current Record" variable is available in the **linkage rules for row actions** of display-type blocks.

Example: Disable the delete button for documents that are "Paid".


![20251027120217](https://static-docs.nocobase.com/20251027120217.png)


### Current Popup Record

Popup actions play a very important role in NocoBase interface configuration.

- Popup for row actions: Each popup has a "Current Popup Record" variable, representing the current row record.
- Popup for association fields: Each popup has a "Current Popup Record" variable, representing the currently clicked association record.

Blocks within a popup can use the "Current Popup Record" variable. Related use cases include:

- Configuring the data scope of a block
- Configuring the data scope of an association field
- Configuring field values (such as default values) in forms for adding new data
- Configuring linkage rules for actions

<!-- #### Configuring the data scope of a block


![20251027151107](https://static-docs.nocobase.com/20251027151107.png)


#### Configuring the data scope of an association field


![20240416224641_rec_](https://static-docs.nocobase.com/20240416224641_rec_.gif)


#### Configuring default values for fields (in a form for adding new data)


![20240416223846_rec_](https://static-docs.nocobase.com/20240416223846_rec_.gif)


#### Configuring linkage rules for actions


![20240416223101_rec_](https://static-docs.nocobase.com/20240416223101_rec_.gif)


<!--
#### Field value assignment configuration for form submit actions


![20240416224014_rec_](https://static-docs.nocobase.com/20240416224014_rec_.gif)

 -->

<!-- ### Selected Table Records

Currently used only for the default value of form fields in the Add record action of a table block

#### Default value of form fields for the Add record action -->

<!-- ### Parent Record (Deprecated)

Used only in association blocks, representing the source record of the association data.

:::warning
"Parent Record" is deprecated. It is recommended to use the equivalent "Current Popup Record" instead.
:::

<!-- ### Date Variables

Date variables are dynamically parsable date placeholders that can be used in the system to set data scopes for blocks, data scopes for association fields, date conditions in action linkage rules, and default values for date fields. The parsing method of date variables varies depending on the use case: in assignment scenarios (such as setting default values), they are parsed into specific moments in time; in filtering scenarios (such as data scope conditions), they are parsed into time period ranges to support more flexible filtering.

#### Filtering Scenarios

Related use cases include:

- Setting date field conditions for block data scopes
- Setting date field conditions for association field data scopes
- Setting date field conditions for action linkage rules


![20250522211606](https://static-docs.nocobase.com/20250522211606.png)


Related variables include:

- Current time
- Yesterday
- Today
- Tomorrow
- Last week
- This week
- Next week
- Last month
- This month
- Next month
- Last quarter
- This quarter
- Next quarter
- Last year
- This year
- Next year
- Last 7 days
- Next 7 days
- Last 30 days
- Next 30 days
- Last 90 days
- Next 90 days

#### Assignment Scenarios

In assignment scenarios, the same date variable is automatically parsed into different formats based on the type of the target field. For example, when using Today to assign a value to different types of date fields:

- For Timestamp fields and DateTime with timezone fields, the variable is parsed into a complete UTC time string, such as 2024-04-20T16:00:00.000Z, which includes timezone information and is suitable for cross-timezone synchronization needs.

- For DateTime without timezone fields, the variable is parsed into a local time format string, such as 2025-04-21 00:00:00, without timezone information, which is more suitable for local business logic processing.

- For DateOnly fields, the variable is parsed into a pure date string, such as 2025-04-21, containing only the year, month, and day, with no time part.

The system intelligently parses the variable based on the field type to ensure the correct format during assignment, avoiding data errors or exceptions caused by type mismatches.


![20250522212802](https://static-docs.nocobase.com/20250522212802.png)


Related use cases include:

- Setting default values for date fields in form blocks
- Setting the value attribute for date fields in linkage rules
- Assigning values to date fields in submit buttons

Related variables include:

- Now
- Yesterday
- Today
- Tomorrow -->

### URL Query Parameters

This variable represents the query parameters in the current page URL. It is only available when a query string exists in the page URL. It is more convenient to use it with the [Link action](/interface-builder/actions/types/link).


![20251027173017](https://static-docs.nocobase.com/20251027173017.png)



![20251027173121](https://static-docs.nocobase.com/20251027173121.png)


### API token

The value of this variable is a string, which is a credential for accessing the NocoBase API. It can be used to verify the user's identity.

### Current Device Type

Example: Do not display the "Print template" action on non-desktop devices.


![20251029215303](https://static-docs.nocobase.com/20251029215303.png)
