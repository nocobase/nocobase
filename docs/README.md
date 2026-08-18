# NocoBase Documentation

## `--lang`

```bash
yarn docs dev --lang=en
yarn docs build --lang=en
yarn docs preview --lang=en
yarn docs build --lang=all
```

## `--check-dead-links`

```bash
yarn docs build --lang=en --check-dead-links
```

## Documentation AI assistant

The documentation assistant calls an independent Rust backend from the `docs-ai-service` repository. The backend searches and verifies live pages under `docs.nocobase.com`; the documentation build does not generate a local AI index.

For local Chinese development, start the backend, then restart Rspress with the backend URL defined at build time:

```powershell
Set-Location <path-to-docs-ai-service>
cargo run

Set-Location <path-to-nocobase>
$env:DOCS_AI_API_URL = 'http://127.0.0.1:3100'
corepack yarn --cwd docs dev --lang=cn
```

Configure the backend for the approved DeepSeek online search provider before starting it. The UI always displays server-provided official citations and renders answer text without raw HTML.

## eject `rspress components`

Customize the theme by ejecting the components. After ejecting, you can find the components in `./src/components` and modify them as you like.

```bash
yarn eject <ComponentName>
```

## demo preview

use `@docs/*` to import the demo components, which will be replaced with the actual path during build.

```tsx
import { HelloModel } from '@docs/cn/flow-engine/_demos/HelloModel';
```

Then use the demo component in the markdown file:

````markdown
```tsx file="./_demos/flow-model-renderer.tsx" preview

```
````
