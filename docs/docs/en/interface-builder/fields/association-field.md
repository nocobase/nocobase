# Association Field Components

## Introduction

NocoBase's association field components are designed to help users better display and handle associated data. Regardless of the relationship type, these components are flexible and versatile, allowing users to select and configure them according to specific needs.

### Dropdown

For all association fields, except when the target collection is a file collection, the default component in edit mode is the dropdown. The dropdown options display the value of the title field, making it suitable for scenarios where associated data can be quickly selected by displaying key field information.


![20240429205659](https://static-docs.nocobase.com/20240429205659.png)


For more details, see [Dropdown](/interface-builder/fields/specific/select)

### Picker

The picker presents data in a popup modal. Users can configure the fields to be displayed in the picker (including fields from nested associations), allowing for more precise selection of associated data.


![20240429210824](https://static-docs.nocobase.com/20240429210824.png)


For more details, see [Picker](/interface-builder/fields/specific/picker)

### Sub-form

When dealing with more complex relationship data, using a dropdown or picker can be inconvenient. In such cases, users need to frequently open popups. For these scenarios, the sub-form can be used. It allows users to directly maintain the fields of the associated collection on the current page or in the current popup block without repeatedly opening new popups, making the workflow smoother. Multi-level relationships are displayed as nested forms.


![20251029122948](https://static-docs.nocobase.com/20251029122948.png)


For more details, see [Sub-form](/interface-builder/fields/specific/sub-form)

### Sub-table

The sub-table displays one-to-many or many-to-many relationship records in a table format. It provides a clear, structured way to display and manage associated data, and supports creating new data in bulk or selecting existing data to associate.


![20251029123042](https://static-docs.nocobase.com/20251029123042.png)


For more details, see [Sub-table](/interface-builder/fields/specific/sub-table)

### Sub-detail

Sub-detail is the corresponding component to the sub-form in read-only mode. It supports displaying data with nested multi-level relationships.


![20251030213050](https://static-docs.nocobase.com/20251030213050.png)


For more details, see [Sub-detail](/interface-builder/fields/specific/sub-detail)

### File Manager

The file manager is an association field component specifically used when the target collection of the relationship is a file collection.


![20240429222753](https://static-docs.nocobase.com/20240429222753.png)


For more details, see [File Manager](/interface-builder/fields/specific/file-manager)

### Title

The title field component is an association field component used in read-only mode. By configuring the title field, you can configure the corresponding field component.


![20251030213327](https://static-docs.nocobase.com/20251030213327.png)


For more details, see [Title](/interface-builder/fields/specific/title)