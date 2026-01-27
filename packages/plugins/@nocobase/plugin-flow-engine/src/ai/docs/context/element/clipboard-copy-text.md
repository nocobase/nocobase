---
title: "Copy text to clipboard (function)"
description: "A reusable function that copies a given string to the clipboard."
---

# Copy text to clipboard (function)

A reusable function that copies a given string to the clipboard.

```ts
// A general utility function that copies text to clipboard.
// Usage:
//   const ok = await copyTextToClipboard('Hello');
//   if (ok) { /* success */ } else { /* handle failure */ }
async function copyTextToClipboard(text) {
  const s = String(text ?? '');
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(s);
      return true;
    }
  } catch (_) {
    // Fallback below
  }
}
```
