# Set Data Scope

## Introduction

Setting a data scope means defining default filter conditions for a block. Users can flexibly adjust the data scope according to business needs, but regardless of any filtering operations performed, the system will automatically apply this default filter condition, ensuring the data always remains within the specified scope's limits.

## User Guide


![20251027110053](https://static-docs.nocobase.com/20251027110053.png)


The filter field supports selecting fields from the current collection and associated collections.


![20251027110140](https://static-docs.nocobase.com/20251027110140.png)


### Operators

Different types of fields support different operators. For example, text fields support operators like equals, not equals, and contains; number fields support operators like greater than and less than; while date fields support operators like is within and is before a specific date.


![20251027111124](https://static-docs.nocobase.com/20251027111124.png)


### Static Value

Example: Filter data by the order "Status".


![20251027111229](https://static-docs.nocobase.com/20251027111229.png)


### Variable Value

Example: Filter order data for the current user.


![20251027113349](https://static-docs.nocobase.com/20251027113349.png)


For more on variables, see [Variables](/interface-builder/variables)