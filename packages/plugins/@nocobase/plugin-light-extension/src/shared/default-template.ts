/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionTreeEntryInput } from './types';

import { DEFAULT_JS_PAGE_TEMPLATE_FILES } from './default-template-js-pages';

export const DEFAULT_LIGHT_EXTENSION_README = `# Light extension source

Put each reusable entry in its own directory:

- JS Block: \`src/client/js-blocks/<entry-name>/index.tsx\`
- JS Page: \`src/client/js-pages/<entry-name>/index.tsx\`
- JS Action: \`src/client/js-actions/<entry-name>/index.ts\`
- JS Field / JS Column: \`src/client/js-fields/<entry-name>/index.tsx\`
- JS Item: \`src/client/js-items/<entry-name>/index.tsx\`
- RunJS value: \`src/client/runjs/<entry-name>/index.ts\`

Every entry root must include \`entry.json\` with \`schemaVersion\` and a stable \`key\`. Entry settings are available through \`ctx.settings\`; use \`ctx.t()\` for runtime-visible strings.

Use \`@nocobase/light-extension-sdk/client\` and \`@nocobase/light-extension-sdk/shared\` for authoring types. Modules may import other files inside their entry directory or shared modules from \`src/shared/\`.
`;

export const LIGHT_EXTENSION_TSCONFIG_CONTENT =
  '{\n  "compilerOptions": {\n    "allowSyntheticDefaultImports": true,\n    "baseUrl": ".",\n    "esModuleInterop": true,\n    "jsx": "react",\n    "module": "ESNext",\n    "moduleResolution": "Node",\n    "resolveJsonModule": true,\n    "skipLibCheck": true,\n    "strict": false,\n    "target": "ES2020"\n  }\n}\n';

export const BASE_LIGHT_EXTENSION_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  { path: 'README.md', content: DEFAULT_LIGHT_EXTENSION_README, language: 'markdown' },
  { path: 'tsconfig.json', content: LIGHT_EXTENSION_TSCONFIG_CONTENT, language: 'json' },
];

export const DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES: readonly LightExtensionTreeEntryInput[] = [
  ...BASE_LIGHT_EXTENSION_TEMPLATE_FILES,
  ...DEFAULT_JS_PAGE_TEMPLATE_FILES,
  {
    path: 'src/client/js-blocks/welcome-card/index.tsx',
    content: `const { Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t(String(ctx.settings?.title || 'Welcome'))}>
    {ctx.t(String(ctx.settings?.message || 'Build reusable UI with light extensions.'))}
  </Card>,
);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/welcome-card/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "welcome-card",
  "title": "Welcome card",
  "description": "Minimal render-surface example.",
  "category": "examples",
  "tags": ["JS Block"],
  "sort": 10,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "Welcome", "required": true, "x-component": "Input" },
    "message": { "type": "string", "title": "Message", "default": "Build reusable UI with light extensions.", "x-component": "Input.TextArea" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-actions/refresh-data/index.ts',
    content: `if (!ctx.resource?.refresh) {
  ctx.message.warning(ctx.t('No resource to refresh'));
  return;
}

await ctx.resource.refresh();
ctx.message.success(ctx.t(String(ctx.settings?.successMessage || 'Resource refreshed')));
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-actions/refresh-data/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "refresh-data",
  "title": "Refresh data",
  "description": "Minimal action-surface example.",
  "category": "examples",
  "tags": ["JS Action"],
  "sort": 10,
  "settings": {
    "successMessage": { "type": "string", "title": "Success message", "default": "Resource refreshed", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-fields/status-tag/index.tsx',
    content: `const { Tag } = ctx.libs.antd;
const value = ctx.getValue?.() ?? ctx.value ?? ctx.settings?.emptyText ?? '-';

ctx.render(<Tag color={String(ctx.settings?.color || 'blue')}>{String(value)}</Tag>);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/status-tag/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "status-tag",
  "title": "Status tag",
  "description": "Minimal bound-field render example.",
  "category": "js-field",
  "tags": ["JS Field"],
  "sort": 10,
  "settings": {
    "color": { "type": "string", "title": "Color", "default": "blue", "x-component": "ColorPicker" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "-", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-fields/record-status-column/index.tsx',
    content: `const { Tag } = ctx.libs.antd;
const resolvedRecord = await ctx.getVar('ctx.record');
const record = resolvedRecord && typeof resolvedRecord === 'object' && !Array.isArray(resolvedRecord)
  ? (resolvedRecord as Record<string, unknown>)
  : {};
const value = record[String(ctx.settings?.fieldName || 'status')] ?? ctx.settings?.emptyText ?? '-';

ctx.render(<Tag>{String(value)}</Tag>);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/record-status-column/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "record-status-column",
  "title": "Record status column",
  "description": "Minimal standalone JS Column example.",
  "category": "js-column",
  "tags": ["JS Column"],
  "sort": 20,
  "settings": {
    "fieldName": { "type": "string", "title": "Field", "default": "status", "required": true, "x-component": "Input" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "-", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-items/form-total-preview/index.tsx',
    content: `const { Statistic } = ctx.libs.antd;
const resolvedValues = await ctx.getVar('ctx.formValues');
const values = resolvedValues && typeof resolvedValues === 'object' && !Array.isArray(resolvedValues)
  ? (resolvedValues as Record<string, unknown>)
  : {};
const quantity = Number(values[String(ctx.settings?.quantityField || 'quantity')] || 0);
const unitPrice = Number(values[String(ctx.settings?.unitPriceField || 'unitPrice')] || 0);

ctx.render(<Statistic title={ctx.t('Calculated total')} value={quantity * unitPrice} />);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-items/form-total-preview/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "form-total-preview",
  "title": "Form total preview",
  "description": "Minimal JS Item example.",
  "category": "js-item",
  "tags": ["JS Item"],
  "sort": 10,
  "settings": {
    "quantityField": { "type": "string", "title": "Quantity field", "default": "quantity", "required": true, "x-component": "Input" },
    "unitPriceField": { "type": "string", "title": "Unit price field", "default": "unitPrice", "required": true, "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/runjs/calculate-subtotal/index.ts',
    content: `const resolvedValues = await ctx.getVar('ctx.formValues');
const values = resolvedValues && typeof resolvedValues === 'object' && !Array.isArray(resolvedValues)
  ? (resolvedValues as Record<string, unknown>)
  : {};
const quantity = Number(values[String(ctx.settings?.quantityField || 'quantity')] || 0);
const unitPrice = Number(values[String(ctx.settings?.unitPriceField || 'unitPrice')] || 0);

return quantity * unitPrice;
`,
    language: 'typescript',
  },
  {
    path: 'src/client/runjs/calculate-subtotal/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "calculate-subtotal",
  "title": "Calculate subtotal",
  "description": "Minimal value-return RunJS example.",
  "category": "runjs",
  "tags": ["RunJS"],
  "sort": 10,
  "settings": {
    "quantityField": { "type": "string", "title": "Quantity field", "default": "quantity", "required": true, "x-component": "Input" },
    "unitPriceField": { "type": "string", "title": "Unit price field", "default": "unitPrice", "required": true, "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
];

export function createLightExtensionBaseTemplate(): LightExtensionTreeEntryInput[] {
  return BASE_LIGHT_EXTENSION_TEMPLATE_FILES.map((file) => ({ ...file }));
}

export function createDefaultLightExtensionTemplate(): LightExtensionTreeEntryInput[] {
  return DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.map((file) => ({ ...file }));
}
