# Required

## Introduction

Required is a common rule for form validation. You can enable it directly in the field configuration, or dynamically set a field as required through the form's linkage rules.

## Where to set a field as required

### Collection field settings

When a collection field is set to required, it triggers backend validation, and the frontend also displays it as required by default (cannot be modified).


![20251025175418](https://static-docs.nocobase.com/20251025175418.png)


### Field settings

Directly set a field as required. This is suitable for fields that always need to be filled in by the user, such as username, password, etc.


![20251028222818](https://static-docs.nocobase.com/20251028222818.png)


### Linkage rules

Set a field as required based on conditions through the form block's field linkage rules.

Example: The order number is required when the order date is not empty.


![20251028223004](https://static-docs.nocobase.com/20251028223004.png)


### Workflow