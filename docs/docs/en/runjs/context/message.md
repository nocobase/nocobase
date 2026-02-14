# ctx.message

Ant Design global message API; shows short messages at the top center. Messages auto-close after a while or can be closed by the user.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock / JSField / JSItem / JSColumn** | Quick feedback: validation, copy success, etc. |
| **Form actions / event flow** | Submit success, save failed, validation failed |
| **JSAction** | Click or batch action feedback |

## Type

```ts
message: MessageInstance;
```

`MessageInstance` is the Ant Design message API.

## Common Methods

| Method | Description |
|--------|-------------|
| `success(content, duration?)` | Success message |
| `error(content, duration?)` | Error message |
| `warning(content, duration?)` | Warning message |
| `info(content, duration?)` | Info message |
| `loading(content, duration?)` | Loading (usually closed manually) |
| `open(config)` | Open with custom config |
| `destroy()` | Close all messages |

**Parameters:**

- `content`: `string` or `ConfigOptions`
- `duration`: optional seconds; default 3; 0 = no auto-close

**ConfigOptions** (when content is an object):

```ts
interface ConfigOptions {
  content: React.ReactNode;
  duration?: number;
  onClose?: () => void;
  icon?: React.ReactNode;
}
```

## Examples

### Basic

```ts
ctx.message.success('Done');
ctx.message.error('Failed');
ctx.message.warning('Please select data first');
ctx.message.info('Processing...');
```

### With ctx.t (i18n)

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Loading and manual close

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
await saveData();
hide();
ctx.message.success(ctx.t('Saved'));
```

### open with config

```ts
ctx.message.open({
  type: 'success',
  content: 'Custom success',
  duration: 5,
  onClose: () => console.log('closed'),
});
```

### Close all

```ts
ctx.message.destroy();
```

## ctx.message vs ctx.notification

| | ctx.message | ctx.notification |
|---|-------------|-------------------|
| **Position** | Top center | Top right |
| **Use** | Short, auto-dismiss | Panel with title/description; can stay longer |
| **Typical** | Action feedback, validation, copy | Task done, system notice, longer content |

## Related

- [ctx.notification](./notification.md): top-right notifications
- [ctx.modal](./modal.md): modal confirm
- [ctx.t()](./t.md): i18n; often used with message
