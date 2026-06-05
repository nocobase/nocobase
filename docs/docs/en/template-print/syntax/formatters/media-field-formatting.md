### Media Field Formatting

#### 1. :attachment

##### Syntax Explanation

Renders an image from an attachment field. In most cases, you should copy the variable directly from the **Field List**.

##### Example

```text
{d.contractFiles[0].id:attachment()}
```

##### Result

Renders the corresponding attachment image in the template.

#### 2. :signature

##### Syntax Explanation

Renders the image associated with a handwritten signature field. In most cases, you should copy the variable directly from the **Field List**.

##### Example

```text
{d.customerSignature:signature()}
```

##### Result

Renders the corresponding handwritten signature image in the template.

> **Note:** For attachment fields and handwritten signature fields, it is recommended to copy the variables directly from the **Field List** in template configuration to avoid mistakes in manual typing.
