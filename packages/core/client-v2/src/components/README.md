# client-v2 components

This folder collects the React components that `@nocobase/client-v2` exposes to downstream plugins. Components are organized by directory — at the moment the main one is `form/`, which targets settings pages and form-shaped UIs.

Skim this before writing a new plugin so you don't reinvent the wheel. Components are mostly orthogonal — import only what you need.

## form/

Components under `form/` cover the "settings page + form" shape. The typical recipe: open a form container with `ctx.viewer.drawer` / `ctx.viewer.dialog`, host an antd `Form` + `Form.Item` tree inside, and pick standard field controls from this folder.

Grouped by purpose: form containers, form fields, data table, utilities.

### Form containers

#### DrawerFormLayout

Drawer-style form layout. Pair with `ctx.viewer.drawer({ content })`.

- Top: a close icon next to the title. Clicking close fires `onCancel` and dismisses the drawer
- Bottom: default Cancel / Submit buttons; override the whole footer with `footer`
- Middle: caller-supplied `<Form>` instance + fields

```tsx
import { DrawerFormLayout } from '@nocobase/client-v2';

ctx.viewer.drawer({
  width: '50%',
  content: () => (
    <DrawerFormLayout
      title={t('Add authenticator')}
      onSubmit={handleSubmit}
      submitting={submitting}
    >
      <Form form={form} layout="vertical">
        {/* fields */}
      </Form>
    </DrawerFormLayout>
  ),
});
```

Key props:

- `title`: title node (rendered next to the close icon)
- `onCancel` / `onSubmit`: callbacks; the drawer closes automatically once they resolve. Throw from `onSubmit` to keep the drawer open (e.g. on a validation error)
- `submitting`: drives the Submit button's loading state
- `submitText` / `cancelText`: button labels
- `footer`: full override of the footer content (replaces the default Cancel + Submit pair)

#### DialogFormLayout

Dialog-style form layout, the centered counterpart of `DrawerFormLayout`. Pair with `ctx.viewer.dialog({ closable: true, content })`.

The only visual difference from the drawer version: the title is a bare string (no inline close icon), relying on antd Modal's native top-right X. Note that `viewer.dialog` disables antd's native X by default — you have to pass `closable: true` explicitly for it to appear.

```tsx
import { DialogFormLayout } from '@nocobase/client-v2';

ctx.viewer.dialog({
  closable: true,  // restore antd Modal's native top-right X
  content: () => (
    <DialogFormLayout title={t('Bind verifier')} onSubmit={handleSubmit}>
      <Form form={form} layout="vertical">
        {/* fields */}
      </Form>
    </DialogFormLayout>
  ),
});
```

When to pick which:

- **Drawer**: long forms with lots of fields that benefit from a full-height side panel (settings-page "Add / Edit")
- **Dialog**: short forms that ask for quick confirmation (bind, change password, two-factor verify)

Props are identical to `DrawerFormLayout` — they're drop-in replacements at the API level.

### Form fields

#### RemoteSelect

A Select bound to an async option source. Framework-level — it knows nothing about NocoBase business resources; the caller passes a `request` function that fetches whatever it needs.

```tsx
import { RemoteSelect } from '@nocobase/client-v2';

<Form.Item name="provider" label={t('Provider')}>
  <RemoteSelect<{ name: string; title: string }>
    request={async () => {
      const response = await ctx.api.resource('smsOTPProviders').list();
      return response?.data?.data || [];
    }}
    cacheKey="@nocobase/plugin-verification:smsOTPProviders:list"
    mapOptions={(item) => ({ label: compileT(item.title), value: item.name })}
  />
</Form.Item>
```

Key props:

- `request: () => Promise`: fetch function, required. Returns either an array of items or an envelope object (combine with `selectItems` to pluck the array out)
- `selectItems`: extractor that takes the `request` result and returns the option array. Use when the response is `{ items, meta }`-shaped
- `fieldNames`: defaults to `{ label, value }` mapping; override with `mapOptions` when the raw item doesn't match
- `mapOptions: (item, index) => ({ label, value })`: full override of option mapping
- `cacheKey` / `refreshDeps` / `ready`: forwarded to ahooks `useRequest`; control caching and refresh timing
- `onLoaded: (items, response) => void`: fires after data arrives; receives both the mapped item array and the raw response

