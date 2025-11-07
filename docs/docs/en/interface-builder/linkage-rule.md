# Linkage Rules

## Introduction

In NocoBase, Linkage Rules are a mechanism used to control the interactive behavior of front-end interface elements. It allows users to adjust the display and behavioral logic of blocks, fields, and actions in the interface based on different conditions, achieving a flexible, low-code interactive experience. This feature is continuously being iterated and optimized.

By configuring linkage rules, you can achieve things like:

- Hiding/showing certain blocks based on the current user role. Different roles see blocks with different data scopes, for example, administrators see blocks with complete information, while regular users can only see basic information blocks.
- When an option is selected in a form, automatically fill or reset other field values.
- When an option is selected in a form, disable certain input items.
- When an option is selected in a form, set certain input items as required.
- Control whether action buttons are visible or clickable under certain conditions.

## Condition Configuration



![20251029114532](https://static-docs.nocobase.com/20251029114532.png)



### Left-hand Variable

The left-hand variable in a condition is used to define the "object of judgment" in the linkage rule. The condition is evaluated based on the value of this variable to determine whether to trigger the linkage action.

Selectable variables include:

- Fields in the context, such as `Current Form/xxx`, `Current Record/xxx`, `Current Popup Record/xxx`, etc.
- System global variables, such as `Current User`, `Current Role`, etc., suitable for dynamic control based on user identity, permissions, and other information.
  > ✅ The available options for the left-hand variable are determined by the context of the block. Use the left-hand variable reasonably according to business needs:
  >
  > - `Current User` represents the information of the currently logged-in user.
  > - `Current Form` represents the real-time input values in the form.
  > - `Current Record` represents the saved record value, such as a row record in a table.

### Operator

The operator is used to set the logic for the condition judgment, i.e., how to compare the left-hand variable with the right-hand value. Different types of left-hand variables support different operators. Common types of operators are as follows:

- **Text type**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty`, etc.
- **Number type**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte`, etc.
- **Boolean type**: `$isTruly`, `$isFalsy`
- **Array type**: `$match`, `$anyOf`, `$empty`, `$notEmpty`, etc.

> ✅ The system will automatically recommend a list of available operators based on the type of the left-hand variable to ensure the configuration logic is reasonable.

### Right-hand Value

Used for comparison with the left-hand variable, it is the reference value for determining whether the condition is met.

Supported content includes:

- Constant values: Enter fixed numbers, text, dates, etc.
- Context variables: such as other fields in the current form, the current record, etc.
- System variables: such as the current user, current time, current role, etc.

> ✅ The system will automatically adapt the input method for the right-hand value based on the type of the left-hand variable, for example:
>
> - When the left side is a "Select field", the corresponding option selector will be displayed.
> - When the left side is a "Date field", a date picker will be displayed.
> - When the left side is a "Text field", a text input box will be displayed.

> 💡 Flexible use of right-hand values (especially dynamic variables) allows you to build linkage logic based on the current user, current data state, and context, thus achieving a more powerful interactive experience.

## Rule Execution Logic

### Condition Trigger

When the condition in a rule is met (optional), the property modification action below it will be executed automatically. If no condition is set, the rule is considered to be always met by default, and the property modification action will be executed automatically.

### Multiple Rules

You can configure multiple linkage rules for a form. When the conditions of multiple rules are met simultaneously, the system will execute the results in order from first to last, meaning the last result will be the final standard.
Example: Rule 1 sets a field to "Disabled", and Rule 2 sets the field to "Editable". If the conditions for both rules are met, the field will become "Editable".

> The execution order of multiple rules is crucial. When designing rules, make sure to clarify their priorities and interrelationships to avoid conflicts.

## Rule Management

The following operations can be performed on each rule:

- Custom Naming: Set an easy-to-understand name for the rule for management and identification.

- Sorting: Adjust the order based on the execution priority of the rules to ensure the system processes them in the correct sequence.

- Delete: Remove rules that are no longer needed.

- Enable/Disable: Temporarily disable a rule without deleting it, suitable for scenarios where a rule needs to be temporarily deactivated.

- Duplicate Rule: Create a new rule by copying an existing one to avoid repetitive configuration.

## About Variables

In field value assignment and condition configuration, both constants and variables are supported. The list of variables will vary depending on the block's location. Choosing and using variables reasonably can meet business needs more flexibly. For more information about variables, please refer to [Variables](/interface-builder/variables).

## Block Linkage Rules

Block linkage rules allow for dynamic control of a block's display based on system variables (like current user, role) or context variables (like the current popup record). For example, an administrator can view complete order information, while a customer service role can only view specific order data. Through block linkage rules, you can configure corresponding blocks based on roles, and set different fields, action buttons, and data scopes within those blocks. When the logged-in role is the target role, the system will display the corresponding block. It is important to note that blocks are displayed by default, so you usually need to define the logic for hiding the block.

👉 For details, see: [Block/Block Linkage Rules](/interface-builder/blocks/block-settings/block-linkage-rule)

## Field Linkage Rules

Field linkage rules are used to dynamically adjust the state of fields in a form or details block based on user actions, mainly including:

- Controlling the **Show/Hide** state of a field
- Setting whether a field is **Required**
- **Assigning a value**
- Executing JavaScript to handle custom business logic

👉 For details, see: [Block/Field Linkage Rules](/interface-builder/blocks/block-settings/field-linkage-rule)

## Action Linkage Rules

Action linkage rules currently support controlling action behaviors, such as hiding/disabling, based on context variables like the current record value and current form, as well as global variables.

👉 For details, see: [Action/Linkage Rules](/interface-builder/actions/action-settings/linkage-rule)