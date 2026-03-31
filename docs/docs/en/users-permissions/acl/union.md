---
pkg: '@nocobase/plugin-acl'
---

# Role Union

Role Union is a permission management mode. According to system settings, system developers can choose to use `Independent roles`, `Allow roles union`, or `Roles union only`, to meet different permission requirements.


![20250312184651](https://static-docs.nocobase.com/20250312184651.png)


## Independent roles

By default, the system uses independent roles. Users must switch between the roles they possess individually.


![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
  

![20250312184826](https://static-docs.nocobase.com/20250312184826.png)


## Allow roles union

System developers can enable `Allow roles union`, allowing users to simultaneously have permissions of all assigned roles while still permitting users to switch roles individually.


![20250312185006](https://static-docs.nocobase.com/20250312185006.png)


## Roles union only

Users are enforced to only use Role Union and cannot switch roles individually.


![20250312185105](https://static-docs.nocobase.com/20250312185105.png)


## Rules for Role Union

Role union grants the maximum permissions across all roles. Below are the explanations for resolving permission conflicts when roles have different settings on the same permission.

### Operation Permission Merge

Example:  
Role1 is configured to `Allows to configure interface` and Role2 is configured to `Allows to install, activate, disable plugins`


![20250312190133](https://static-docs.nocobase.com/20250312190133.png)



![20250312190352](https://static-docs.nocobase.com/20250312190352.png)


When logging in with the **Full Permissions** role, the user will have both permissions simultaneously.


![20250312190621](https://static-docs.nocobase.com/20250312190621.png)


### Data Scope Merge

#### Data Rows

Scenario 1: Multiple roles setting conditions on the same field

Role A filter: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B filter: Age > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**After merging:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Scenario 2: Different roles setting conditions on different fields

Role A filter: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B filter: Name contains "Ja"

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**After merging:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Data Columns

Role A visible columns: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B visible columns: Name, Sex

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

**After merging:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Mixed Rows and Columns

Role A filter: Age < 30, columns Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Role B filter: Name contains "Ja", columns Name, Sex

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

**After merging:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Note: Cells with red background indicate data invisible in individual roles but visible in the merged role.**

#### Summary

Role merging data-scope rules:

1. Between rows, if any condition is satisfied, the row has permissions.
2. Between columns, fields are combined.
3. When rows and columns are both configured, rows and columns are merged separately, not by row-column combinations.