/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionTreeEntryInput } from './types';

export const DEFAULT_LIGHT_EXTENSION_README = `# Light extension source

Put each reusable entry in its own directory:

- JS Block: \`src/client/js-blocks/<entry-name>/index.tsx\`
- JS Action: \`src/client/js-actions/<entry-name>/index.ts\`
- JS Field: \`src/client/js-fields/<entry-name>/index.tsx\`
- JS Item / JS Entry: \`src/client/js-items/<entry-name>/index.tsx\`

Light Extension supports only these four entry kinds: JS Block, JS Field, JS Action, and JS Item. Generic or nested RunJS source stays inline and is not a Light Extension entry kind.

An entry can use \`index.ts\`, \`index.tsx\`, \`index.js\`, or \`index.jsx\`. Keep entry-specific modules in the same entry directory. Put modules shared by multiple entries in \`src/shared/\`.

Every entry root must include \`entry.json\`. Its required \`schemaVersion\` and \`key\` fields define the descriptor version and stable technical identity. The key stays unchanged when the entry directory is renamed.

When \`entry.json.settingsSchema\` defines an object schema, every top-level property is shown as an independent settings menu. Property declaration order controls the menu order.

Generated descriptors intentionally omit the optional \`$schema\` field. Authoring and runtime validation use the bundled contract and never probe a Schema URL over the network.

Use \`@nocobase/light-extension-sdk/client\` and \`@nocobase/light-extension-sdk/shared\` for explicit authoring types. Entry settings types are generated from \`entry.json.settingsSchema\` by the authoring workspace.
`;

export const LIGHT_EXTENSION_TSCONFIG_CONTENT =
  '{\n  "compilerOptions": {\n    "allowSyntheticDefaultImports": true,\n    "baseUrl": ".",\n    "esModuleInterop": true,\n    "jsx": "react",\n    "module": "ESNext",\n    "moduleResolution": "Node",\n    "resolveJsonModule": true,\n    "skipLibCheck": true,\n    "strict": false,\n    "target": "ES2020"\n  }\n}\n';

export const BASE_LIGHT_EXTENSION_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  {
    path: 'README.md',
    content: DEFAULT_LIGHT_EXTENSION_README,
    language: 'markdown',
  },
  {
    path: 'tsconfig.json',
    content: LIGHT_EXTENSION_TSCONFIG_CONTENT,
    language: 'json',
  },
];

export const DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  ...BASE_LIGHT_EXTENSION_TEMPLATE_FILES,
  {
    path: 'src/client/js-blocks/example/index.tsx',
    content: 'ctx.render(<div>Example block</div>);\n',
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/example/entry.json',
    content: '{\n  "schemaVersion": 1,\n  "key": "example"\n}\n',
    language: 'json',
  },
  {
    path: 'src/client/js-actions/example/index.ts',
    content: 'export default async function run() {\n  return true;\n}\n',
    language: 'typescript',
  },
  {
    path: 'src/client/js-actions/example/entry.json',
    content: '{\n  "schemaVersion": 1,\n  "key": "example"\n}\n',
    language: 'json',
  },
  {
    path: 'src/client/js-fields/example/index.tsx',
    content: "ctx.render(<span>{String(ctx.value ?? '')}</span>);\n",
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/example/entry.json',
    content: '{\n  "schemaVersion": 1,\n  "key": "example"\n}\n',
    language: 'json',
  },
  {
    path: 'src/client/js-items/example/index.tsx',
    content: 'ctx.render(<span>Example item</span>);\n',
    language: 'typescript',
  },
  {
    path: 'src/client/js-items/example/entry.json',
    content: '{\n  "schemaVersion": 1,\n  "key": "example"\n}\n',
    language: 'json',
  },
];

export function createLightExtensionBaseTemplate(): LightExtensionTreeEntryInput[] {
  return BASE_LIGHT_EXTENSION_TEMPLATE_FILES.map((file) => ({ ...file }));
}

export function createDefaultLightExtensionTemplate(): LightExtensionTreeEntryInput[] {
  return DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.map((file) => ({ ...file }));
}
