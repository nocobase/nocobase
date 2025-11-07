# Set Data Scope

## Introduction

Setting the data scope for an association field is similar to setting the data scope for a block. It sets default filter conditions for the associated data.

## Usage Instructions


![20251028211328](https://static-docs.nocobase.com/20251028211328.png)


### Static value

Example: Only non-deleted products can be selected for association.

> The field list contains fields from the target collection of the association field.


![20251028211434](https://static-docs.nocobase.com/20251028211434.png)


### Variable value

Example: Only products whose service date is later than the order date can be selected for association.


![20251028211727](https://static-docs.nocobase.com/20251028211727.png)


For more information about variables, see [Variables](/interface-builder/variables)

### Association Field Linkage

Linkage between association fields is achieved by setting the data scope.

Example: The Orders collection has a One-to-Many association field "Opportunity Product" and a Many-to-One association field "Opportunity". The Opportunity Product collection has a Many-to-One association field "Opportunity". In the order form block, the selectable data for "Opportunity Product" is filtered to show only the opportunity products associated with the currently selected "Opportunity" in the form.


![20251028212943](https://static-docs.nocobase.com/20251028212943.png)



![20240422154145](https://static-docs.nocobase.com/20240422154145.png)



![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)