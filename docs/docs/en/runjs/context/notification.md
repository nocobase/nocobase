# ctx.notification

Global notification API based on Ant Design Notification; shows notifications in the **top-right**. Compared to `ctx.message`, notifications can have title and description and stay longer.

## Use Cases

| Scenario | Description |
|----------|-------------|
| **JSBlock / action events** | Task done, batch result, export done |
| **Event flow** | System notice after async flow ends |
| **Longer content** | Full notification with title, description, actions |

## Type

```ts
notification: NotificationInstance;
```

`NotificationInstance` is the Ant Design notification API.

## Common Methods

| Method | Description |
|--------|-------------|
| `open(config)` | Open with custom config |
| `success(config)` | Success notification |
| `info(config)` | Info notification |
| `warning(config)` | Warning notification |
| `error(config)` | Error notification |
| `destroy(key?)` | Close notification by key; no key = close all |

**Config** (same as [Ant Design notification](https://ant.design/components/notification)):

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `ReactNode` | Title |
| `description` | `ReactNode` | Description |
| `duration` | `number` | Auto-close seconds; default 4.5; 0 = no auto-close |
| `key` | `string` | Unique id for `destroy(key)` |
| `onClose` | `() => void` | On close |
| `placement` | `string` | `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Examples

### Basic

```ts
ctx.notification.open({
  message: 'Success',
  description: 'Data saved.',
});
```

### By type

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Check console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Custom duration and key

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,
});

ctx.notification.destroy('task-123');
```

### Close all

```ts
ctx.notification.destroy();
```

## ctx.message vs ctx.notification

| | ctx.message | ctx.notification |
|---|-------------|-------------------|
| **Position** | Top center | Top right (configurable) |
| **Structure** | Single line | Title + description |
| **Use** | Short, auto-dismiss | Longer, can stay |
| **Typical** | Success, validation, copy | Task done, system notice |

## Related

- [ctx.message](./message.md): top-center short messages
- [ctx.modal](./modal.md): modal confirm
- [ctx.t()](./t.md): i18n; often used with notification
