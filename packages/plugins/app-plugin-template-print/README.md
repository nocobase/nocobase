# @nocobase/app-plugin-template-print

An App-facing Skill for implementing template printing in NocoBase 3: generate documents from Office templates and authorized business data, with optional images, QR codes, and PDF conversion.

This package ships only guidance and reference examples. It has no Client or Server entry, routes, tables, rendering engine, or printing UI. Installing it makes implementation knowledge available to the App Agent; the requested feature is implemented later in the target App or a business plugin.

The runnable [template-print example](../../examples/app-plugin-template-print-example/README.md) shows one concrete implementation of this guidance. It is a separate example plugin that owns its invoice data, authorization, route, fixed DOCX asset, and download UI; it does not add a reusable renderer to this Skill package.

## Use in an application

Install this package as a direct development dependency of the target App using its package manager, then run `pnpm nocobase skills sync --json` from that App. In this source workspace, use `workspace:*` for the dependency. Skill synchronization discovers direct `@nocobase/*` dependencies; no Client or Server registration is required for this package.

Ask the App Agent, for example: “Implement invoice template printing from a DOCX file, including line items and PDF download.” The [Template Print Skill](skills/nocobase-app-plugin-template-print/SKILL.md) guides scope, dependencies, data permissions, rendering, and verification. Edit the canonical files here; the App's `.agents/skills/` copy is generated local output.

The references define v3 ownership, public renderer integration, Office image handling, PDF conversion boundaries, and regression scenarios. They are implementation guidance only; the target App or business plugin owns the runtime code.

## Validation

Run `pnpm --filter @nocobase/app-plugin-template-print check` and inspect the package tarball to verify the Skill and its references ship together. Like `@nocobase/app-skills`, this documentation-only package has no compilation, runtime lint, or runtime test scripts.
