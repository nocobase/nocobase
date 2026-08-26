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

```markdown
```tsx file="./_demos/flow-model-renderer.tsx" preview
```
```

