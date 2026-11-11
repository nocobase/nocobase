# Optional ID implementation

`IdGeneratorProvider` remains the sole owner of `idGeneratorToken` from `@nocobase/app-server/id-generator`. Consumers keep the synchronous `generate(): number` and `generateString(): string` API. Without an extension, the provider lazily constructs the original `SnowflakeIdGenerator` from `snowflake.workerId` and optional `snowflake.epoch`.

A plugin can register one `IdGeneratorImplementation` under the host's original `idGeneratorImplementationToken` during its Provider's `register()` phase:

```ts
import {
  idGeneratorImplementationToken,
  type IdGeneratorImplementation,
} from '@nocobase/app-server/id-generator';

// The plugin owns this implementation and any resources it creates.
const implementation: IdGeneratorImplementation = {
  initialize: () => ensureInitialized(),
  generate: () => currentGenerator().generate(),
  generateString: () => currentGenerator().generateString(),
};
app.container.instance(idGeneratorImplementationToken, implementation);
```

The host keeps a stable forwarding object. Resolving it before a later plugin registers does not cache the absence of an extension. Every generation delegates to the registered implementation if present; unused manual settings are not validated or constructed first. Extension construction, initialization and generation failures propagate; the host never falls back after an extension is registered. Duplicate implementations are rejected by the ordinary container rule. Bindings and state are application-local, not process-global.

All Providers register before any boot. The host ID Provider's `boot()` awaits `initialize()`, so business Providers placed after the host ID Provider can generate IDs in boot even if the contributing plugin is last. A business Provider deliberately placed before the host ID Provider is outside this ordering guarantee. Do not generate business IDs during registration. A database preparation hook may run even earlier; share one sticky initialization promise between that hook and `initialize()` so preparation, allocation and failures happen once.

The host adds no extension shutdown protocol. The plugin Provider owns cleanup, must tolerate partial initialization, and must synchronously close generation before awaiting resource disposal. Its registered implementation must remain closed after shutdown and reject uninitialized, failed or closed generation. The host must not resume manual generation in those states. Plugins that do not contribute an implementation retain the original host lifecycle. Configure once per application lifecycle and restart to change implementations; there is no hot replacement, named-driver framework or global Provider priority.

A plugin importing the Token declares `@nocobase/app-server` as a compatible peer dependency and consumes its public `./id-generator` export. Recreating a same-named Token or installing a second host copy does not preserve identity. Verify installed artifacts as well as workspace source.
