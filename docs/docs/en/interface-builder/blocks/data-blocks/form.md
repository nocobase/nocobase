# Form Block

## Introduction

The Form block is an important block for building data entry and editing interfaces. It is highly customizable, using corresponding components to display the required fields based on the data model. Through event flows like linkage rules, the Form block can dynamically display fields. Additionally, it can be combined with workflows to trigger automated processes and handle data, further improving work efficiency or implementing logic orchestration.

## Add Form Block

- **Edit form**: Used to modify existing data.
- **Add form**: Used to create new data entries.


![20251023191139](https://static-docs.nocobase.com/20251023191139.png)


## Block Settings


![20251023191448](https://static-docs.nocobase.com/20251023191448.png)


### Block Linkage Rule

Control block behavior (such as whether to display it or execute JavaScript) through linkage rules.


![20251023191703](https://static-docs.nocobase.com/20251023191703.png)


For more details, see [Block Linkage Rule](/interface-builder/blocks/block-settings/block-linkage-rule)

### Field Linkage Rule

Control form field behavior through linkage rules.


![20251023191849](https://static-docs.nocobase.com/20251023191849.png)


For more details, see [Field Linkage Rule](/interface-builder/blocks/block-settings/field-linkage-rule)

### Layout

The Form block supports two layout modes, which can be set via the `layout` attribute:

- **horizontal**: This layout displays the label and content in a single line, saving vertical space, suitable for simple forms or cases with less information.
- **vertical** (default): The label is placed above the field. This layout makes the form easier to read and fill out, especially for forms with multiple fields or complex input items.


![20251023193638](https://static-docs.nocobase.com/20251023193638.png)


## Configure Fields

### Fields of this Collection

> **Note**: Fields from inherited collections (i.e., parent collection fields) are automatically merged and displayed in the current field list.


![20240416230739](https://static-docs.nocobase.com/20240416230739.png)


### Other Fields


![20251023192559](https://static-docs.nocobase.com/20251023192559.png)


- Write JavaScript to customize the display content and show complex information.


![20251023192935](https://static-docs.nocobase.com/20251023192935.png)

### Field template

Field templates let you reuse the field section configuration (selected fields, layout, and field settings) in Form blocks. See [Field template](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)


## Configure Actions


![20251023193231](https://static-docs.nocobase.com/20251023193231.png)


- [Submit](/interface-builder/actions/types/submit)
- [Trigger workflow](/interface-builder/actions/types/trigger-workflow)
- [JS action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)
