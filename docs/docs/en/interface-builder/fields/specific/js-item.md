# JS Item

## Introduction

JS Item is used for "custom items" (not bound to a field) in a form. You can use JavaScript/JSX to render any content (such as tips, statistics, previews, buttons, etc.) and interact with the form and record context. It is suitable for scenarios like real-time previews, instructional tips, and small interactive components.


![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)


## Runtime Context API (Commonly Used)

- `ctx.element`: The DOM container (ElementProxy) of the current item, supporting `innerHTML`, `querySelector`, `addEventListener`, etc.
- `ctx.form`: The AntD Form instance, allowing operations like `getFieldValue / getFieldsValue / setFieldsValue / validateFields`, etc.
- `ctx.blockModel`: The model of the form block it belongs to, which can listen to `formValuesChange` to implement linkage.
- `ctx.record` / `ctx.collection`: The current record and collection metadata (available in some scenarios).
- `ctx.requireAsync(url)`: Asynchronously load an AMD/UMD library by URL.
- `ctx.importAsync(url)`: Dynamically import an ESM module by URL.
- `ctx.openView(viewUid, options)`: Open a configured view (drawer/dialog/page).
- `ctx.message` / `ctx.notification`: Global message and notification.
- `ctx.t()` / `ctx.i18n.t()`: Internationalization.
- `ctx.onRefReady(ctx.ref, cb)`: Render after the container is ready.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: Built-in React, ReactDOM, Ant Design, Ant Design icons, dayjs, lodash, math.js, and formula.js libraries for JSX rendering, date-time utilities, data manipulation, and mathematical operations. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd` are kept for compatibility.)
- `ctx.render(vnode)`: Renders a React element/HTML/DOM to the default container `ctx.element`. Multiple renders will reuse the Root and overwrite the existing content of the container.

## Editor and Snippets

- `Snippets`: Opens a list of built-in code snippets, allowing you to search and insert them at the current cursor position with one click.
- `Run`: Executes the current code directly and outputs the execution logs to the `Logs` panel at the bottom. It supports `console.log/info/warn/error` and error highlighting.


![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)


- Can be used with AI Employee to generate/modify scripts: [AI Employee · Nathan: Frontend Engineer](/ai-employees/features/built-in-employee)

## Common Usage (Simplified Examples)

### 1) Real-time Preview (Reading Form Values)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) Open a View (Drawer)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) Load and Render External Libraries

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## Notes

- It is recommended to use a trusted CDN for loading external libraries, and to have a fallback for failure scenarios (e.g., `if (!lib) return;`).
- It is recommended to prioritize using `class` or `[name=...]` for selectors and avoid using fixed `id`s to prevent duplicate `id`s in multiple blocks/popups.
- Event cleanup: Frequent changes in form values will trigger multiple renders. Before binding an event, it should be cleaned up or deduplicated (e.g., `remove` before `add`, use `{ once: true }`, or use a `dataset` attribute to prevent duplicates).

## Related Documentation

- [Variables and Context](/interface-builder/variables)
- [Linkage Rules](/interface-builder/linkage-rule)
- [Views and Popups](/interface-builder/actions/types/view)
