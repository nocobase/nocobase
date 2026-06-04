# Flow Surfaces Extractor

The extractor records FlowModel registration facts from plugin client-v2 code and writes an auto snapshot for discovery.

Auto snapshot output is fact discovery only. It must not be treated as an authoring contract, and it must not enable `create` or `configure` by itself. Static `createModelOptions` evidence only proves that the extractor saw a serializable shape; a manifest or provider still needs to declare the public payload, validation, and write recipe before UI Builder can write the capability.

This first extractor layer supports deterministic inputs:

- Runtime recorder events for `registerModels`, `registerModelLoaders`, `registerFlow`, menu items, and field bindings.
- Guarded globals that block browser/network/storage APIs while plugin client code is inspected.
- AST fallback for common static `registerModels`, `registerModelLoaders`, `registerFlow`, `bindModelToInterface`, and `AddSubModelButton` patterns.
- Snapshot normalization and snapshot writing into an explicit output directory.

Patterns that remain manifest/provider work:

- Dynamic menu factories and function-based `createModelOptions`.
- Runtime `uiSchema`, `defaultParams`, `hide`, and action handlers.
- Target-scoped placement rules, permissions, and collection-specific validation.
- Public `initParams`, `settings`, readback parity, and create/configure admission.

Third-party plugins should add a flow surface manifest or provider when they want a discovered model to become writable. The snapshot can supplement that contract with evidence, aliases, source references, and warnings, but it cannot override a manifest/provider decision or promote a read-only discovery candidate into a write-enabled capability.
