# ctx.message

Ant Design global message API for displaying temporary toast messages.

## Type Definition

```typescript
message: MessageInstance
```

`MessageInstance` is the Ant Design message interface and provides the following methods:

- `success(content: string | ConfigOptions, duration?: number): MessageType`
- `error(content: string | ConfigOptions, duration?: number): MessageType`
- `warning(content: string | ConfigOptions, duration?: number): MessageType`
- `info(content: string | ConfigOptions, duration?: number): MessageType`
- `loading(content: string | ConfigOptions, duration?: number): MessageType`

## Notes

`ctx.message` is the Ant Design global message API, used to show temporary toast messages at the top of the page. Messages auto-dismiss after a duration or can be closed by the user.

**Difference from `ctx.notification`:**
- `ctx.message`: temporary toast at the top center, auto-dismisses
- `ctx.notification`: notification panel at the top-right, can be closed manually or auto-dismissed

## Method Notes

### success(content, duration?)

Show a success message.

**Parameters:**
- `content` (string | ConfigOptions): message content or config object
- `duration` (number, optional): auto-close delay (seconds), default is 3 seconds

**Returns**: `MessageType` - can be used to close the message manually

### error(content, duration?)

Show an error message.

**Parameters:**
- `content` (string | ConfigOptions): message content or config object
- `duration` (number, optional): auto-close delay (seconds), default is 3 seconds

**Returns**: `MessageType` - can be used to close the message manually

### warning(content, duration?)

Show a warning message.

**Parameters:**
- `content` (string | ConfigOptions): message content or config object
- `duration` (number, optional): auto-close delay (seconds), default is 3 seconds

**Returns**: `MessageType` - can be used to close the message manually

### info(content, duration?)

Show an informational message.

**Parameters:**
- `content` (string | ConfigOptions): message content or config object
- `duration` (number, optional): auto-close delay (seconds), default is 3 seconds

**Returns**: `MessageType` - can be used to close the message manually

### loading(content, duration?)

Show a loading message.

**Parameters:**
- `content` (string | ConfigOptions): message content or config object
- `duration` (number, optional): auto-close delay (seconds), default is 3 seconds

**Returns**: `MessageType` - can be used to close the message manually

## ConfigOptions

When `content` is an object, the following options are supported:

```typescript
interface ConfigOptions {
  content: React.ReactNode;  // message content
  duration?: number;          // auto-close delay (seconds)
  onClose?: () => void;       // callback on close
  icon?: React.ReactNode;     // custom icon
}
```
