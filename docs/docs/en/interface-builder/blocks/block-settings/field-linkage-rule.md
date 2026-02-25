# Field Linkage Rules

## Introduction

Field linkage rules allow for the dynamic adjustment of the state of fields in Form/Details blocks based on user actions. Currently, the blocks that support field linkage rules include:

- [Form Block](/interface-builder/blocks/data-blocks/form)
- [Details Block](/interface-builder/blocks/data-blocks/details)
- [Sub-form](/interface-builder/fields/specific/sub-form)

## Usage Instructions

### **Form Block**

In a Form block, linkage rules can dynamically adjust the behavior of fields based on specific conditions:

- **Control field visibility (show/hide)**: Decide whether the current field is displayed based on the values of other fields.
- **Set field as required**: Dynamically set a field as required or not required under specific conditions.
- **Assign value**: Automatically assign a value to a field based on conditions.
- **Execute specified JavaScript**: Write JavaScript according to business requirements.

### **Details Block**

In a Details block, linkage rules are mainly used to dynamically control the visibility (show/hide) of fields on the block.


![20251029114859](https://static-docs.nocobase.com/20251029114859.png)


## Property Linkage

### Assign Value

The `Assign value` action supports two modes:

- **Default value**: used to pre-fill values. Users can still edit it, and it typically takes effect only for new entries or when the field is empty.
- **Fixed value**: written by the system. When the rule runs, it may overwrite the current value, which is suitable for system-controlled fields like status.

:::info{title=Tip}
If the same field is configured in both `Field values` (Form block) and linkage rule assignments, linkage rule assignments take precedence. For more details, see [Field values](/interface-builder/blocks/block-settings/field-values).
:::

Example: When an order is checked as a supplementary order, the order status is automatically assigned the value 'Pending Review'.


![20251029115348](https://static-docs.nocobase.com/20251029115348.png)

![Linkage rule assign value - mode switch & value editor](https://static-docs.nocobase.com/placeholder.png)


### Required

Example: When the order status is 'Paid', the order amount field is required.


![20251029115031](https://static-docs.nocobase.com/20251029115031.png)


### Show/Hide

Example: The payment account and total amount are displayed only when the order status is 'Pending Payment'.


![20251030223710](https://static-docs.nocobase.com/20251030223710.png)



![20251030223801](https://static-docs.nocobase.com/20251030223801.gif)
