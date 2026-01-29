# ctx.actions helpers

`FlowRuntimeContext` exposes helper methods to execute or inspect registered actions at runtime.

## API Overview

- `ctx.runAction(name, params?)`: execute any action by its name and optional payload.
- `ctx.getAction(name)`: fetch a single action definition (metadata, handler, etc.).
- `ctx.getActions()`: returns the `Map<string, Action>` of everything currently registered.

## Usage Patterns

Use these helpers to decide which action to run dynamically, inspect capabilities before calling them, or execute nested flows.
