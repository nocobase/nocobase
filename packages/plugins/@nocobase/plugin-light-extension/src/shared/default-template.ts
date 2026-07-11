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
- RunJS: \`src/client/runjs/<entry-name>/index.ts\`

An entry can use \`index.ts\`, \`index.tsx\`, \`index.js\`, or \`index.jsx\`. Keep entry-specific modules in the same entry directory. Put modules shared by multiple entries in \`src/shared/\`.
`;

export const LIGHT_EXTENSION_SDK_SHIM_PATH = 'src/shared/light-extension-sdk.d.ts';
export const LIGHT_EXTENSION_SDK_SHIM_CONTENT = `declare module "@nocobase/light-extension-sdk/client" {
  export interface LightExtensionSettingsContext<TSettings = unknown> {
    settings: TSettings;
  }

  export type LightExtensionRecord = Record<string, unknown>;

  export interface LightExtensionDataContext<TSettings = unknown> extends LightExtensionSettingsContext<TSettings> {
    record?: LightExtensionRecord | null;
    records?: LightExtensionRecord[];
    values?: LightExtensionRecord;
    collection?: unknown;
    collectionField?: unknown;
    dataSource?: unknown;
  }

  export interface JSBlockContext<TSettings = unknown> extends LightExtensionDataContext<TSettings> {
    element?: HTMLElement | null;
    render?: (node: unknown) => void;
    i18n?: {
      t: (key: string, options?: Record<string, unknown>) => string;
    };
  }

  export interface JSFieldContext<TSettings = unknown, TValue = unknown> extends LightExtensionDataContext<TSettings> {
    value?: TValue;
  }

  export interface JSActionContext<TSettings = unknown> extends LightExtensionDataContext<TSettings> {
    event?: unknown;
    formValues?: LightExtensionRecord;
  }

  export interface JSItemContext<TSettings = unknown, TValue = unknown> extends LightExtensionDataContext<TSettings> {
    value?: TValue;
  }

  export interface RunJSContext<TSettings = unknown, TInput = unknown> extends LightExtensionDataContext<TSettings> {
    input?: TInput;
    event?: unknown;
    formValues?: LightExtensionRecord;
  }

  export function defineSettings<TSettings>(settings: TSettings): TSettings;
  export function assertSettings<TSettings>(settings: TSettings): TSettings;
}

declare module "@nocobase/light-extension-sdk/shared" {
  export interface LightExtensionSettingsContext<TSettings = unknown> {
    settings: TSettings;
  }

  export type LightExtensionRecord = Record<string, unknown>;

  export interface LightExtensionDataContext<TSettings = unknown> extends LightExtensionSettingsContext<TSettings> {
    record?: LightExtensionRecord | null;
    records?: LightExtensionRecord[];
    values?: LightExtensionRecord;
    collection?: unknown;
    collectionField?: unknown;
    dataSource?: unknown;
  }

  export function defineSettings<TSettings>(settings: TSettings): TSettings;
  export function assertSettings<TSettings>(settings: TSettings): TSettings;
}
`;

export const LIGHT_EXTENSION_TSCONFIG_CONTENT =
  '{\n  "compilerOptions": {\n    "baseUrl": ".",\n    "jsx": "react-jsx",\n    "strict": true,\n    "target": "ES2020",\n    "paths": {\n      "@nocobase/light-extension-sdk/client": ["src/shared/light-extension-sdk.d.ts"],\n      "@nocobase/light-extension-sdk/shared": ["src/shared/light-extension-sdk.d.ts"],\n      "light-extension:settings/*": [".light-extension/types/*"]\n    }\n  }\n}\n';

export const DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  {
    path: 'README.md',
    content: DEFAULT_LIGHT_EXTENSION_README,
    language: 'markdown',
  },
  {
    path: 'light-extension.json',
    content: '{\n  "schemaVersion": 1\n}\n',
    language: 'json',
  },
  {
    path: 'tsconfig.json',
    content: LIGHT_EXTENSION_TSCONFIG_CONTENT,
    language: 'json',
  },
  {
    path: LIGHT_EXTENSION_SDK_SHIM_PATH,
    content: LIGHT_EXTENSION_SDK_SHIM_CONTENT,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/example/index.tsx',
    content: 'ctx.render(<div>Example block</div>);\n',
    language: 'typescript',
  },
  {
    path: 'src/client/js-actions/example/index.ts',
    content: 'export default async function run() {\n  return true;\n}\n',
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/example/index.tsx',
    content: "ctx.render(<span>{String(ctx.value ?? '')}</span>);\n",
    language: 'typescript',
  },
  {
    path: 'src/client/js-items/example/index.tsx',
    content: 'ctx.render(<span>Example item</span>);\n',
    language: 'typescript',
  },
  {
    path: 'src/client/runjs/example/index.ts',
    content: 'export default async function run() {\n  return true;\n}\n',
    language: 'typescript',
  },
];

export function createDefaultLightExtensionTemplate(): LightExtensionTreeEntryInput[] {
  return DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.map((file) => ({ ...file }));
}
