---
title: Template printing usage guide
description: Prepare templates, identify business data, and verify generated documents.
---

# Template printing usage guide

[← Template printing overview](./index.md)

The template printing package provides an Agent Skill and reference examples. It does not include a ready-made printing interface, rendering engine, or business API. Implement generation and download in your application or business plugin.

## Prepare the template and business rules

| What to provide | Example                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------- |
| A real template | A Word transport document with a company header, line items, and signature area           |
| Data sources    | The current order, customer, cargo details, and delivery information                      |
| Output format   | DOCX download; specify PDF conversion requirements if needed                              |
| Access rules    | Which roles can generate and download documents, and whether to retain generation history |

Ask the Agent to check for an existing template printing Skill. If integration is needed, follow guidance matching the application's installed version. The application owns templates, field mappings, runtime dependencies, and business code.

## Describe the requirement

```text
Generate a transport document for the current order using my Word template.
Fill in the order number, customer, origin, destination, and cargo line items, preserving the company header and signature area.
Only employees authorized to view the order may generate and download the document. Do not accept unauthorized order data supplied by the client.
Implement DOCX download first, explain how missing fields are handled, and verify the document against a real order.
If PDF is needed, identify the required conversion environment and deployment dependencies first.
```

Return to the [overview](./index.md) to choose another scenario and adapt its prompt.

## Verify the result

- Check single and multiple line items, dates, amounts, and missing values against the agreed rules.
- Use accessible, authorized sources for images and QR codes.
- Enforce business permissions on generation and download APIs; changing an order identifier must not expose someone else's data.
- Open the generated document and verify PDF conversion in the actual deployment environment if it is required.

## Development references

Read the [capability package documentation](https://github.com/nocobase/nocobase/blob/v3-develop/packages/plugins/app-plugin-template-print/README.md) and the [runnable example plugin](https://github.com/nocobase/nocobase/blob/v3-develop/packages/examples/app-plugin-template-print-example/README.md). The example owns its demonstration data and routes; it is not a general-purpose printing service for every application.
