# @nocobase/service-provider

## 0.0.2-beta.2

### Patch Changes

- cf23bfe: Republish every package so the `latest` dist-tag points at its current beta release, matching `beta`.

## 0.0.2-beta.1

### Patch Changes

- fb1a752: Make the shared service-provider runtime environment-neutral and add a matching universal ESLint configuration for libraries that do not depend on Node, browser, or React globals.

## 0.0.2-beta.0

### Patch Changes

- ce4eab8: Add a focused ServiceProvider plugin example with a tokenized heartbeat
  service, lifecycle management, and an HTTP status route. Pass the Application
  directly to providers and standardize service access through `app.container`.

## 0.0.1

### Patch Changes

- Add the service container, typed service tokens, and service provider lifecycle infrastructure.
