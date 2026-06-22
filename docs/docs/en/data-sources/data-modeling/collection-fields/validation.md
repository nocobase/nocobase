# Field Validation
To ensure data accuracy, security, and consistency in collections, NocoBase provides field validation functionality. This feature consists of two main parts: rule configuration and rule application.

## Rule Configuration

![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)


NocoBase system fields integrate [Joi](https://joi.dev/api/) rules, with support as follows:

### String
Joi string types correspond to the following NocoBase field types: Single Line Text, Long Text, Phone, Email, URL, Password, and UUID.
#### Common Rules
- Min length
- Max length
- Length
- Pattern
- Required

#### Email

![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)

[View more options](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL

![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)

[View more options](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID

![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)

[View more options](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Number
Joi number types correspond to the following NocoBase field types: Integer, Number, and Percentage.
#### Common Rules
- Greater than
- Less than
- Max value
- Min value
- Multiple

#### Integer
In addition to common rules, integer fields additionally support [integer validation](https://joi.dev/api/?v=17.13.3#numberinteger) and [unsafe integer validation](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).

![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)


#### Number & Percentage
In addition to common rules, number and percentage fields additionally support [precision validation](https://joi.dev/api/?v=17.13.3#numberinteger).

![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)


### Date
Joi date types correspond to the following NocoBase field types: Date (with timezone), Date (without timezone), Date only, and Unix timestamp.

Supported validation rules:
- Greater than
- Less than
- Max value
- Min value
- Timestamp
- Required

### Association Fields
Association fields only support required validation. Note that required validation for association fields is currently not supported in sub-form or sub-table scenarios.

![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)


## Applying Validation Rules
After configuring field rules, the corresponding validation rules will be triggered when adding or modifying data.

![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

When the field is used in a form, field validation rules are also displayed in the field validation settings. These rules appear under **Server-side field validation rules** and are read-only there. If you need to change them, edit the field in Data source → Collection configuration.

You can still add extra rules for the current form field under **Client-side validation rules**. These rules only apply to the current field component. The final validation result combines **Server-side field validation rules** and **Client-side validation rules**.

Validation rules also apply to sub-table and sub-form components:

![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)



![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)


Note that in sub-form or sub-table scenarios, required validation for association fields does not take effect.

![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)


## Differences Between Server-Side Field Validation Rules and Client-Side Validation Rules
Server-side field validation rules and client-side validation rules are configured in different places and have different scopes.

### Configuration Method Differences
- **Server-side field validation rules**: Set field rules in Data source → Collection configuration. These rules are the base rules of the field.
- **Client-side validation rules**: Configure extra rules in a form field's settings. These rules only affect the current field component.

![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)



![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)



### Validation Trigger Timing Differences
- **Server-side field validation rules**: Trigger frontend validation when the field is used in a form, and also validate before data is written. They also apply to scenarios that create or update data, such as workflows and data imports.
- **Client-side validation rules**: Trigger frontend validation in the current form field only.
- **Rule display**: Server-side field validation rules are shown as inherited read-only rules. Client-side validation rules are shown separately and can be edited there.
- **Error messages**: Client-side validation rules support custom error messages, while server-side field validation rules do not currently support custom error messages.
