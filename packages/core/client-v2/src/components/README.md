# client-v2 components

This folder collects the React components that `@nocobase/client-v2` exposes to downstream plugins. Components are organized by directory — at the moment the main one is `form/`, which targets settings pages and form-shaped UIs.

Skim this before writing a new plugin so you don't reinvent the wheel. Components are mostly orthogonal — import only what you need.

## form/

Components under `form/` cover the "settings page + form" shape. The typical recipe: open a form container with `ctx.viewer.drawer` / `ctx.viewer.dialog`, host an antd `Form` + `Form.Item` tree inside, and pick standard field controls from this folder.

Grouped by purpose: form containers, form fields, data table, utilities.

### Form containers

#### DrawerFormLayout

Drawer-style form layout. Pair with `ctx.viewer.drawer({ closable: true, content })`.

- Top: title only; the native close X is rendered by antd Drawer — you must pass `closable: true` on the `viewer.drawer` call for it to appear
- Bottom: default Cancel / Submit buttons; override the whole footer with `footer`
- Middle: caller-supplied `<Form>` instance + fields

```tsx
import { DrawerFormLayout } from '@nocobase/client-v2';

ctx.viewer.drawer({
  width: '50%',
  closable: true,  // restore antd Drawer's native close X
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

- `title`: title node
- `onSubmit`: callback; the drawer closes automatically once it resolves. Throw to keep the drawer open (e.g. on a validation error)
- `submitting`: drives the Submit button's loading state
- `submitText` / `cancelText`: button labels
- `footer`: full override of the footer content (replaces the default Cancel + Submit pair)

To intercept close (e.g. dirty-form confirmation), use the lower-level `viewer.drawer({ preventClose, beforeClose })` hooks — this layout no longer wraps a custom cancel handler.

#### DialogFormLayout

Dialog-style form layout, the centered counterpart of `DrawerFormLayout`. Pair with `ctx.viewer.dialog({ closable: true, content })`.

The only visual difference from the drawer version is where the native close X sits — antd Drawer renders it at the top-left of the title bar, antd Modal at the top-right. Both layouts rely on the caller passing `closable: true` at the viewer call site; neither renders a close icon itself.

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

Props are nearly identical to `DrawerFormLayout`, with one extra: `DialogFormLayout` accepts an `onCancel` callback (fired by both the Cancel button and the native X) for "discard changes" confirmations.

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
- `delimiters`: token pair wrapping the stored variable reference. Defaults to `['{{', '}}']` (Handlebars HTML-escaped). Pass `['{{{', '}}}']` for fields rendered as HTML where escaping would corrupt the variable value — e.g. the in-app message body
- `value` / `onChange` / `placeholder` / `disabled`: standard controlled-input props

Under the hood `VariableInput` wraps `VariableHybridInput` (inline pills), `VariableTextArea` wraps `TextAreaWithContextSelector` (textarea + variable button). Both share the same MetaTree.

#### TypedVariableInput

Typed-constant + variable hybrid input. Ported from v1 `Variable.Input`'s `useTypedConstant` pattern: an italic `x` button on the right triggers a Cascader switcher `[Null | Constant<types> | Variable<…namespaces>]`; the left side renders the matching editor (`Input` / `InputNumber` / `Select(True/False)` / `DatePicker`) or a pill carrying the variable path.

Reach for this when a field **accepts both** a typed literal **and** a variable reference. The canonical example is `plugin-notification-email`'s SMTP `port` and `secure` fields: users can type a numeric port / boolean flag, or pass `{{ $env.SMTP_PORT }}` to read from environment variables.

```tsx
import { TypedVariableInput } from '@nocobase/client-v2';

// Port — numeric constant + $env variable
<Form.Item name={['options', 'port']} label={t('Port')} initialValue={465}>
  <TypedVariableInput
    types={[['number', { min: 1, max: 65535, step: 1 }]]}
    namespaces={['$env']}
  />
</Form.Item>

// Secure mode — boolean constant + $env variable
<Form.Item name={['options', 'secure']} label={t('Secure')} initialValue={true}>
  <TypedVariableInput types={['boolean']} namespaces={['$env']} />
