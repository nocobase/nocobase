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
- JS Column: reuse \`src/client/js-fields/<entry-name>/index.tsx\` because JS Field and JS Column share the same light-extension kind
- RunJS value: \`src/client/runjs/<entry-name>/index.ts\`

Light Extension supports JS Block, JS Field (including JS Column), JS Action, JS Item, and value-return RunJS entries.

An entry can use \`index.ts\`, \`index.tsx\`, \`index.js\`, or \`index.jsx\`. Keep entry-specific modules in the same entry directory. Put modules shared by multiple entries in \`src/shared/\`.

Every entry root must include \`entry.json\`. Its required \`schemaVersion\` and \`key\` fields define the descriptor version and stable technical identity. The key stays unchanged when the entry directory is renamed.

When \`entry.json.settings\` defines fields, every property is shown as an independent settings menu. Property declaration order controls the menu order. The runtime wraps this field map as an object schema internally, so authors do not need to write \`type: "object"\` or \`properties\` at the root. Set \`required: true\` on a field when it must be configured.

Do not add a \`$schema\` field. Authoring and runtime validation use the bundled contract directly and never probe a Schema URL over the network.

Use \`@nocobase/light-extension-sdk/client\` and \`@nocobase/light-extension-sdk/shared\` for explicit authoring types. Entry settings types are generated from \`entry.json.settings\` by the authoring workspace.
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
    path: 'src/client/js-blocks/welcome-card/index.tsx',
    content: `const { Card, Space, Tag, Typography } = ctx.libs.antd;
const dayjs = ctx.libs.dayjs;
const user = ctx.user ?? ctx.auth?.user ?? null;
const displayName = String(user?.nickname ?? user?.username ?? ctx.t('Anonymous'));
const title = ctx.t(String(ctx.settings?.title || 'Welcome'));
const description = ctx.t(
  String(ctx.settings?.description || 'Build reusable UI with light extensions.'),
);
const accentColor = String(ctx.settings?.accentColor || '#1677ff');

