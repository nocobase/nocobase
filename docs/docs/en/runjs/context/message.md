# ctx.message

Ant Design global message API, used to display temporary light prompts at the top center of the page. Messages close automatically after a certain period or can be closed manually by the user.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | Operation feedback, validation prompts, copy success, and other light prompts |
| **Form Operations / Workflow** | Feedback for submission success, save failure, validation failure, etc. |
| **Action Events (JSAction)** | Immediate feedback for clicks, batch operation completion, etc. |

## Type Definition

```ts
message: MessageInstance;
```

`MessageInstance` is the Ant Design message interface, providing the following methods.

## Common Methods

| Method | Description |
|------|------|
| `success(content, duration?)` | Display a success prompt |
| `error(content, duration?)` | Display an error prompt |
| `warning(content, duration?)` | Display a warning prompt |
| `info(content, duration?)` | Display an information prompt |
| `loading(content, duration?)` | Display a loading prompt (must be closed manually) |
| `open(config)` | Open a message using custom configuration |
| `destroy()` | Close all currently displayed messages |

**Parameters:**

- `content` (`string` | `ConfigOptions`): Message content or configuration object
- `duration` (`number`, optional): Auto-close delay (seconds), default is 3 seconds; set to 0 to disable auto-close

**ConfigOptions** (when `content` is an object):

```ts
interface ConfigOptions {
  content: React.ReactNode;  // Message content
  duration?: number;        // Auto-close delay (seconds)
  onClose?: () => void;    // Callback when closed
  icon?: React.ReactNode;  // Custom icon
}
```

## Examples

### Basic Usage

```ts
ctx.message.success('Operation successful');
ctx.message.error('Operation failed');
ctx.message.warning('Please select data first');
ctx.message.info('Processing...');
```

### Internationalization with ctx.t

```ts
ctx.message.success(ctx.t('Copied'));
ctx.message.warning(ctx.t('Please select at least one row'));
ctx.message.success(ctx.t('Exported {{count}} records', { count: rows.length }));
```

### Loading and Manual Close

```ts
const hide = ctx.message.loading(ctx.t('Saving...'));
// Execute asynchronous operation
await saveData();
hide();  // Manually close loading
ctx.message.success(ctx.t('Saved'));
```

### Custom Configuration with open

```ts
ctx.message.open({
  type: 'success',
  content: 'Custom success prompt',
  duration: 5,
  onClose: () => console.log('message closed'),
});
```

### Close All Messages

```ts
ctx.message.destroy();
```

## Difference Between ctx.message and ctx.notification

| Feature | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Position** | Top center of the page | Top right corner |
| **Purpose** | Temporary light prompt, disappears automatically | Notification panel, can include title and description, suitable for longer display |
| **Typical Scenarios** | Operation feedback, validation prompts, copy success | Task completion notifications, system messages, longer content requiring user attention |

## Related

- [ctx.notification](./notification.md) - Top-right notifications, suitable for longer display durations
- [ctx.modal](./modal.md) - Modal confirmation, blocking interaction
- [ctx.t()](./t.md) - Internationalization, commonly used with message