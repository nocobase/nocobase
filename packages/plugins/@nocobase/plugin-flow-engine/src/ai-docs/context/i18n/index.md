# ctx.i18n

`ctx.i18n` exposes the i18next instance bound to the flow runtime. Use it to localize labels, titles, and runtime messages.

## Usage Patterns

- **Translate keys** (`@nocobase/plugin-flow-engine/context/i18n/basic.md` → `translate`) with optional interpolation parameters.
- **Switch languages** (`@nocobase/plugin-flow-engine/context/i18n/basic.md` → `setLanguage`) by assigning to `ctx.i18n.language`.

The context inherits the app’s locale, so translations stay in sync with the client UI.
