# RunJS Reference For JS Models

## Quick Start

- **Execution environment** – every script runs inside a Flow sandbox. `ctx.React`, `ctx.libs.antd`, `ctx.viewer`, `ctx.api`, and all other context APIs are available exactly as they are in the interface builder.
- **Copy-ready snippets** – the dedicated docs (below) show raw `ctx.*` statements rather than wrapped functions. Paste them as-is into a JS block/action/field and adjust UIDs or collection names.
- **Async behavior** – use `await` whenever you touch `ctx.resource.refresh`, `ctx.sql.run`, or any observable property created via `ctx.defineProperty`.

## Available Guides

## Usage Tips

- Keep DOM mutations inside `ctx.element` or call `ctx.render(<Component />)` so the sandbox can dispose components properly.
- Avoid external imports—everything you need (React, Ant Design, dayjs, Flow helpers) is already exposed on `ctx` or `ctx.libs`.
