# ctx.loadCSS()

Load external CSS stylesheets asynchronously by URL. Suitable for dynamically loading third-party library styles in JSBlock / JSField / JSAction.

## Type Definition (Simplified)

```ts
loadCSS(url: string): Promise<void>;
```

- `url`: CDN URL of the CSS file
- Returns: Promise; resolves on success, rejects on failure

> Notes:
> - `ctx.loadCSS` automatically checks whether the CSS has already been loaded to avoid duplicates
> - CSS is appended to `document.head` and applied globally
> - Useful when loading third-party libraries (e.g., Tabulator, FullCalendar) and their styles

## Examples

```ts
// Load Tabulator styles
await ctx.loadCSS('https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// Load FullCalendar styles
await ctx.loadCSS('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.20/index.min.css');

// Load multiple stylesheets
await Promise.all([
  ctx.loadCSS('https://cdn.jsdelivr.net/npm/library@1.0.0/dist/css/main.css'),
  ctx.loadCSS('https://cdn.jsdelivr.net/npm/library@1.0.0/dist/css/theme.css'),
]);
```

> Tip:
> - When using `ctx.importAsync` or `ctx.requireAsync` to load third-party libraries, you usually need to load their CSS as well
> - Load the CSS immediately before or after loading the library to ensure styles are applied
