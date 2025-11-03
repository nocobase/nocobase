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


Validation rules also apply to sub-table and sub-form components:

![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)



![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)


Note that in sub-form or sub-table scenarios, required validation for association fields does not take effect.

![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)


## Differences from Client-Side Field Validation
Client-side and server-side field validation are applied in different scenarios, with significant differences in implementation and rule trigger timing, so they need to be managed separately.

### Configuration Method Differences
- **Client-side validation**: Configure rules in edit forms (as shown in the figure below)
- **Server-side field validation**: Set field rules in Data Source → Collection Configuration

![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)



![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)



### Validation Trigger Timing Differences
- **Client-side validation**: Triggers validation in real-time as users fill in fields, displaying error messages immediately.
- **Server-side field validation**: Validates on the server side before data entry after data submission, with error messages returned through API responses.
- **Application scope**: Server-side field validation takes effect not only during form submission but also triggers in all scenarios involving data addition or modification, such as workflows and data imports.
- **Error messages**: Client-side validation supports custom error messages, while server-side validation does not currently support custom error messages.