All other antd `Select` props (`mode` / `placeholder` / `disabled` / `value` / `onChange` / etc.) are passed through.

`showSearch` + `allowClear` are on by default; search is local (filters by label). For server-side search, drive the search input through external state and pass it via `refreshDeps`, then read it inside `request`.

#### EnvVariableInput

A variable input restricted to the `$env` namespace. Designed for secret / credential fields — supports environment-variable references and adds password masking for plain literal values.

```tsx
import { EnvVariableInput } from '@nocobase/client-v2';

<Form.Item name={['options', 'accessKeySecret']} label={t('Access Key Secret')}>
  <EnvVariableInput password />
</Form.Item>
```

Key props:

- `password`: when enabled, non-variable literal values render through `Input.Password` so they're masked. Variable expressions like `{{ $env.X }}` stay visible and editable
- `placeholder` / `disabled` / `value` / `onChange`: standard controlled-input props

The persisted value is always a string: either a literal (`'literal'`) or a server-template reference (`'{{ $env.foo.bar }}'`). The server expands the reference at use time.

#### VariableInput / VariableTextArea

General-purpose variable inputs. Can reference any namespace registered on `flowEngine.context` — `$env`, `$user`, plus ad-hoc business namespaces like `$resetLink`.

The two differ in shape:

- `VariableInput`: single-line. Variables render as colored pills (compact "chips")
- `VariableTextArea`: multi-line. Variables stay as raw `{{ ... }}` text — better for email templates and other long-form content where the literal `{{ ... }}` is the intended display (the server expands them at render time)

```tsx
import { VariableInput, VariableTextArea } from '@nocobase/client-v2';

// Email subject — single line, pills
<Form.Item name={['options', 'emailSubject']} label={t('Subject')}>
  <VariableInput
    namespaces={['$env']}
    extraNodes={[
      { name: '$resetLink', title: t('Reset password link'), type: 'string', paths: ['$resetLink'] },
    ]}
  />
</Form.Item>

// Email body — multi-line, literal
<Form.Item name={['options', 'emailContentHTML']} label={t('Content')}>
  <VariableTextArea namespaces={['$env']} rows={10} />
</Form.Item>
```

Key props:

- `namespaces`: restrict the picker to specific top-level namespaces. Omit to expose every registered top-level property
- `extraNodes`: static leaves appended after the namespace-filtered nodes. Use for variables that only make sense in the current page (e.g. `$resetLink`)
- `converters`: override the default path ↔ string converters. `EnvVariableInput` uses this hook to lock its output to `$env`
- `value` / `onChange` / `placeholder` / `disabled`: standard controlled-input props

Under the hood `VariableInput` wraps `VariableHybridInput` (inline pills), `VariableTextArea` wraps `TextAreaWithContextSelector` (textarea + variable button). Both share the same MetaTree.

#### FileSizeInput

A byte-valued size input paired with a unit selector (Byte / KB / MB / GB). The persisted value is always in bytes; the displayed number is derived from the picked unit.

```tsx
import { FileSizeInput } from '@nocobase/client-v2';

<Form.Item name="maxFileSize" label={t('Max file size')}>
  <FileSizeInput min={1} max={1024 * 1024 * 1024} defaultValue={20 * 1024 * 1024} />
</Form.Item>
```

Key props:

- `min` / `max`: allowed byte range; values out of range snap back on blur. Defaults: `min=1`, `max=Infinity`
- `defaultValue`: drives the initial unit when the field is empty (e.g. 20 MB starts in the "MB" unit)
- `value` / `onChange`: controlled-input contract; the value type is `number` (bytes)

#### JsonTextArea

JSON input. The stored value is a JS object (not a string) — parsing happens live while typing and is finalized on blur.

```tsx
import { JsonTextArea } from '@nocobase/client-v2';

<Form.Item name="customConfig" label={t('Custom config')}>
  <JsonTextArea rows={6} json5 />
</Form.Item>
```

Key props:

