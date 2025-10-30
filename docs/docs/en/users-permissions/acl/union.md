# Role Union

Role union is a permission management mode. Based on system settings, system developers can choose to use independent roles, allow role union, or only use role union to meet different permission requirements.


![20250312184651](https://static-docs.nocobase.com/20250312184651.png)


## Independent Roles

The system defaults to independent roles: role union is not used, and users need to switch between their owned roles one by one.


![20250312184729](https://static-docs.nocobase.com/20250312184729.png)


![20250312184826](https://static-docs.nocobase.com/20250312184826.png)


## Allow Role Union

Allows system developers to use role union, meaning they can use the permissions of all their owned roles simultaneously, while also allowing users to switch between their roles one by one.


![20250312185006](https://static-docs.nocobase.com/20250312185006.png)


## Only Role Union

Forces users to only use role union, and they cannot switch roles one by one.


![20250312185105](https://static-docs.nocobase.com/20250312185105.png)


## Role Union Rules

The union is to grant the maximum permissions of all roles. The following explains how to determine role permissions when role settings for the same item conflict.

### Action Permission Merging

Example: Role 1 (role1) is configured to allow UI & Menu, Role 2 (role2) is configured to allow installing, activating, and disabling plugins.


![20250312190133](https://static-docs.nocobase.com/20250312190133.png)



![20250312190352](https://static-docs.nocobase.com/20250312190352.png)


Logging in with the **All Permissions** role, the user will have both of these permissions simultaneously.


![20250312190621](https://static-docs.nocobase.com/20250312190621.png)


### Data Scope Merging

#### Data Rows

Scenario 1: Multiple roles set conditions on the same field

Role A, configured condition: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B, configured condition: Age > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

After merging:

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Scenario 2: Different roles set conditions on different fields

Role A, configured condition: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B, configured condition: Name contains "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

After merging:

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Data Columns

Role A, configured visible fields: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B, configured visible fields: Name, Sex

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

After merging:

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Row and Column Mix

Role A, configured condition is Age < 30, visible fields are Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B, configured condition is Name contains "Ja", visible fields are Name, Sex

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

After merging:

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Note: Some marked data is not visible in either individual role, but becomes visible under the merged role.**

#### Summary

Role merging rules for data scope:

1. For rows, permission is granted if the condition of any role is met.
2. For columns, the visible fields are combined.
3. When both row and column permissions are set, they are merged separately (rows with rows, and columns with columns), not as a (row + column) set with another (row + column) set.