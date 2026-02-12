# ctx.message

Ant Design global message API for lightweight, temporary prompts.

## Type definition

```typescript
message: MessageInstance
```

`MessageInstance` provides the following methods:

- `success(content: string | ConfigOptions, duration?: number): MessageType`
- `error(content: string | ConfigOptions, duration?: number): MessageType`
- `warning(content: string | ConfigOptions, duration?: number): MessageType`
- `info(content: string | ConfigOptions, duration?: number): MessageType`
- `loading(content: string | ConfigOptions, duration?: number): MessageType`

## Notes

`ctx.message` shows lightweight messages at the top center of the page. Messages auto-close after a while, but can be closed manually.

**Difference from `ctx.notification`:**

- `ctx.message`: top-center transient message, auto closes
- `ctx.notification`: top-right notification panel, can be closed manually or auto

## Method details

### success(content, duration?)

Show a success message.

**Parameters:**

- `content` (string | ConfigOptions): message content or config object
- `duration` (number, optional): auto-close delay (seconds), default 3

**Return**: `MessageType`, which can be used to close the message manually

### error(content, duration?)

Show an error message.

**Parameters**: same as above.

### warning(content, duration?)

Show a warning message.

**Parameters**: same as above.

### info(content, duration?)

Show an info message.

**Parameters**: same as above.

### loading(content, duration?)

Show a loading message.

**Parameters**: same as above.

## ConfigOptions

When `content` is an object, the following options are supported:

```typescript
interface ConfigOptions {
  content: React.ReactNode;  // message content
  duration?: number;        // auto-close delay (seconds)
  onClose?: () => void;     // close callback
  icon?: React.ReactNode;   // custom icon
}
```