- `space`: serialization indent. Defaults to `2`
- `json5`: parse with JSON5 (tolerates trailing commas, comments, single quotes, etc.). Defaults to `false`
- `showError`: render the parse error inline below the textarea. Defaults to `true`
- All other antd `Input.TextArea` props are passed through

`value` / `onChange` are typed as `unknown` because JSON values can be any shape. Tighten the contract with validators in `Form.Item.rules`.

### Data table

#### Table

The standard settings-page table, built on antd `Table` with two additions:

1. **Row index ↔ checkbox swap**: by default each row shows its ordinal ("1 / 2 / 3"); on hover or when selected the cell flips to a checkbox. The two elements are absolute-positioned in the same cell so neither steals layout space. Requires `rowSelection` to be present
2. **Drag-and-drop reorder**: pass `isDraggable` to enable. Each row gets a drag handle on the left; `onSortEnd` fires when a row is dropped. The component does NOT mutate `dataSource` — the caller persists the move (`resource.move(...)`) and `refresh()`s

```tsx
import { Table, DEFAULT_PAGE_SIZE } from '@nocobase/client-v2';

<Table<AuthenticatorRecord>
  rowKey="id"
  loading={loading}
  columns={columns}
  dataSource={data?.records || []}
  isDraggable
  onSortEnd={async (from, to) => {
    await resource.move({ sourceId: from.id, targetId: to.id });
    refresh();
  }}
  rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
  pagination={{
    current: page,
    pageSize,
    total: data?.total || 0,
    onChange: (next, nextSize) => { /* ... */ },
  }}
/>
```

Key props:

- `rowKey`: required. Drag-sort and row-identity both depend on it
- `showIndex`: defaults to `true`; disable to keep the cell at checkbox-only
- `isDraggable`: drag-and-drop toggle. Defaults to `false` — when off the component is a thin antd `Table` superset
- `onSortEnd: (from, to) => void | Promise`: fired when a row is dropped. Caller persists
- `showSortHandle`: defaults to `true`; set false when you want the handle off (or embedded into a custom column via `<SortHandle />`)
- All other antd `Table` props are passed through

Companion exports:

- `DEFAULT_PAGE_SIZE` (value `50`): suggested default page size
- `PAGE_SIZE_OPTIONS`: suggested page-size dropdown values `[5, 10, 20, 50, 100, 200]`
- `SortHandle`: standalone handle component, exported from `@nocobase/client-v2` for embedding into custom columns

### Utilities

#### createFormRegistry

Factory for a namespaced "entry registry". Each call returns an independent registry instance backed by its own closure `Map`.

```ts
import { createFormRegistry, type FormRegistryEntry } from '@nocobase/client-v2';

interface StorageType extends FormRegistryEntry {
  // FormRegistryEntry requires at least `name: string`
  title: string;
  Component: React.ComponentType;
}

const storageTypes = createFormRegistry<StorageType>('file-manager/storage-types');

storageTypes.register({ name: 'local', title: 'Local storage', Component: LocalStorageForm });
storageTypes.register({ name: 's3', title: 'Amazon S3', Component: S3StorageForm });

storageTypes.get('s3');
storageTypes.list();
storageTypes.has('local');
storageTypes.unregister('local');
```

Use this when a plugin needs an extension point for "same name + same shape + different implementation" things (the file-manager's storage types, the verification plugin's OTP providers, etc.). It's a thin wrapper around `Map` that adds a namespace label and an HMR-friendly overwrite warning.

Re-registering the same `name` overwrites the previous entry and emits a `console.warn` — HMR doesn't throw, and unintended duplicates surface in dev.

## When to add a new component here

- Two or more plugins need the same field or container shape — promote it to this folder
- Cross-plugin reusable, but the abstraction couples to a specific business domain (e.g. "pick a verifier", "pick a data source") — keep it inside the producing plugin and export from that plugin's `client-v2/`
- Before reaching for abstraction, check whether an existing component can be improved instead. `RemoteSelect.selectItems` is an example — it landed so envelope responses don't need their own component

Two follow-ups after adding a new component:

1. Add `export * from './XxxComponent'` to `form/index.tsx`
2. Document it here so the next plugin migration finds it