</Form.Item>

// Inject a custom variable tree (e.g. a workflow node's upstream outputs,
// which are not in the global registry)
<TypedVariableInput types={['string', 'number']} metaTree={workflowMetaTree} />
```

Key props:

- `types`: allowed constant types. Shape mirrors v1 `useTypedConstant` — pass bare type names (`['number', 'boolean']`) or `[type, editorProps]` tuples (`[['number', { min, max, step }]]`) to forward props to the underlying antd editor. Defaults to `['string', 'number', 'boolean', 'date']`. **Even when only one type is allowed, the `Constant` entry still expands into a typed submenu** (Number / Boolean / Date / String) — matches v1 so users can see what type the constant is
- `namespaces`: restrict the variable picker to specific top-level namespaces (e.g. `['$env']`). Omit to expose every namespace registered on `flowEngine.context`
- `extraNodes`: static leaves appended after the namespace-filtered nodes
- `metaTree`: **inject the variable tree directly** instead of reading the global `flowEngine.context` meta tree. When set, `namespaces`/`extraNodes` are ignored and this tree is used verbatim — for context-scoped variable sources that are not in the global registry (typically a workflow node's upstream outputs, `$jobsMapByNodeKey`). Nodes whose `children` is a thunk (`() => Promise<MetaTreeNode[]>`) are **lazy-loaded on expand** (via flow-engine's `loadMetaTreeChildren`)
- `nullable`: whether to expose the `Null` switcher entry. Default `true`. Combined with `Form.Item.rules={[{ required: true }]}`, the user can explicitly clear the field but submission is still blocked by validation — mirrors v1's "Null + required" pairing
- `delimiters`: variable-token delimiters, default `['{{', '}}']` — same as `VariableInput`
- `value` / `onChange` / `placeholder` / `disabled` / `style` / `className`: standard controlled-input props

Value shape:

- Constant: stored as the native type (`number` / `boolean` / `Date` / `string`)
- Variable: a string like `'{{ $env.SMTP_PORT }}'`
- Null: `null`

When **not** to use it:

- **Pure literal fields** (users will never pass a variable) → use the antd primitive directly (`InputNumber` / `Select` / `DatePicker` / `Input`) and skip the Cascader column overhead
- **Pure variable fields** (users will never pass a literal) → use `EnvVariableInput` (`$env`-only, with optional password masking) or `VariableInput` (general-purpose)

Supported constant types: `string` / `number` / `boolean` / `date` / `object`. The `object` (JSON) type renders an inline monospace textarea (2 rows by default, drag-resizable) — it keeps the raw text as a draft while editing and `JSON.parse`s it back into an object on blur. On a parse failure it shows the raw `JSON.parse` message (e.g. `Expected property name or '}' in JSON at position …`, matching v1) on its own row below the input, and does not emit. Mirrors v1 `useTypedConstant`'s object form (default value `{}`).

Capabilities skipped (present in v1, not yet ported to v2):

- Async `loadChildren` cascading — most MetaTree namespaces are already eagerly resolved by `useFilteredMetaTree`, so this hasn't been needed

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

#### PasswordInput

`antd Input.Password` plus an optional strength meter, ported from v1's
`Password` component. Use for any "set / change password" form when you want
to give the user the same visual signal they had in v1.

```tsx
import { PasswordInput } from '@nocobase/client-v2';

<Form.Item name="newPassword" label={t('New password')} rules={[{ required: true }]}>
  <PasswordInput autoComplete="new-password" checkStrength />
</Form.Item>
```

Key props:

- `checkStrength`: render a strength bar beneath the input. Defaults to `false`. The score is bucketed `[20, 40, 60, 80, 100]` and shown via a clipped gradient (orange) inside a grey track, matching v1
- All other antd `Input.Password` props are passed through unchanged: `value` / `onChange` / `disabled` / `placeholder` / `autoComplete` / etc.

The strength meter is purely a UX hint, NOT validation. Submitting a weak password is still allowed unless the server (or a separately installed password-policy plugin) rejects it. Wire up real password rules through `Form.Item.rules` or — when the open-source ↔ commercial extension point lands — the project's shared password-validator hook.

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

### Filter

#### CollectionFilter

Filter button bound to a Collection. Clicking opens a Popover hosting a multi-condition filter form (field picker + operator + value control). Submit dismisses the Popover and emits the compiled NocoBase filter via `onChange`; Reset keeps the Popover open and emits `undefined`.

```tsx
import { CollectionFilter, ExtendCollectionsProvider } from '@nocobase/client-v2';
import lockedUsersCollection from '../../collections/locked-users';

