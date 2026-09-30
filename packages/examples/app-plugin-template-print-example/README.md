# @nocobase/app-plugin-template-print-example

A runnable NocoBase 3 example that renders a fixed DOCX invoice template from invoice data and the caller's authorized Sales Quotes.

This example complements `@nocobase/app-plugin-template-print`, which is an App-facing Agent Skill package containing implementation guidance only. The Skill package provides no runtime printing API; this example plugin owns and demonstrates one concrete application workflow using a fixed DOCX template, with DOCX download and optional PDF conversion. Follow the [Template Print Skill](../../plugins/app-plugin-template-print/skills/nocobase-app-plugin-template-print/SKILL.md) when implementing another format or output mode.

The example depends on `@nocobase/app-plugin-authorization-example` and belongs in the Examples application. It links two seeded invoices to `quote-3` and `quote-7`, shows each only to users who can view its source quote, and downloads a DOCX through an authenticated API Route.

The Server owns the template path and render options. The request accepts only an invoice ID; it cannot choose a filesystem path, template, data scope, or renderer options. Invoice line items are loaded only after the linked quote passes its registered Repository policy.

The fixed DOCX asset demonstrates scalar interpolation and a repeating table row. The example downloads either the rendered DOCX or a PDF converted by Carbone. DOCX rendering needs no converter; PDF conversion requires LibreOffice on the machine or container running NocoBase. The example does not accept uploaded templates.

If PDF conversion returns `PDF_CONVERTER_UNAVAILABLE`, install LibreOffice in the NocoBase runtime environment, make its executable available to the server process, and restart the application. The page shows an installation guide and DOCX remains available while the converter is missing.

This example depends on Carbone Community Edition. If you redistribute an application that includes it, notify its users and link to the current [Carbone Community License Agreement](https://github.com/carboneio/carbone/blob/master/LICENSE.md), as required by that license.

The Examples application registers this plugin in both `client/plugins.ts` and `server/plugins.ts`, and the Examples home page includes a **Template printing** card. After database tasks run, open the page as a user with access to Sales Quotes; `sales_manager` can print both seeded invoices in a fresh Examples database.

Run `pnpm --filter @nocobase/app-plugin-template-print-example check` to validate the package. The built package copies `templates/invoice.docx` into `dist/templates/` so the Server can resolve it from the compiled plugin directory.
