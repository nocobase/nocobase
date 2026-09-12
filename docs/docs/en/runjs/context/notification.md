# ctx.notification

Based on Ant Design Notification, this global notification API is used to display notification panels in the **top-right corner** of the page. Compared to `ctx.message`, notifications can include a title and description, making them suitable for content that needs to be displayed for a longer period or requires user attention.

## Use Cases

| Scenario | Description |
|------|------|
| **JSBlock / Action Events** | Task completion notifications, batch operation results, export completion, etc. |
| **FlowEngine** | System-level alerts after asynchronous processes end. |
| **Content requiring longer display** | Full notifications with titles, descriptions, and action buttons. |

## Type Definition

```ts
notification: NotificationInstance;
```

`NotificationInstance` is the Ant Design notification interface, providing the following methods.

## Common Methods

| Method | Description |
|------|------|
| `open(config)` | Opens a notification with custom configuration |
| `success(config)` | Displays a success notification |
| `info(config)` | Displays an information notification |
| `warning(config)` | Displays a warning notification |
| `error(config)` | Displays an error notification |
| `destroy(key?)` | Closes the notification with the specified key; if no key is provided, closes all notifications |

**Configuration Parameters** (Consistent with [Ant Design notification](https://ant.design/components/notification)):

| Parameter | Type | Description |
|------|------|------|
| `message` | `ReactNode` | Notification title |
| `description` | `ReactNode` | Notification description |
| `duration` | `number` | Auto-close delay (seconds). Default is 4.5 seconds; set to 0 to disable auto-close |
| `key` | `string` | Unique identifier for the notification, used for `destroy(key)` to close a specific notification |
| `onClose` | `() => void` | Callback function triggered when the notification is closed |
| `placement` | `string` | Position: `topLeft` \| `topRight` \| `bottomLeft` \| `bottomRight` |

## Examples

### Basic Usage

```ts
ctx.notification.open({
  message: 'Operation successful',
  description: 'Data has been saved to the server.',
});
```

### Shortcut Calls by Type

```ts
ctx.notification.success({
  message: ctx.t('Export completed'),
  description: ctx.t('Exported {{count}} records', { count: 10 }),
});

ctx.notification.error({
  message: ctx.t('Export failed'),
  description: ctx.t('Please check the console for details'),
});

ctx.notification.warning({
  message: ctx.t('Warning'),
  description: ctx.t('Some data may be incomplete'),
});
```

### Custom Duration and Key

```ts
ctx.notification.open({
  key: 'task-123',
  message: ctx.t('Task in progress'),
  description: ctx.t('Please wait...'),
  duration: 0,  // Do not auto-close
});

// Manually close after task completion
ctx.notification.destroy('task-123');
```

### Close All Notifications

```ts
ctx.notification.destroy();
```

## Difference from ctx.message

| Feature | ctx.message | ctx.notification |
|------|--------------|------------------|
| **Position** | Top center of the page | Top right corner (configurable) |
| **Structure** | Single-line light hint | Includes title + description |
| **Purpose** | Temporary feedback, disappears automatically | Complete notification, can be displayed for a long time |
| **Typical Scenarios** | Operation success, validation failure, copy success | Task completion, system messages, longer content requiring user attention |

## Related

- [ctx.message](./message.md) - Top light hint, suitable for quick feedback
- [ctx.modal](./modal.md) - Modal confirmation, blocking interaction
- [ctx.t()](./t.md) - Internationalization, often used in conjunction with notifications