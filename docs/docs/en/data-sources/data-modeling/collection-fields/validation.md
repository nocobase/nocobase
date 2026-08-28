---
title: "Field validation"
description: "Field validation rules based on Joi configuration and validation rules. Supports minimum and maximum length, required values, and other rules for string, number, date, and other types."
keywords: "field validation,field validation rules,Joi,validation rules,configuration rules,NocoBase"
---

# Field validation

To ensure collection accuracy, security, and consistency, NocoBase provides field validation. It has two parts: configuration rules and validation rules.

## Configuration rules

![Field validation settings](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

NocoBase field rules integrate [Joi](https://joi.dev/api/). The supported rules are as follows.

### String types

NocoBase Field interfaces corresponding to Joi string types include Input, Textarea, Phone, Email, URL, Password, and UUID.

#### Common rules

- Minimum length
- Maximum length
- Length
- Regular expression
- Required

#### Email

![Email validation settings](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)

[View more options](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL

![URL validation settings](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)

[View more options](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID

![UUID validation settings](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)

[View more options](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Number types

NocoBase Field interfaces corresponding to Joi number types include Integer, Number, and Percent.

#### Common rules

- Greater than
- Less than
- Maximum value
- Minimum value
- Multiple

#### Integer

In addition to common rules, Integer fields support [integer validation](https://joi.dev/api/?v=17.13.3#numberinteger) and [unsafe-integer validation](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).

![Integer validation settings](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Number and Percent

In addition to common rules, Number and Percent fields support [precision validation](https://joi.dev/api/?v=17.13.3#numberinteger).

![Number and Percent validation settings](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Date types

NocoBase Field interfaces corresponding to Joi date types include DateTime (with time zone), DateTime (without time zone), Date only, and Unix timestamp.

Supported validation rules are:

- Greater than
- Less than
- Maximum value
- Minimum value
- Timestamp format validation
- Required

### Relation fields

Relation fields support required validation only. Note that required validation for relation fields is not currently supported in Subform or Subtable scenarios.

![Relation field validation settings](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Apply validation rules

After you configure field rules, the corresponding validation rules are triggered when data is created or changed.

![Validation triggered when changing data](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

When a field is used in a form, its validation rules also appear in the field validation settings. They are displayed as read-only under **Server-side field validation rules**. To change these rules, return to **Data source / Collection configuration** and edit the field.

You can still add additional rules for the current form field under **Client-side validation rules**. These rules affect only the current field component. The validation rules that ultimately take effect combine **Server-side field validation rules** and **Client-side validation rules**.

Validation rules also apply to Subtable and Subform components:

![Validation in a Subtable](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![Validation in a Subform](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Note that required validation for relation fields does not take effect in Subform or Subtable scenarios.

![Relation required validation in a Subform or Subtable](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Difference between server-side field validation rules and client-side validation rules

Server-side field validation rules and client-side validation rules are configured in different places and have different scopes.

### Configuration differences

- **Server-side field validation rules**: Set field rules in **Data source / Collection configuration**. These rules are the base rules of the field
- **Client-side validation rules**: Add additional rules in form-field settings. These rules affect only the current field component

![Configure server-side field validation rules](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![Configure client-side validation rules](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Validation timing differences

- **Server-side field validation rules**: Trigger client-side validation when the field is used in a form, and trigger validation before data is written. These rules also apply when data is created or changed through workflows, data import, and other paths
- **Client-side validation rules**: Trigger client-side validation only in the current form field
- **Rule display**: Server-side field validation rules are displayed read-only as inherited rules. Client-side validation rules are displayed separately and can be edited here
- **Error messages**: Client-side validation rules support custom error messages. Server-side field validation rules do not currently support custom error messages
