---
title: 'Template printing'
description: 'Learn what the template printing Skill guides an application Agent to build, and use prompts to create print features for contracts, orders, and reports.'
keywords: 'NocoBase,template printing,Skill,Agent,DOCX,XLSX,PDF,contracts'
---

# Template printing

Template printing fills a fixed-layout template with business data to generate contracts, orders, invoices, or reports. Provide an existing template and your business rules, and an application Agent can build the print entry point and file generation in your NocoBase app.

One important detail: `@nocobase/app-plugin-template-print` provides an Agent Skill and implementation references. It is not a print feature that you can enable at runtime. Installing it does not add print buttons, template management pages, or a rendering service. The Agent still needs to implement these features in the target app or a business plugin.

## When to use it

- Generate a contract from an order, filled with the customer, amount, and line items.
- Select records from a list to create a shipping manifest.
- Generate a DOCX, XLSX, or PPTX file from an existing Office template.
- Add PDF output, images, or QR codes to an existing file-generation workflow.

If you only need to print the current page from a browser, the browser's print function is usually enough. Template printing is for generating files with a fixed layout that can be archived or sent to others.

## What to prepare

- A target NocoBase app that your development Agent can read and modify.
- An actual template. If you do not have one, describe the layout and ask the Agent to create a sample for you to review.
- A representative business record with common fields, line items, and any values that may be empty.
- The print entry point, record scope, output format, and access rules you need.

This feature is not enabled on a Settings page. Ask your development Agent to check whether the template printing Skill is installed and synchronized for the current app:

```text
Check whether the nocobase-app-plugin-template-print Skill is installed and synchronized in the current app. If it is not, install the package as a development dependency of this app and use the Skills sync method supported by this app. Confirm that you can read the Skill before implementing the print feature. This package provides implementation guidance only; it does not add print buttons or runtime services.
```

After synchronization, the Agent can read the template printing guidance. Business users use the pages and buttons built for the app; they do not need to learn about Skills or run installation commands.

## Example: generate a contract from an order

Give the actual DOCX template and a sample order to your Agent, then send the request below. Replace the bracketed details with the names and rules used in your app:

```text
Use the nocobase-app-plugin-template-print Skill to add a "Print contract" feature to the order detail page.

Use the DOCX contract template I provide. Fill it with the current order's customer name, contact, order number, line items, quantities, unit prices, and total amount. Expand repeated items into table rows, and preserve the template's existing header, signature area, and layout. Name the file "Contract-[order number]" and provide a DOCX download.

Before implementing, inspect the actual order fields, customer and contact relationships, detail page, and current user's order permissions. Read only data the user is authorized to access; apply the same permissions to attachments and templates. Do not change the original order data.

First generate a file from the sample order I provide. When finished, tell me where the button is and check the customer details, line items, totals, empty fields, and page breaks. If any template formatting cannot be preserved, explain the issue before continuing.
```

### Expected result

The order detail page has a **Print contract** entry. When clicked, it downloads a DOCX containing the current order's data while preserving the template's layout and signature area.

<!-- Add a genuine screenshot showing the "Print contract" entry on an order detail page, including enough page context to show where the button is. -->

<!-- Add a genuine screenshot of the generated DOCX opened with a sample order, showing the filled customer details and line items. -->

For acceptance, use an order with several line items and check that the file opens in the target Office application. Also confirm that a user who cannot access the order cannot download its file.

## Further use

### Batch printing

Specify which records to include and how to organize the output. For example, create one XLSX shipping manifest for selected orders, sorted by order number:

```text
Add an "Export shipping manifest" action to the order list. Use the XLSX template I provide and include only the orders I select. Show the recipient, address, and product details for each order, sorted by order number, in one XLSX file. If no orders are selected, ask me to select records. If more than 200 are selected, ask me to narrow the selection. Verify how selections across pages and orders the user cannot access are handled.
```

"Current page," "selected records," and "all filtered results" are different print scopes. Tell the Agent which one to implement so the output does not include more records than expected.

### Add PDF, images, or QR codes

Specify where an image should appear in the template, where a QR code should point, and which fonts and page breaks the PDF must preserve:

```text
Add the company logo, the current order's signature image, and a QR code linking to the order page to the contract. Also provide a PDF download. Only users authorized to access the order can read private images. In the target deployment environment, verify the generated result with Chinese text and a multi-page order. Show a clear error if conversion fails.
```

PDF conversion usually requires an additional server-side conversion environment and fonts. After downloading a PDF, users can choose a printer in their viewer. Sending a print job silently to a user's local printer requires a separate client-side implementation.

### Let business users manage templates

Ask the Agent to add template management only if business users need to upload, replace, or choose templates:

```text
We use domestic and international sales contracts. Add template management so administrators can upload and replace templates, and sales reps can choose the right version when printing. Bind the templates to order data. Replacing a template must not affect contracts that are already being generated. Ordinary sales reps must not be able to upload or edit templates. First tell me which template fields, permissions, and version rules are needed, then implement and verify with both templates.
```

Fixed templates can be maintained with the application code. Uploads, version management, template selection, and management permissions require additional implementation; installing the template printing Skill does not provide them automatically.

## Things to keep in mind

- Specify whether printing applies to the current record, selected records, the current page, or all filtered results.
- DOCX, XLSX, PPTX, and PDF output depends on the renderer the Agent selects and integrates. Verify it with the actual template and deployment environment.
- PDF conversion may require an additional service and Chinese fonts. Checking only on a development machine is not enough.
- Before generating a file on the server, check the user's permissions before reading business data, templates, or attachments.
- The package only synchronizes guidance. After implementation, download a file from the actual app page and check its layout.

If no print button appears after installation, that is expected. First make sure the Skill is synchronized for the development Agent, then specify the business entry point, template, data scope, and output format you need.

## Related links

- [Writing requirements](../get-started/ai-agent/writing-requirements.md) — Describe business rules and acceptance criteria to the application Agent.
- [Files](./file.md) — Learn about uploads, attachments, and file access.
- [Permissions](./authorization/index.md) — Understand access to data and features.
