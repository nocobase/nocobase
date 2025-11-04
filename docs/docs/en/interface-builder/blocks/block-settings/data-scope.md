# Set Data Scope

## Introduction

Setting a data scope defines default filter conditions for a data block. Users can flexibly adjust filters based on business needs, but no matter what operations are performed, the system will always apply the default conditions to ensure data stays within the defined scope.

## User Guide


![20251027110053](https://static-docs.nocobase.com/20251027110053.png)


The filter field supports selecting fields from the current collection and associated collections.


![20251027110140](https://static-docs.nocobase.com/20251027110140.png)


### Operators

Different types of fields support different operators. For example, text fields support operators like equals, not equals, and contains; number fields support operators like greater than and less than; while date fields support operators like is within and is before a specific date.


![20251027111124](https://static-docs.nocobase.com/20251027111124.png)


### Static Values

Example: Filter data by the order "Status".


![20251027111229](https://static-docs.nocobase.com/20251027111229.png)


### Variable Values

Example: Filter order data for the current user.


![20251027113349](https://static-docs.nocobase.com/20251027113349.png)


For more details, see [Variables](/interface-builder/variables)