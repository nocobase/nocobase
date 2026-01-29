# window

A safe `window` proxy that provides limited access to global APIs.

## Notes

In the RunJS execution environment, `window` is a safe proxy object that only allows access to specific global APIs. `window.console` is proxied to `ctx.logger`.

## Available APIs

- **Timers**: `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`
- **console**: `window.console` (proxied to `ctx.logger`)
- **Math**: math functions
- **Date**: date constructor
- **FormData**: form data constructor
- **addEventListener**: event listener
- **open**: safe `window.open` proxy (only http/https/about:blank allowed)
- **location**: safe location proxy (read-only properties, safe navigation supported)

## Examples

```ts
// Use timers
const timer = window.setTimeout(() => {
  console.log('Timer fired');
}, 1000);

// Use console (proxied to ctx.logger)
window.console.log('Logged via window.console');
window.console.error('Error message');

// Use Math
const result = window.Math.max(1, 2, 3);

// Use Date
const now = new window.Date();

// Safe window.open
window.open('https://example.com', '_blank');

// Safe location access
const origin = window.location.origin;
window.location.href = '/new-page'; // safe navigation
```

## Notes

- `window.console` is proxied to `ctx.logger`, equivalent to using `console` or `ctx.logger`
- Accessing undeclared properties throws an error
- `window.open` only allows http/https/about:blank schemes
- `location` is a read-only proxy that exposes only safe properties and methods
