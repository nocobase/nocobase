# Details Block

## Introduction

The Details block is used to display the field values of each data record. It supports flexible field layouts and has built-in data action functions, making it convenient for users to view and manage information.

## Block Settings


![20251029202614](https://static-docs.nocobase.com/20251029202614.png)


### Block Linkage Rules

Control block behavior (e.g., whether to display it or execute JavaScript) through linkage rules.


![20251023195004](https://static-docs.nocobase.com/20251023195004.png)


For more details, see [Linkage Rules](/interface-builder/linkage-rule)

### Set Data Scope

Example: Only display paid orders


![20251023195051](https://static-docs.nocobase.com/20251023195051.png)


For more details, see [Set Data Scope](/interface-builder/blocks/block-settings/data-scope)

### Field Linkage Rules

Linkage rules in the Details block support dynamically setting fields to be shown/hidden.

Example: Do not display the amount when the order status is "Cancelled".


![20251023200739](https://static-docs.nocobase.com/20251023200739.png)


For more details, see [Linkage Rules](/interface-builder/linkage-rule)

## Configure Fields

### Fields from This Collection

> **Note**: Fields from inherited collections (i.e., parent collection fields) are automatically merged and displayed in the current field list.


![20251023201012](https://static-docs.nocobase.com/20251023201012.png)


### Fields from Associated Collections

> **Note**: Displaying fields from associated collections is supported (currently only for to-one relationships).


![20251023201258](https://static-docs.nocobase.com/20251023201258.png)


### Other Fields

- JS Field
- JS Item
- Divider
- Markdown


![20251023201514](https://static-docs.nocobase.com/20251023201514.png)


> **Tip**: You can write JavaScript to implement custom display content, allowing you to show more complex information.  
> For example, you can render different display effects based on different data types, conditions, or logic.


![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

### Field template

Field templates let you reuse the field section configuration (selected fields, layout, and field settings) in Details blocks. See [Field template](/interface-builder/fields/field-template).

![field-template-menu-20251228](https://static-docs.nocobase.com/field-template-menu-20251228.png)


## Configure Actions


![20251023200529](https://static-docs.nocobase.com/20251023200529.png)


- [Edit](/interface-builder/actions/types/edit)
- [Delete](/interface-builder/actions/types/delete)
- [Link](/interface-builder/actions/types/link)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Update Record](/interface-builder/actions/types/update-record)
- [Trigger Workflow](/interface-builder/actions/types/trigger-workflow)
- [JS Action](/interface-builder/actions/types/js-action)
- [AI Employee](/interface-builder/actions/types/ai-employee)
