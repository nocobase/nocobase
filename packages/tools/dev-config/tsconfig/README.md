# TypeScript presets

The application presets support TypeScript 6 and 7. Library builds use TypeScript 6. Keep package-relative fields such as
`include`, `exclude`, `paths`, `baseUrl`, `rootDir`, `outDir`, and
`tsBuildInfoFile` in the consuming package. Relative paths in a published
preset would otherwise resolve inside `@nocobase/dev-config`.

## Choosing a preset

| Preset                | Runtime          | Emits       | Declarations |
| --------------------- | ---------------- | ----------- | ------------ |
| `base.json`           | Unspecified      | Unspecified | No           |
| `client.json`         | Browser/React    | No          | No           |
| `client-library.json` | Browser/React    | Yes         | Yes          |
| `server.json`         | Node             | Yes         | No           |
| `server-library.json` | Node             | Yes         | Yes          |
| `node-tooling.json`   | Node-based tools | No          | No           |

Declaration presets enable both `isolatedDeclarations` and
`isolatedModules`. Every exported API in a declaration-emitting project must
therefore have a declaration-safe, explicit type.

## Example

```json
{
  "extends": "@nocobase/dev-config/tsconfig/client.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./client/*"]
    },
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/.tmp/client.tsbuildinfo"
  },
  "include": ["client", "registry"]
}
```

Local compiler options may override a preset when the runtime or output layout
requires it. Prefer a small override that documents the actual difference
instead of copying the complete preset.
