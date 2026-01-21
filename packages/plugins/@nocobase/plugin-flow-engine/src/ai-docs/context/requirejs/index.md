# ctx.requirejs

`ctx.requirejs` exposes the legacy AMD loader used inside Flow pages. It is handy when integrating libraries that expect AMD modules or when loading compiled assets from plugins.

## Example

- `@nocobase/plugin-flow-engine/context/requirejs/basic.md` shows how to load a module via `ctx.requirejs(['pkg'], callback)` and await the result.