ctx.render(
  <Card size="small" style={{ borderTop: \`3px solid \${accentColor}\` }}>
    <Space direction="vertical" size={4}>
      <Space wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}, {displayName}
        </Typography.Title>
        <Tag color={accentColor}>{ctx.t('Light extension')}</Tag>
      </Space>
      <Typography.Text type="secondary">{description}</Typography.Text>
      {ctx.settings?.showTimestamp !== false ? (
        <Typography.Text type="secondary">{dayjs().format('YYYY-MM-DD HH:mm')}</Typography.Text>
      ) : null}
    </Space>
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
  "description": "Configurable welcome card with a timestamp and accent color.",
  "category": "examples",
  "tags": ["JS Block", "Ant Design"],
  "sort": 10,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "Welcome", "required": true, "x-component": "Input" },
    "description": { "type": "string", "title": "Description", "default": "Build reusable UI with light extensions.", "x-component": "Input.TextArea" },
    "accentColor": { "type": "string", "title": "Accent color", "default": "#1677ff", "x-component": "ColorPicker" },
    "showTimestamp": { "type": "boolean", "title": "Show timestamp", "default": true, "x-component": "Switch" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-blocks/collection-summary/index.tsx',
    content: `const { Alert, Card, Empty, List, Typography } = ctx.libs.antd;
const collectionName = String(ctx.settings?.collectionName || 'users');
const displayField = String(ctx.settings?.displayField || 'username');
const pageSize = Number(ctx.settings?.pageSize || 5);
const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

try {
  ctx.initResource('MultiRecordResource');
  const resource = ctx.resource;
  if (!resource.setResourceName || !resource.runAction) {
    throw new Error(ctx.t('Unable to initialize resource'));
  }
  resource.setResourceName(collectionName);
  const result = await resource.runAction('list', {
    method: 'get',
    params: {
      pageSize,
      sort: ['-createdAt'],
    },
  });
  const resultData = toRecord(result).data;
  const rows = Array.isArray(resultData) ? resultData : [];

  ctx.render(
    <Card size="small" title={ctx.t(String(ctx.settings?.title || 'Recent records'))}>
      {rows.length ? (
        <List
          size="small"
          dataSource={rows}
          renderItem={(row) => {
            const record = toRecord(row);
            return (
              <List.Item>
                <Typography.Text>
                  {String(record[displayField] ?? record.name ?? record.id ?? '-')}
                </Typography.Text>
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty description={ctx.t(String(ctx.settings?.emptyText || 'No data'))} />
      )}
    </Card>,
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  ctx.render(
    <Alert
      type="error"
      showIcon
      message={ctx.t('Failed to load data')}
      description={errorMessage}
    />,
  );
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-blocks/collection-summary/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "collection-summary",
  "title": "Collection summary",
  "description": "Loads recent records through a MultiRecordResource and renders an Ant Design list.",
  "category": "examples",
  "tags": ["JS Block", "Resource"],
  "sort": 20,
  "settings": {
    "title": { "type": "string", "title": "Title", "default": "Recent records", "x-component": "Input" },
    "collectionName": { "type": "string", "title": "Collection", "default": "users", "required": true, "x-component": "CollectionSelect" },
    "displayField": { "type": "string", "title": "Display field", "default": "username", "required": true, "x-component": "Input" },
    "pageSize": { "type": "integer", "title": "Page size", "default": 5, "minimum": 1, "maximum": 20, "x-component": "InputNumber" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "No data", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-actions/refresh-data/index.ts',
    content: `const resource = ctx.resource;

if (!resource?.refresh) {
  ctx.message.warning(ctx.t(String(ctx.settings?.unavailableMessage || 'No resource to refresh')));
  return;
}

await resource.refresh();
if (ctx.settings?.notifySuccess !== false) {
  ctx.message.success(ctx.t(String(ctx.settings?.successMessage || 'Resource refreshed')));
}
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-actions/refresh-data/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "refresh-data",
  "title": "Refresh data",
  "description": "Refreshes the current resource and optionally shows a success message.",
  "category": "examples",
  "tags": ["JS Action", "Resource"],
  "sort": 10,
  "settings": {
    "successMessage": { "type": "string", "title": "Success message", "default": "Resource refreshed", "x-component": "Input" },
    "unavailableMessage": { "type": "string", "title": "Unavailable message", "default": "No resource to refresh", "x-component": "Input" },
    "notifySuccess": { "type": "boolean", "title": "Notify on success", "default": true, "x-component": "Switch" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-actions/confirm-action/index.ts',
    content: `const { Modal } = ctx.libs.antd;
const confirmed = await new Promise<boolean>((resolve) => {
  Modal.confirm({
    title: ctx.t(String(ctx.settings?.title || 'Confirm action')),
    content: ctx.t(String(ctx.settings?.content || 'Continue with this action?')),
    okText: ctx.t(String(ctx.settings?.confirmText || 'Continue')),
    cancelText: ctx.t(String(ctx.settings?.cancelText || 'Cancel')),
    onOk: () => resolve(true),
    onCancel: () => resolve(false),
  });
});

if (!confirmed) {
  return;
}

ctx.message.success(ctx.t(String(ctx.settings?.successMessage || 'Action confirmed')));
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-actions/confirm-action/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "confirm-action",
  "title": "Confirm action",
  "description": "Shows a configurable confirmation dialog before running an action.",
  "category": "examples",
  "tags": ["JS Action", "Confirmation"],
  "sort": 20,
  "settings": {
    "title": { "type": "string", "title": "Dialog title", "default": "Confirm action", "required": true, "x-component": "Input" },
    "content": { "type": "string", "title": "Dialog content", "default": "Continue with this action?", "x-component": "Input.TextArea" },
    "confirmText": { "type": "string", "title": "Confirm text", "default": "Continue", "x-component": "Input" },
    "cancelText": { "type": "string", "title": "Cancel text", "default": "Cancel", "x-component": "Input" },
    "successMessage": { "type": "string", "title": "Success message", "default": "Action confirmed", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-fields/status-tag/index.tsx',
    content: `const { Tag } = ctx.libs.antd;
const rawValue = ctx.getValue?.() ?? ctx.value;
const status =
  rawValue == null || String(rawValue).trim() === ''
    ? String(ctx.settings?.emptyText || ctx.t('Unknown'))
    : String(rawValue);
const activeValue = String(ctx.settings?.activeValue || 'active');
const warningValue = String(ctx.settings?.warningValue || 'pending');
const color =
  status === activeValue
    ? String(ctx.settings?.activeColor || '#52c41a')
    : status === warningValue
      ? String(ctx.settings?.warningColor || '#faad14')
      : String(ctx.settings?.fallbackColor || '#8c8c8c');

ctx.render(<Tag color={color}>{ctx.t(status)}</Tag>);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/status-tag/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "status-tag",
  "title": "Status tag",
  "description": "Renders a bound field value as a configurable Ant Design tag.",
  "category": "js-field",
  "tags": ["JS Field", "Display"],
  "sort": 10,
  "settings": {
    "activeValue": { "type": "string", "title": "Active value", "default": "active", "x-component": "Input" },
    "warningValue": { "type": "string", "title": "Warning value", "default": "pending", "x-component": "Input" },
    "activeColor": { "type": "string", "title": "Active color", "default": "#52c41a", "x-component": "ColorPicker" },
    "warningColor": { "type": "string", "title": "Warning color", "default": "#faad14", "x-component": "ColorPicker" },
    "fallbackColor": { "type": "string", "title": "Fallback color", "default": "#8c8c8c", "x-component": "ColorPicker" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "Unknown", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-fields/editable-text/index.tsx',
    content: `const { Input } = ctx.libs.antd;
const useState = (
  ctx.libs.React as {
    useState(initialValue: string): [string, (nextValue: string) => void];
  }
).useState;
const initialValue = ctx.getValue?.() ?? ctx.value;

function EditableText() {
  const [value, setValue] = useState(initialValue == null ? '' : String(initialValue));
  const updateValue = (nextValue: string) => {
    setValue(nextValue);
    ctx.setValue?.(nextValue);
  };

  return (
    <Input
      allowClear={ctx.settings?.allowClear !== false}
      value={value}
      maxLength={Number(ctx.settings?.maxLength ?? 80)}
      placeholder={ctx.t(String(ctx.settings?.placeholder || 'Enter a value'))}
      onChange={(event) => updateValue(event.target.value)}
      onBlur={(event) => {
        if (ctx.settings?.trimOnBlur !== false) {
          updateValue(event.target.value.trim());
        }
      }}
    />
  );
}

ctx.render(<EditableText />);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/editable-text/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "editable-text",
  "title": "Editable text",
  "description": "Renders an editable input and writes changes through ctx.setValue().",
  "category": "js-field",
  "tags": ["JS Field", "Form"],
  "sort": 20,
  "settings": {
    "placeholder": { "type": "string", "title": "Placeholder", "default": "Enter a value", "x-component": "Input" },
    "maxLength": { "type": "integer", "title": "Maximum length", "default": 80, "minimum": 1, "maximum": 500, "x-component": "InputNumber" },
    "allowClear": { "type": "boolean", "title": "Allow clear", "default": true, "x-component": "Switch" },
    "trimOnBlur": { "type": "boolean", "title": "Trim on blur", "default": true, "x-component": "Switch" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-fields/record-status-column/index.tsx',
    content: `const { Tag } = ctx.libs.antd;
const resolvedRecord = await ctx.getVar('ctx.record');
const record =
  resolvedRecord && typeof resolvedRecord === 'object' && !Array.isArray(resolvedRecord)
    ? (resolvedRecord as Record<string, unknown>)
    : {};
const fieldName = String(ctx.settings?.fieldName || 'status');
const status = String(record?.[fieldName] ?? ctx.settings?.emptyText ?? ctx.t('Unknown'));
const activeValue = String(ctx.settings?.activeValue || 'active');
const warningValue = String(ctx.settings?.warningValue || 'pending');
const color =
  status === activeValue
    ? String(ctx.settings?.activeColor || '#52c41a')
    : status === warningValue
      ? String(ctx.settings?.warningColor || '#faad14')
      : String(ctx.settings?.fallbackColor || '#8c8c8c');

ctx.render(<Tag color={color}>{ctx.t(status)}</Tag>);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/record-status-column/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "record-status-column",
  "title": "Record status column",
  "description": "Standalone JS Column that reads a configurable field from the current table record.",
  "category": "js-column",
  "tags": ["JS Column", "Table"],
  "sort": 30,
  "settings": {
    "fieldName": { "type": "string", "title": "Status field", "default": "status", "required": true, "x-component": "Input" },
    "activeValue": { "type": "string", "title": "Active value", "default": "active", "x-component": "Input" },
    "warningValue": { "type": "string", "title": "Warning value", "default": "pending", "x-component": "Input" },
    "activeColor": { "type": "string", "title": "Active color", "default": "#52c41a", "x-component": "ColorPicker" },
    "warningColor": { "type": "string", "title": "Warning color", "default": "#faad14", "x-component": "ColorPicker" },
    "fallbackColor": { "type": "string", "title": "Fallback color", "default": "#8c8c8c", "x-component": "ColorPicker" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "Unknown", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-fields/record-summary-column/index.tsx',
    content: `const { Space, Typography } = ctx.libs.antd;
const resolvedRecord = await ctx.getVar('ctx.record');
const record =
  resolvedRecord && typeof resolvedRecord === 'object' && !Array.isArray(resolvedRecord)
    ? (resolvedRecord as Record<string, unknown>)
    : {};
const primary = record?.[String(ctx.settings?.primaryField || 'title')];
const secondary = record?.[String(ctx.settings?.secondaryField || 'name')];
const parts = [primary, secondary]
  .filter((value) => value != null && String(value).trim() !== '')
  .map(String);
const text = parts.join(String(ctx.settings?.separator || ' · ')) || String(ctx.settings?.emptyText || '-');

ctx.render(
  <Space size={6}>
    <Typography.Text type="secondary">{ctx.t('Summary')}</Typography.Text>
    <Typography.Text ellipsis={{ tooltip: text }}>{text}</Typography.Text>
  </Space>,
);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-fields/record-summary-column/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "record-summary-column",
  "title": "Record summary column",
  "description": "Standalone JS Column that combines two configurable fields into one compact summary.",
  "category": "js-column",
  "tags": ["JS Column", "Table"],
  "sort": 40,
  "settings": {
    "primaryField": { "type": "string", "title": "Primary field", "default": "title", "required": true, "x-component": "Input" },
    "secondaryField": { "type": "string", "title": "Secondary field", "default": "name", "x-component": "Input" },
    "separator": { "type": "string", "title": "Separator", "default": " · ", "x-component": "Input" },
    "emptyText": { "type": "string", "title": "Empty text", "default": "-", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-items/form-total-preview/index.tsx',
    content: `const { Card, Statistic } = ctx.libs.antd;
const resolvedValues = await ctx.getVar('ctx.formValues');
const values =
  resolvedValues && typeof resolvedValues === 'object' && !Array.isArray(resolvedValues)
    ? (resolvedValues as Record<string, unknown>)
    : {};
const quantityField = String(ctx.settings?.quantityField || 'quantity');
const unitPriceField = String(ctx.settings?.unitPriceField || 'unitPrice');
const quantity = Number(values?.[quantityField] || 0);
const unitPrice = Number(values?.[unitPriceField] || 0);

if (ctx.settings?.hideWhenEmpty === true && !quantity && !unitPrice) {
  ctx.render(null);
  return;
}

ctx.render(
  <Card size="small">
    <Statistic
      title={ctx.t('Calculated total')}
      value={quantity * unitPrice}
      precision={Number(ctx.settings?.precision ?? 2)}
      prefix={String(ctx.settings?.currency || 'USD')}
    />
  </Card>,
);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-items/form-total-preview/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "form-total-preview",
  "title": "Form total preview",
  "description": "Standalone form item that previews quantity multiplied by unit price.",
  "category": "js-item",
  "tags": ["JS Item", "Form"],
  "sort": 10,
  "settings": {
    "quantityField": { "type": "string", "title": "Quantity field", "default": "quantity", "required": true, "x-component": "Input" },
    "unitPriceField": { "type": "string", "title": "Unit price field", "default": "unitPrice", "required": true, "x-component": "Input" },
    "currency": { "type": "string", "title": "Currency", "default": "USD", "x-component": "Input" },
    "precision": { "type": "integer", "title": "Precision", "default": 2, "minimum": 0, "maximum": 6, "x-component": "InputNumber" },
    "hideWhenEmpty": { "type": "boolean", "title": "Hide when empty", "default": false, "x-component": "Switch" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/js-items/selection-tools/index.tsx',
    content: `const { Button, Space } = ctx.libs.antd;
const { ReloadOutlined } = ctx.libs.antdIcons;

const inspect = () => {
  const rows = ctx.resource?.getSelectedRows?.() || [];
  if (!rows.length) {
    ctx.message.warning(ctx.t(String(ctx.settings?.noSelectionMessage || 'Please select records')));
    return;
  }
  ctx.message.info(ctx.t('Selected {{count}} rows', { count: rows.length }));
};

const refresh = async () => {
  if (!ctx.resource?.refresh) {
    ctx.message.warning(ctx.t('No resource to refresh'));
    return;
  }
  await ctx.resource.refresh();
  ctx.message.success(ctx.t(String(ctx.settings?.refreshedMessage || 'Resource refreshed')));
};

ctx.render(
  <Space.Compact>
    <Button onClick={inspect}>
      {ctx.t(String(ctx.settings?.inspectLabel || 'Inspect selection'))}
    </Button>
    <Button icon={<ReloadOutlined />} onClick={refresh}>
      {ctx.t(String(ctx.settings?.refreshLabel || 'Refresh'))}
    </Button>
  </Space.Compact>,
);
`,
    language: 'typescript',
  },
  {
    path: 'src/client/js-items/selection-tools/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "selection-tools",
  "title": "Selection tools",
  "description": "Custom action item with buttons for inspecting selected rows and refreshing data.",
  "category": "js-item",
  "tags": ["JS Item", "Action bar"],
  "sort": 20,
  "settings": {
    "inspectLabel": { "type": "string", "title": "Inspect label", "default": "Inspect selection", "x-component": "Input" },
    "refreshLabel": { "type": "string", "title": "Refresh label", "default": "Refresh", "x-component": "Input" },
    "noSelectionMessage": { "type": "string", "title": "No selection message", "default": "Please select records", "x-component": "Input" },
    "refreshedMessage": { "type": "string", "title": "Refreshed message", "default": "Resource refreshed", "x-component": "Input" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/runjs/calculate-subtotal/index.ts',
    content: `const resolvedValues = await ctx.getVar('ctx.formValues');
const values =
  resolvedValues && typeof resolvedValues === 'object' && !Array.isArray(resolvedValues)
    ? (resolvedValues as Record<string, unknown>)
    : {};
const quantity = Number(values?.[String(ctx.settings?.quantityField || 'quantity')] || 0);
const unitPrice = Number(values?.[String(ctx.settings?.unitPriceField || 'unitPrice')] || 0);
const precision = Number(ctx.settings?.precision ?? 2);

return Number((quantity * unitPrice).toFixed(precision));
`,
    language: 'typescript',
  },
  {
    path: 'src/client/runjs/calculate-subtotal/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "calculate-subtotal",
  "title": "Calculate subtotal",
  "description": "Value-return RunJS that multiplies two configurable form fields.",
  "category": "runjs",
  "tags": ["RunJS", "Form value"],
  "sort": 10,
  "settings": {
    "quantityField": { "type": "string", "title": "Quantity field", "default": "quantity", "required": true, "x-component": "Input" },
    "unitPriceField": { "type": "string", "title": "Unit price field", "default": "unitPrice", "required": true, "x-component": "Input" },
    "precision": { "type": "integer", "title": "Precision", "default": 2, "minimum": 0, "maximum": 6, "x-component": "InputNumber" }
  }
}
`,
    language: 'json',
  },
  {
    path: 'src/client/runjs/calculate-total-with-tax/index.ts',
    content: `const resolvedValues = await ctx.getVar('ctx.formValues');
const values =
  resolvedValues && typeof resolvedValues === 'object' && !Array.isArray(resolvedValues)
    ? (resolvedValues as Record<string, unknown>)
    : {};
const subtotal = Number(values?.[String(ctx.settings?.subtotalField || 'subtotal')] || 0);
const taxRate = Number(values?.[String(ctx.settings?.taxRateField || 'taxRate')] || 0);
const precision = Number(ctx.settings?.precision ?? 2);

return Number((subtotal + subtotal * taxRate).toFixed(precision));
`,
    language: 'typescript',
  },
  {
    path: 'src/client/runjs/calculate-total-with-tax/entry.json',
    content: `{
  "schemaVersion": 1,
  "key": "calculate-total-with-tax",
  "title": "Calculate total with tax",
  "description": "Value-return RunJS that adds a configurable tax-rate field to a subtotal.",
  "category": "runjs",
  "tags": ["RunJS", "Form value"],
  "sort": 20,
  "settings": {
    "subtotalField": { "type": "string", "title": "Subtotal field", "default": "subtotal", "required": true, "x-component": "Input" },
    "taxRateField": { "type": "string", "title": "Tax rate field", "default": "taxRate", "required": true, "x-component": "Input" },
    "precision": { "type": "integer", "title": "Precision", "default": 2, "minimum": 0, "maximum": 6, "x-component": "InputNumber" }
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