function Page() {
  const main = engine.context.dataSourceManager?.getDataSource?.('main');
  const collection = main?.getCollection?.(lockedUsersCollection.name);

  const listRequest = useRequest(
    async (filter) => api.resource('lockedUsers').list({ ...(filter ? { filter } : {}) }),
    { defaultParams: [undefined] },
  );

  return (
    <ExtendCollectionsProvider collections={[lockedUsersCollection]}>
      <CollectionFilter collection={collection} onChange={listRequest.run} t={t} />
      {/* table … */}
    </ExtendCollectionsProvider>
  );
}
```

Key props:

- `collection`: the Collection that drives the field picker. The button is disabled while it's `undefined`
- `onChange: (filter) => void`: fired on Submit and Reset with the compiled NocoBase filter (`undefined` on Reset). Most pages forward straight to `listRequest.run`
- `t`: translator. Pass `useT()` from a plugin's `locale.ts` so server-side `{{t("…")}}` macros in field / operator labels get expanded — plain react-i18next's `t` leaves them as literal template strings
- `filterableFieldNames`: whitelist of root-level field names to expose
- `noIgnore`: bypass the whitelist
- `buttonText`: override the trigger label; defaults to `t('Filter')`
- `showCount`: show the `(N)` condition-count badge on the trigger; defaults to `true`
- `popoverProps` / `buttonProps`: pass-through to the antd `Popover` / `Button`
- `popoverMinWidth`: min-width of the popover body; defaults to `520`

If the target Collection is `schema-only` (not auto-published from the server to the v2 data source), wrap the page in `<ExtendCollectionsProvider>` so `CollectionFilter` can resolve it by name.

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

## data-source/

Components that wire collections / data sources into the React tree. Exported from the top level of `@nocobase/client-v2`.

### ExtendCollectionsProvider

Mount-scoped collection injector. On mount it registers the given collections into the target data source; on unmount it removes them. A `dataSource:loaded` listener re-applies the registration so mid-session reloads don't wipe injected collections.

```tsx
import { ExtendCollectionsProvider } from '@nocobase/client-v2';
import lockedUsersCollection from '../../collections/locked-users';

// Module-level constant — keeps the reference stable so the provider's
// effect doesn't re-run on every parent re-render.
const collections = [lockedUsersCollection];

export function LockedUsersPage() {
  return (
    <ExtendCollectionsProvider collections={collections}>
      <LockedUsersPageInner />
    </ExtendCollectionsProvider>
  );
}
```

Key props:

- `collections: CollectionOptions[]`: collections to inject. The provider only adds names that aren't already present, and on unmount removes only the ones it added
- `dataSource`: target data source key; defaults to `'main'`
- `children`: subtree covered by the injection

When to use:

- The server-side collection is `schema-only` and doesn't get auto-published to the client data source (e.g. `lockedUsers`)
- You need a client-side mirror that should be visible only inside the current page, not registered globally

Typical pairing: use together with `<CollectionFilter>` — the provider makes the collection resolvable; the filter button consumes it.

## When to add a new component here

- Two or more plugins need the same field or container shape — promote it to this folder
- Cross-plugin reusable, but the abstraction couples to a specific business domain (e.g. "pick a verifier", "pick a data source") — keep it inside the producing plugin and export from that plugin's `client-v2/`
- Before reaching for abstraction, check whether an existing component can be improved instead. `RemoteSelect.selectItems` is an example — it landed so envelope responses don't need their own component

Two follow-ups after adding a new component:

1. Add `export * from './XxxComponent'` to `form/index.tsx`
2. Document it here so the next plugin migration finds it
