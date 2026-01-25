# Sub-details

## Introduction

Sub-details is the component corresponding to the Sub-form in read-only mode. Compared to the Label and Title components, Sub-details can not only display more data from the current collection but can also be configured to display data from related collections. Multi-level relationship data is clearly displayed in the form of nested details.

## Usage

### Sub-details for To-Many Association Fields


![20251027221700](https://static-docs.nocobase.com/20251027221700.png)


Supports nested display of multi-level association fields. Example: Orders/Order Items/Products.


![20251027221924](https://static-docs.nocobase.com/20251027221924.png)


### Sub-details for To-One Association Fields


![20251027222059](https://static-docs.nocobase.com/20251027222059.png)


## Field Configuration Options

### Field Component


![20251027222243](https://static-docs.nocobase.com/20251027222243.png)



![20251027222347](https://static-docs.nocobase.com/20251027222347.png)


[Field Component](/interface-builder/fields/association-field): Switch to other read-only association field components, such as the Title field component, Sub-table (only supported for to-many association fields), etc.