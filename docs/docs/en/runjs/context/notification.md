# ctx.notification

Global notification API based on Ant Design Notification. Use it in JSBlock / Action to show top-right notifications.

## Common usage

```ts
ctx.notification.open?.({
  message: 'Success',
  description: 'The data has been saved to the server.',
});
```

> Tips:
> - Full params are the same as Ant Design `notification`
> - Compared to `ctx.message`, this is better for messages that should stay longer
