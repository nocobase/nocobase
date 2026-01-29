# ctx.notification

Global notification API based on Ant Design Notification. Use it in JSBlock / Action to display top-right notifications.

## Common Usage

```ts
ctx.notification.open?.({
  message: 'Operation succeeded',
  description: 'The data has been saved to the server.',
});
```

> Tip:
> - The full parameters match the Ant Design `notification` API
> - Compared with `ctx.message`, this is better for messages that should stay visible longer
