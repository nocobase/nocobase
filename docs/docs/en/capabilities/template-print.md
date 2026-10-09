---
title: 'Template printing'
description: 'Generate business documents from templates, with a purchase approval example showing the prompt, generation action, and actual output.'
keywords: 'NocoBase 3,template printing,Word,DOCX,approval form,document generation'
---

# Template printing

Template printing fills business data into a document with a fixed layout, producing a file that can be downloaded, archived, or printed. Use it for contracts, approval forms, delivery lists, and reports.

Provide an existing template and tell your Agent which information to include, where users should generate the document, and which output format you need. The Agent implements the generation action and file output in your application.

## Before you start

- **Business data**: an existing business page and the records to include in the document.
- **Document template**: such as your company's Word approval form or contract. If you do not have a template, describe the layout and ask the Agent to prepare one for review.
- **Generation requirements**: the information to fill in, the action's location, the file format, and who can use it.

This example uses a Word purchase approval template to generate a DOCX file for the current order. The template contains a heading, a purchase information table, and a sign-off area. The Agent maps the information in the template to the application's fields.

[Download the example Word template](/downloads/purchase-approval-template.docx)

![Word purchase approval template](../../../cn/capabilities/assets/template-print-template.png)

## Example: generate a purchase approval form from an order

Purchasing staff need a standard form containing the order details and approval result for their records. Provide the template to the Agent, then describe your requirements:

```text
Add a “Generate approval form” action to order details.

Use the Word template I provided to fill in the current order's number, purchase request, applicant, amount, approval result, and processing time.
Keep the template's heading, table layout, and sign-off area. Name the output “Purchase-approval-order-number” and provide a Word download.
Anyone with access to the order can generate its approval form. Use the current order data when generating the file.
```

### See the result

1. Open order details and click **Generate approval form** to download the current order's purchase approval form.

![Generate a purchase approval form from order details](../../../cn/capabilities/assets/template-print-generate.png)

2. Click **Preview approval form** to see the result, or open the downloaded file in Word. The order number, applicant, amount, and approval result are filled in, while the template's heading, table layout, and sign-off area are preserved.

![Purchase approval form filled with current order data](../../../cn/capabilities/assets/template-print-result.png)

After business data changes, generate the document again to obtain a file with the current information. Previously downloaded files retain their contents from the time of generation.

## Further use

### Batch generation

For documents generated from a list, specify whether to include selected records, the current page, or all filtered results. Also specify whether to produce one combined file or a separate file for each record. For example:

```text
Add a “Generate delivery list” action to the delivery list page.
Process only the records I selected, sorted by delivery number.
Use my Excel template to fill in recipients, addresses, and product details, and generate one XLSX file.
```

### PDF output

PDF is useful for printing or sending documents to others. Add PDF download to an existing document generation workflow:

```text
Add PDF download for the purchase approval form, preserving the Word template's fonts, tables, and sign-off area.
```

The application's developer or deployment administrator prepares a server-side document conversion environment and the fonts used by the template. The Agent then connects the conversion step. Images, logos, and QR codes can also be added as required by the template; their implementation depends on the chosen generation solution.

### Multiple templates

Application developers can maintain fixed templates. If business users need to upload, replace, or select templates, ask the Agent to add the relevant management interface:

```text
Purchase approval forms have domestic and international versions.
Administrators can upload and replace templates. Purchasing staff select the appropriate version when generating an approval form.
Both templates use the current order data. Regular purchasing staff can only use templates.
```

## Common questions

### How do I change the information and layout?

Edit the template's headings, tables, fonts, and sign-off area to change the layout. For additional business information, tell the Agent where to read it and map it into the template. Detail tables can be filled row by row from business records.

### Can I print directly to a printer?

After generating a file, users can select a printer in Word or a PDF viewer. To send documents automatically to a specific printer, describe the printer and its operating environment so the Agent can implement the appropriate integration.

### Who can generate and download documents?

In this example, anyone with access to an order can generate its approval form. For contracts, customer information, or similar content, specify the access rules. The Agent applies permission checks when reading business data and returning the file. See [Authorization](./authorization/index.md).
