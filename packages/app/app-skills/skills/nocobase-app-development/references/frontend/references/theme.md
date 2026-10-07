# Theme

Theme presets belong to the application, not to a plugin. This document is the complete reference for the theme tokens, the steps for adding, changing and removing presets, and how the color mode and preset a user picks are saved and defaulted. For how to use the tokens while writing components, see [`styling.md`](styling.md); the rules they serve (F1–F7, A5) are in [`../ui-guidelines.md`](../ui-guidelines.md).

The theming in the shadcn skill does not apply here: no `shadcn apply`, `shadcn init` or `--preset`, no variables added to `:root` and `.dark` in `client/styles.css`, and no `next-themes` setup of your own ([section 3 of `shadcn.md`](shadcn.md#3-where-this-application-departs-from-the-skill)). This application's presets, below, replace all of it.

## 1. Files and mechanism

| Location                                                                                            | Role                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/theme/themes/<id>.css`                                                                      | One file per preset: a light rule and a dark rule                                                                                                                                                                                                                                         |
| `client/theme/themes/compact.css`                                                                   | Compact: the default preset and the fallback                                                                                                                                                                                                                                              |
| `client/theme/themes/default.css`                                                                   | Spacious (id `default`). Its rules also match bare `:root` and `:root.dark`, so every token has a value before a preset is applied to `<html>`                                                                                                                                            |
| `client/styles.css`                                                                                 | Imported by `client/index.tsx`. Imports every preset (`default.css` first) and connects the variables to Tailwind: colors become `bg-*`, `text-*` and similar classes, `--radius` derives the `rounded-*` scale, and `@utility` adapters keep the shadow classes on the runtime variables |
| `client/theme/theme-presets.ts`                                                                     | The preset registry: `id` and `labelKey` per preset. The first entry is the fallback                                                                                                                                                                                                      |
| `appearance.themes.<id>` in `client/locales/*.ts`                                                   | Preset labels                                                                                                                                                                                                                                                                             |
| `client/theme/theme-settings.tsx`                                                                   | The Appearance popover: color mode and theme                                                                                                                                                                                                                                              |
| `client/theme/theme-provider.tsx`, `client/theme/theme-context.ts`                                  | `AppThemeProvider`, which `client/react-providers.ts` mounts in the `root` layer, and `useThemePreset()`                                                                                                                                                                                  |
| `client/theme/theme-preferences.ts`                                                                 | Storage keys, configured defaults, and `initializeTheme()`, which `client/index.tsx` calls at startup                                                                                                                                                                                     |
| `client.app.defaultColorScheme` and `client.app.defaultTheme` in `config.yml`                       | Application defaults, see [section 6](#6-application-defaults)                                                                                                                                                                                                                            |
| `tests/logic/theme-*.test.ts`, `tests/logic/client-theme.test.tsx`, `tests/fixtures/theme-tokens.*` | Contract tests and a browser fixture, see [section 7](#7-verify)                                                                                                                                                                                                                          |

How a preset takes effect:

- A preset file sets CSS variables on `:root[data-theme='<id>']` for light and on `:root.dark[data-theme='<id>']` for dark, and the same values on `.theme-preview[data-theme='<id>']` for the thumbnails in the Appearance popover.
- The provider writes the chosen preset to the `data-theme` attribute of `<html>`, and `next-themes` sets the `light` or `dark` class and `color-scheme`. The `dark:` variant in `client/styles.css` is `&:is(.dark *)`, so it follows the same class.
- Utilities read the variables at runtime: `bg-card` is `var(--card)` and `p-4` is `calc(var(--spacing) * 4)`. Switching the preset or the mode restyles every page without a rebuild.

The template ships two presets. They share every color, font and shadow and differ only in density:

| id        | Label (en-US / zh-CN) | Role                                                | `--spacing` | `--radius` | Line heights            |
| --------- | --------------------- | --------------------------------------------------- | ----------- | ---------- | ----------------------- |
| `compact` | Compact / 紧凑        | First in the registry: the default and the fallback | `0.2rem`    | `0.375rem` | Tighter than Tailwind's |
| `default` | Spacious / 宽松       | The roomier alternative                             | `0.25rem`   | `0.5rem`   | Tailwind's defaults     |

The id `default` dates from when that preset was the default. It keeps the id because ids are saved in browsers and named in `config.yml`, and it is labeled Spacious so that the label does not claim it is the default selection. Do not relabel it "Default".

## 2. Token reference

### Colors

- Values are complete CSS colors, normally OKLCH, not HSL channels. Do not wrap them in `hsl()`.
- Define all 31 color tokens in both the light and the dark rule.
- Surfaces and foregrounds come in pairs: a background and the text or icons on it. A pair does not guarantee enough contrast; measure it (guideline A5 in [`../ui-guidelines.md`](../ui-guidelines.md)).

| Tokens                                              | Meaning and consumers                                            |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `--background`, `--foreground`                      | Page surface and default text                                    |
| `--card`, `--card-foreground`                       | Cards and panels                                                 |
| `--popover`, `--popover-foreground`                 | Floating surfaces: menus, popovers, dialogs                      |
| `--primary`, `--primary-foreground`                 | Primary actions                                                  |
| `--secondary`, `--secondary-foreground`             | Secondary actions                                                |
| `--muted`, `--muted-foreground`                     | Subtle surfaces and supporting text                              |
| `--accent`, `--accent-foreground`                   | Interactive highlighted surfaces (hovered or focused menu items) |
| `--destructive`                                     | Destructive actions and errors                                   |
| `--border`, `--input`, `--ring`                     | General borders; input borders and surfaces; focus indicators    |
| `--chart-1` through `--chart-5`                     | Five chart series colors                                         |
| `--sidebar`, `--sidebar-foreground`                 | Navigation surface and text                                      |
| `--sidebar-primary`, `--sidebar-primary-foreground` | Selected navigation item surface and text                        |
| `--sidebar-accent`, `--sidebar-accent-foreground`   | Hovered navigation item surface and text                         |
| `--sidebar-border`, `--sidebar-ring`                | Navigation dividers and focus indicators                         |

The matching classes are `bg-card text-card-foreground`, `border-input`, `ring-ring`, `bg-sidebar text-sidebar-foreground` and so on. Charts must reference the series explicitly with `fill-chart-1`, `stroke-chart-2` or `var(--chart-1)`; a chart library does not pick these variables up on its own.

There is no `--destructive-foreground`. The primitives draw destructive buttons and badges as `text-destructive` on a `bg-destructive/10` tint (`/20` in dark), so `--destructive` must read as text on the page, card and popover surfaces and on its own tint.

The template palette is neutral: every color has zero chroma except `--destructive` and the five chart series.

**Surface and outline tokens carry structure, not decoration.** A preset that forgets this reads as a color clash rather than as a style:

- Keep `--card` and `--popover` in the hue family of `--background`, so a panel lifts off the page instead of changing color.
- Keep `--muted` a tint close to the background.
- Keep `--border` and `--input` low-chroma hairlines, not a second statement of `--primary`.
- Put the preset's actual color in `--primary`, `--secondary`, `--accent` and the chart series, which appear on small, deliberate areas.
- Check a preset on a page that stacks several panels and dozens of dividers, not on one that shows a single card.

Sidebar tokens may reference the preset's general colors, as both template presets do:

```css
/* client/theme/themes/compact.css; default.css and both dark rules use the same lines */
:root[data-theme='compact'],
.theme-preview[data-theme='compact'] {
  /* … */
  --sidebar: var(--card);
  --sidebar-foreground: var(--card-foreground);
  --sidebar-primary: color-mix(in oklch, var(--primary) 10%, var(--sidebar));
  --sidebar-primary-foreground: var(--primary);
  --sidebar-accent: var(--muted);
  --sidebar-accent-foreground: var(--foreground);
  --sidebar-border: var(--border);
  --sidebar-ring: var(--ring);
}
```

They remain independently configurable: to change the sidebar, change these tokens. Do not redefine general colors such as `--card` on the sidebar to change its appearance.

### Fonts

| Token            | Value                                                         | Consumers                                                                                                                    |
| ---------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--font-sans`    | System sans-serif stack with Chinese fallbacks; the body font | `font-sans`, `body`                                                                                                          |
| `--font-serif`   | System serif stack with Chinese fallbacks                     | `font-serif`                                                                                                                 |
| `--font-mono`    | System monospace stack                                        | `font-mono`, `code`, `pre`, `kbd`, `samp`                                                                                    |
| `--font-heading` | `var(--font-sans)`; may be a separate stack                   | `font-heading`: `h1`–`h6`, the title parts of `PageHeader` and of primitives such as `Card`, `Dialog`, `Sheet` and `Popover` |

Both presets define the same stacks:

```css
/* client/theme/themes/compact.css */
:root[data-theme='compact'],
.theme-preview[data-theme='compact'] {
  --font-sans:
    ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Microsoft YaHei', sans-serif;
  --font-serif:
    ui-serif, Georgia, Cambria, 'Times New Roman', 'Songti SC', SimSun, serif;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  --font-heading: var(--font-sans);
  /* … */
}
```

- Values are valid CSS `font-family` lists, not font sizes or font file URLs.
- Define `--font-heading` in every preset rule, preview selectors included, so that it resolves against that preset's `--font-sans` (see "Scope of the rules").
- A font needs a resource as well as a variable. For an external typeface, add a client font dependency or import, or a local `@font-face`, then reference its real family name. Check the license, the weights you use, Chinese coverage, loading cost and fallback rendering; use `font-display: swap` for local faces where appropriate. Do not preload a whole font catalog, and do not install dependencies when the theme switches.
- A new title component uses a semantic heading element or `font-heading`. Ordinary bold text and button labels stay in the body font, and code stays monospace. An explicit font class on an element deliberately overrides the element's base font.

### Text sizes and line heights

Each size has two variables, `--text-<size>` and `--text-<size>--line-height`. Sizes are in rem. Line heights are unitless ratios written as `calc(<line height in rem> / <size in rem>)`: Compact's `--text-sm--line-height: calc(1.2 / 0.875)` gives `text-sm` a line box of 1.2rem.

| Size | rem (both presets) | Compact line height | Spacious line height |
| ---- | ------------------ | ------------------- | -------------------- |
| xs   | 0.75               | 1 / 0.75            | 1 / 0.75             |
| sm   | 0.875              | 1.2 / 0.875         | 1.25 / 0.875         |
| base | 1                  | 1.4 / 1             | 1.5 / 1              |
| lg   | 1.125              | 1.6 / 1.125         | 1.75 / 1.125         |
| xl   | 1.25               | 1.6 / 1.25          | 1.75 / 1.25          |
| 2xl  | 1.5                | 1.8 / 1.5           | 2 / 1.5              |
| 3xl  | 1.875              | 2.1 / 1.875         | 2.25 / 1.875         |
| 4xl  | 2.25               | 2.3 / 2.25          | 2.5 / 2.25           |
| 5xl  | 3                  | 1                   | 1                    |
| 6xl  | 3.75               | 1                   | 1                    |
| 7xl  | 4.5                | 1                   | 1                    |
| 8xl  | 6                  | 1                   | 1                    |
| 9xl  | 8                  | 1                   | 1                    |

The Spacious line heights are Tailwind's defaults.

- Use `text-xs` through `text-9xl`. `body` uses `text-base`; the primitives use `text-sm`.
- A separate `leading-*` class or the `text-sm/6` shorthand overrides the matching line height, and a fixed value such as `text-[14px]` does not follow the scale. Use a standard size unless the exception is deliberate.
- Keep the existing weight and tracking rules. Do not add shared typography tokens on your own.

### Spacing

- `--spacing` is a positive CSS length: `0.2rem` in Compact and `0.25rem`, Tailwind's default, in Spacious. Numeric classes such as `p-4`, `gap-2`, `h-8`, `size-4` and `w-64` multiply it by their suffix, so `h-8` is 1.6rem in Compact and 2rem in Spacious.
- Changing it moves padding, gaps, control and icon sizes and the navigation width together; the sidebar's widths are `--sidebar-width` and `--sidebar-width-icon`, set in spacing units (64 and 12) in `client/layouts/components/app-sidebar.tsx`. Check typography and spacing together: text must not be clipped, and targets must stay usable.
- Percentages, viewport units, container widths such as `max-w-2xl` or `w-xs`, and arbitrary values such as `mt-[7px]` do not use this scale. Breakpoints do not change.
- Use numeric classes for ordinary spacing and sizes. Keep deliberate constraints that should not scale, such as viewport limits, images and separators. Do not change the root font size to simulate density, and do not add ad hoc height tokens.

### Radius

`--radius` is a nonnegative CSS length: `0.375rem` in Compact and `0.5rem` in Spacious. The `@theme inline` block in `client/styles.css` derives the public corner classes from it:

| Class         | Multiplier |
| ------------- | ---------- |
| `rounded-sm`  | 0.6        |
| `rounded-md`  | 0.8        |
| `rounded-lg`  | 1          |
| `rounded-xl`  | 1.4        |
| `rounded-2xl` | 1.8        |
| `rounded-3xl` | 2.2        |
| `rounded-4xl` | 2.6        |

- Change the base `--radius`, not the derived `--radius-*` variables.
- `0` makes all seven sizes square. `rounded-none`, `rounded-xs`, `rounded-full` and explicit corners (`rounded-[…]`) are outside this scale. Small controls may cap a derived radius on purpose: the `xs` and `sm` sizes in `client/components/ui/button.tsx` use `rounded-[min(var(--radius-md),10px)]` and `rounded-[min(var(--radius-md),12px)]`.

### Shadows

- Define `--shadow-2xs`, `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` and `--shadow-2xl`. Values are CSS `box-shadow` lists, lengths and colors included. Both presets use Tailwind's default values, for example `--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`, and their dark rules inherit them. To switch a level off, use `0 0 #0000`; unlike `none`, it keeps composed shadows valid.
- Components use `shadow-2xs` through `shadow-2xl`. Tailwind would compile named shadows into fixed values, so `client/styles.css` resets them to `initial` in `@theme` and re-implements each one as an adapter that reads the runtime variable and keeps Tailwind's composition with rings (shown below). Keep these adapters; a theme changes the values only.
- A shadow's color is part of its value. `shadow-black/30` does not recolor a variable-based shadow.
- `shadow-none` opts out on purpose. Inset shadows, text shadows, drop shadows and focus rings are separate mechanisms, not these seven levels. Removing elevation must not remove keyboard focus indicators.

Each adapter has this form:

```css
/* client/styles.css */
@utility shadow-sm {
  @apply shadow-(--shadow-sm);
}
```

### Scope of the rules

- Each preset's light rule defines every color and every non-color token. Its dark rule defines every color and may override non-color values; anything it leaves out comes from the preset's light rule.
- The same declarations go on the preview selectors `.theme-preview[data-theme='<id>']` and `:root.dark .theme-preview[data-theme='<id>']`, aliases included. A custom property inherits its resolved value, so an alias such as `--font-heading: var(--font-sans)` or `--sidebar: var(--card)` declared only for the page would carry the page's preset into another preset's thumbnail. Listing the preview selector in the same rule, as the template files do, keeps the two identical.
- Do not reset whole Tailwind namespaces, and do not add per-page overrides to create a theme.
- Extend the shared token contract only after design approval. An approved token needs a Tailwind mapping in `client/styles.css`, a value in every preset rule, and an entry in the token lists of `tests/logic/theme-tokens.test.ts`. Do not change `components.json`, routes, component props or plugin APIs as a side effect of theme work.

### Fixed-size exceptions

Some values stay fixed on purpose. Know which ones, and keep your own explicit.

- Arbitrary values (`text-[14px]`, `mt-[7px]`, `rounded-[…]`), container widths (`max-w-2xl`, `w-xs`), percentages and viewport units do not follow the theme, and neither do `rounded-xs`, `rounded-full` or `shadow-none`. Explicit line heights (`leading-*`, `text-sm/6`) replace the preset's line heights.
- The template's own exceptions:
  - The Appearance popover panel is `w-xs max-w-[calc(100vw-2rem)]`, with a comment saying its width stays independent of density while its content uses tokens.
  - The small sizes of buttons, toggles and native selects cap their radius (see "Radius").
  - `index.html` sets `<meta name="theme-color" content="#171717">`, which colors the browser UI on some mobile browsers and does not follow the theme; change it by hand when a preset's page color changes noticeably.
  - `index.html` draws a loading indicator with literal colors that follow only `prefers-color-scheme`. It renders before the client restores the preferences, so it cannot use the tokens.
- When a size must stay fixed, make it visible: a comment next to the value saying why, as `client/theme/theme-settings.tsx` does, and an entry in the design file, as guideline F7 in [`../ui-guidelines.md`](../ui-guidelines.md) requires. Colors, font sizes and spacing do not qualify.

### Constraints from the token test

`tests/logic/theme-tokens.test.ts` requires `compact.css` and `default.css` to be identical, in both the light and the dark rule, except for `--spacing`, `--radius` and the `--text-*` variables, and it requires Compact's `--spacing` to be smaller than Spacious'. Today the two differ in spacing, radius and line heights; the text sizes are the same. So:

- A change to colors, fonts or shadows goes into both files, light and dark rules alike.
- Density (spacing, radius, text sizes and line heights) may differ between the two.
- A preset you add is compared with neither. The test only requires it to be complete ([section 7](#7-verify)).

## 3. Add a preset

The steps below add a preset with the id `forest`.

1. **Copy a file.** Copy the preset whose density the new one should share to `client/theme/themes/forest.css`: `compact.css` for the application's default density, `default.css` for the spacious one. Use a stable id of lowercase letters, digits and hyphens, and name the file after it: the token test loads `client/theme/themes/<id>.css` for every registered id.
2. **Set the selectors and tokens.** Light uses `:root[data-theme='forest'], .theme-preview[data-theme='forest']`; dark uses `:root.dark[data-theme='forest'], :root.dark .theme-preview[data-theme='forest']`. Keep the single quotes: the token test looks the selectors up by their exact text. If you copied `default.css`, delete its bare `:root` and `:root.dark` selectors. Only `default.css` may carry them; whichever file is imported last would otherwise take over the fallback. Set `--radius` and all 31 colors, keep the fonts, sizes, spacing and shadows unless the preset is meant to change them, and repeat every color in the dark rule.

   ```css
   /* client/theme/themes/forest.css */
   /*
    * forest: a green palette for this application.
    * Fonts, sizes, spacing and shadows are copied from compact.css unchanged.
    */
   :root[data-theme='forest'],
   .theme-preview[data-theme='forest'] {
     --font-sans:
       ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI',
       'PingFang SC', 'Microsoft YaHei', sans-serif;
     /* … --font-serif through --shadow-2xl: copied from compact.css unchanged */
     --radius: 0.375rem;
     --background: oklch(0.985 0.005 150);
     --foreground: oklch(0.2 0.02 150);
     --card: oklch(0.995 0.003 150);
     --card-foreground: oklch(0.2 0.02 150);
     --popover: oklch(0.995 0.003 150);
     --popover-foreground: oklch(0.2 0.02 150);
     --primary: oklch(0.45 0.12 150);
     --primary-foreground: oklch(0.985 0.005 150);
     --secondary: oklch(0.94 0.03 150);
     --secondary-foreground: oklch(0.25 0.04 150);
     --muted: oklch(0.96 0.008 150);
     --muted-foreground: oklch(0.5 0.02 150);
     --accent: oklch(0.93 0.04 130);
     --accent-foreground: oklch(0.25 0.04 150);
     --destructive: oklch(0.577 0.245 27.325);
     --border: oklch(0.9 0.01 150);
     --input: oklch(0.9 0.01 150);
     --ring: oklch(0.55 0.1 150);
     --chart-1: oklch(0.55 0.13 150);
     --chart-2: oklch(0.65 0.12 180);
     --chart-3: oklch(0.72 0.14 120);
     --chart-4: oklch(0.5 0.08 200);
     --chart-5: oklch(0.8 0.12 90);
     --sidebar: var(--card);
     --sidebar-foreground: var(--card-foreground);
     --sidebar-primary: color-mix(in oklch, var(--primary) 10%, var(--sidebar));
     --sidebar-primary-foreground: var(--primary);
     --sidebar-accent: var(--muted);
     --sidebar-accent-foreground: var(--foreground);
     --sidebar-border: var(--border);
     --sidebar-ring: var(--ring);
   }

   :root.dark[data-theme='forest'],
   :root.dark .theme-preview[data-theme='forest'] {
     --background: oklch(0.16 0.01 150);
     --foreground: oklch(0.95 0.01 150);
     --card: oklch(0.2 0.012 150);
     --card-foreground: oklch(0.97 0.005 150);
     --popover: oklch(0.2 0.012 150);
     --popover-foreground: oklch(0.97 0.005 150);
     --primary: oklch(0.72 0.13 150);
     --primary-foreground: oklch(0.18 0.02 150);
     --secondary: oklch(0.27 0.03 150);
     --secondary-foreground: oklch(0.97 0.005 150);
     --muted: oklch(0.25 0.012 150);
     --muted-foreground: oklch(0.7 0.02 150);
     --accent: oklch(0.3 0.04 140);
     --accent-foreground: oklch(0.97 0.005 150);
     --destructive: oklch(0.704 0.191 22.216);
     --border: oklch(1 0 0 / 10%);
     --input: oklch(1 0 0 / 15%);
     --ring: oklch(0.6 0.1 150);
     --chart-1: oklch(0.7 0.14 150);
     --chart-2: oklch(0.72 0.12 180);
     --chart-3: oklch(0.78 0.14 120);
     --chart-4: oklch(0.62 0.09 200);
     --chart-5: oklch(0.82 0.12 90);
     --sidebar: var(--card);
     --sidebar-foreground: var(--card-foreground);
     --sidebar-primary: color-mix(in oklch, var(--primary) 10%, var(--sidebar));
     --sidebar-primary-foreground: var(--primary);
     --sidebar-accent: var(--muted);
     --sidebar-accent-foreground: var(--foreground);
     --sidebar-border: var(--border);
     --sidebar-ring: var(--ring);
   }
   ```

3. **Import the CSS.** In `client/styles.css`, add the import after the existing preset imports, so that `default.css` stays first:

   ```css
   /* client/styles.css */
   @import 'tailwindcss';
   @config "../tailwind.config.mjs";
   @import 'tw-animate-css';
   @import 'shadcn/tailwind.css';
   @import './theme/themes/default.css';
   @import './theme/themes/compact.css';
   @import './theme/themes/forest.css';
   @source "./components/ui";
   /* … */
   ```

4. **Register the preset.** Append an entry to `themePresets` in `client/theme/theme-presets.ts`. Keep `compact` first: the first entry is the fallback, and `tests/logic/theme-preferences.test.ts` expects it there. The `labelKey` is `appearance.themes.<id>`.

   ```ts
   // client/theme/theme-presets.ts
   export const themePresets = [
     { id: 'compact', labelKey: 'appearance.themes.compact' },
     { id: 'default', labelKey: 'appearance.themes.default' },
     { id: 'forest', labelKey: 'appearance.themes.forest' },
   ] as const;

   export type ThemePresetId = (typeof themePresets)[number]['id'];
   export const defaultThemePreset: ThemePresetId = 'compact';
   ```

   `ThemePresetId` is derived from the array, so the new id is accepted wherever a preset id is typed. `defaultThemePreset` does not decide the fallback, and no template code reads it; keep it equal to the first entry.

5. **Add the label** to `appearance.themes` in every locale file. `zh-CN.ts` is typed from `en-US.ts`, so the two must have the same keys or the type check fails; a label missing from both fails `tests/logic/app-locale-coverage.test.ts`, which reads the registry's `labelKey` (without the label the popover would show the capitalized id). Give each preset a distinct label: it is the accessible name of the preset's radio option. Translation rules are in [`i18n.md`](i18n.md).

   ```ts
   // client/locales/en-US.ts
   const messages = {
     // …
     appearance: {
       // …
       themes: { default: 'Spacious', compact: 'Compact', forest: 'Forest' },
     },
     // …
   };
   ```

   ```ts
   // client/locales/zh-CN.ts
   const zhCN: AppResource = {
     // …
     appearance: {
       // …
       themes: { default: '宽松', compact: '紧凑', forest: '森林' },
     },
     // …
   };
   ```

6. **Leave the popover alone.** The Appearance popover lists every registered preset in registry order, takes each label from the locale, and draws each thumbnail from the same CSS variables through `.theme-preview` and `data-theme`. Do not write a second palette in JavaScript. The presets sit in a two-column grid without search, so the popover suits a handful of presets.
7. **Check it.** Add the resources and the Chinese and system fallbacks for any new font. In light and dark, check body text, headings, code, long text, controls, navigation, charts where present, spacing, corners and shadows: text meets WCAG AA contrast (guideline A5; 4.5:1 for normal text), nothing is clipped, and keyboard focus is visible. The thumbnail shows colors, not typography or layout. Then run the checks in [section 7](#7-verify).

## 4. Change or remove a preset

- Change a preset's look in its CSS file. Do not restyle components or edit `components.json` for it.
- Do not add shared tokens or change component APIs, routes or plugin interfaces without design approval.
- Keep the id when the look or the label changes. The id is what browsers save and what `client.app.defaultTheme` names; that is why `default` keeps its id under the label Spacious.
- **The primary color**, the most common change: set `--primary` and `--primary-foreground` (and `--ring`, when focus rings should match) in the light rule and in the dark rule of both `compact.css` and `default.css`. `--sidebar-primary` and `--sidebar-primary-foreground` derive from `--primary` and follow. Keep `--primary-foreground` readable on `--primary` in both modes and measure it ([section 7](#7-verify)).
- A change to the colors, fonts or shadows of Compact or Spacious goes into both files ([section 2](#2-token-reference), "Constraints from the token test"). To change the whole application's typography, spacing or shadows, change the value in every preset file.
- To remove a preset you added, remove its registry entry, its CSS import and file, and its label in every locale together. If `client.app.defaultTheme` names it, change that too; otherwise the configured default is ignored and the first registered preset applies. A browser that saved the removed id falls back to the configured default, or to the first registered preset (`compact`), and the stale value stays in storage, ignored, until the next choice replaces it. Do not write a development-data migration for it.
- Removing, renaming or reordering `compact` or `default` changes the template's theme, not just a preset: `theme-preferences.test.ts` expects `compact` first, `client-theme.test.tsx` expects the Compact and Spacious options and the fallback to `compact`, `theme-tokens.test.ts` compares the two files, and `config.example.yml` names `compact`. Update them deliberately and explain why. To change which preset new visitors get, set `client.app.defaultTheme` instead ([section 6](#6-application-defaults)).

## 5. Preferences at runtime

A user makes two independent choices, each saved in the browser: the color mode (Light, Dark or System) and the preset.

- `next-themes` owns the color mode: the `light` or `dark` class on `<html>` and its `color-scheme`. A preset only sets `data-theme`. Do not make a preset force a mode. Keep DOM changes in `client/theme/`.
- The Appearance popover (`client/theme/theme-settings.tsx`) sits in the header of the App and Settings layouts (`client/layouts/components/header-actions.tsx`) and in the top-right corner of guest and optional pages (`client/routing/standalone-page-layout.tsx`). It opens on hover, click or keyboard. A choice applies and is saved at once, the panel stays open for further changes, and Escape closes it and returns focus to the trigger. Its copy comes from `appearance.title`, `appearance.mode`, `appearance.preset`, `appearance.light`, `appearance.dark`, `appearance.system` and `appearance.themes.<id>`. The hover and dismissal rules for header entries are in [section 2 of `shell.md`](shell.md#2-header-icon-buttons).
- Code that needs a choice reads it from the provider. `useTheme()` from `next-themes`, also re-exported by `client/theme/index.ts`, gives `theme` (`light`, `dark` or `system`), `resolvedTheme` (the mode actually applied) and `setTheme`. `useThemePreset()` from `client/theme/theme-context.ts` gives `preset` and `setPreset`. Both need `AppThemeProvider`, and `useThemePreset()` throws outside it. Do not read or write the storage keys or the `<html>` attributes yourself, and do not keep a copy of a choice in component state.
- The storage keys come from `resolveAppBase()`, the deployment base path, not from the current route or the first path segment: `/crm/` becomes `crm`, `/team/crm/` becomes `team%2Fcrm`, and the root becomes `%2F`. The keys are `nocobase:<scope>:theme:color-scheme` and `nocobase:<scope>:theme:preset`. They are browser-local and per application, not synchronized with the account: two applications on the same origin keep separate choices, and tabs of the same application follow each other through `storage` events.
- `client/index.tsx` calls `initializeTheme()` before the application starts. It applies the saved or default choices to `<html>` (class, `data-theme` and `color-scheme`) and removes an invalid saved mode before `next-themes` can read it. No script runs before the first paint; the loading indicator in `index.html` follows only `prefers-color-scheme`.
- When storage is unavailable, the defaults apply and choices still work for the life of the page, but they are not saved.

## 6. Application defaults

Set the defaults under `client.app` in `config.yml`:

```yaml
client:
  app:
    # …
    defaultColorScheme: dark # light | dark | system
    defaultTheme: default # ID from client/theme/theme-presets.ts
```

Each choice resolves on its own, from the first valid source:

| Source, in order      | Color mode                      | Preset                                  |
| --------------------- | ------------------------------- | --------------------------------------- |
| Saved in this browser | `light`, `dark` or `system`     | A registered id                         |
| `config.yml`          | `client.app.defaultColorScheme` | `client.app.defaultTheme`               |
| Built-in fallback     | `system`                        | The first registered preset (`compact`) |

- A saved mode with no saved preset still gets the configured preset, and the other way round.
- Invalid saved values and invalid configuration are ignored, not reported: an unknown mode, a preset that is not registered, a value of the wrong type.
- Defaults are never written to storage; only an explicit choice is saved. A later change to the configured defaults therefore reaches every browser that has not made a choice.
- Clearing the site's storage, including from another tab, restores the configured defaults at once without saving them.
- `system` follows the operating system and updates while the page is open.
- `initializeTheme()` and `AppThemeProvider` read the same configuration, which the server embeds in the page; values under `client` are public. The server reads them when it starts: after editing `config.yml`, restart it (`pnpm dev` restarts the local server on a `config.yml` change by itself) and reload the page.
- Set the default in `config.yml`, not as a `defaultTheme` prop on `AppThemeProvider`. The prop wins inside React, but `initializeTheme()` does not see it, so the page would switch modes when React mounts.

## 7. Verify

Run the theme tests:

```bash
pnpm exec vitest run tests/logic/theme-tokens.test.ts tests/logic/theme-preferences.test.ts tests/logic/client-theme.test.tsx
```

- `theme-tokens.test.ts` checks that every registered preset defines all 31 colors and every non-color token in its light rule and every color in its dark rule, with the same declarations on the preview selectors; that Compact and Spacious differ only in dimensions, with Compact's spacing smaller; and, by compiling `client/styles.css` with Tailwind, that the color, font, size, line height, spacing, radius and shadow classes and the `body`, `h1` and `code` fonts still read the runtime variables.
- `theme-preferences.test.ts` checks that Compact is first, the storage keys for each base path, restoring both choices at startup without reading another application's keys, and the fallbacks for invalid values, removed presets and unavailable storage.
- `client-theme.test.tsx` checks the provider and the popover: labels in en-US and zh-CN, choosing and saving, configured defaults against saved choices, startup and provider agreeing, clearing and syncing across tabs, invalid values, and unavailable storage.

Format the changed CSS and TypeScript files with Prettier, and lint only the TypeScript ones (ESLint has no CSS configuration; see ["Self-check before finishing" in `../frontend-dev.md`](../frontend-dev.md#self-check-before-finishing)). After changing the popover or its header entry, also run `pnpm exec vitest run tests/components/header-hover.test.tsx` (hover, keyboard and Escape). After changing the registry or a locale file, type-check the client with `pnpm exec tsc -p tsconfig.json --noEmit` and run `pnpm exec vitest run tests/logic/app-locale-coverage.test.ts`.

A compiled CSS check cannot prove the layout. Check in a browser, scaled to the change:

- **Any token change** (a color, font, size, spacing, radius or shadow):
  - With `pnpm dev` running, append `tests/fixtures/theme-tokens.html` to the `Local:` URL it prints, which already ends with the base path and a slash (`http://127.0.0.1:13000/main/tests/fixtures/theme-tokens.html`). The page renders the real sidebar, primitives and Appearance popover with sample headings, serif and code text, buttons, an input, a popover rendered in a portal, a card, the chart palette, and all seven radii and shadows, in mixed English and Chinese text. It mounts no translations, so the popover shows each preset's capitalized id (Default rather than Spacious); check labels in the application itself. It runs under the application's base path, so it shares the application's saved choices.
  - Look at Light and Dark with each preset on a page that stacks panels and dividers, including at 375px wide (the screenshot tool's `colorScheme`, `theme` and `viewport` shots do this in one run; see [`../scripts/capture.md`](../scripts/capture.md)).
  - Measure contrast for every pair you changed, in both modes: body and muted text on `--background`, `--card` and `--popover`, `--primary-foreground` on `--primary`, and `--destructive` on the surfaces. In Chrome DevTools, inspect an element, click the color swatch of its `color` in the Styles pane: the picker shows the contrast ratio against the background and whether it passes AA (4.5:1 for normal text).
- **A font, size, spacing or shadow change** additionally: temporarily set clearly different values and confirm the pages follow, since a token name existing does not prove it is used; revert afterwards. Look for fixed sizes, explicit line heights, constrained controls and portal content such as menus, dialogs and popovers.
- **Adding, removing or renaming a preset, or changing the registry, the popover or the preference code** additionally:
  - Reload and confirm both choices are restored. Operate the popover with the keyboard: Tab into a group, arrow keys within it, Escape to close with focus back on the trigger.
  - Two tabs of the application stay in sync; an application under another base path on the same origin is unaffected.
  - Clearing site data restores the configured defaults; with storage blocked, switching still works; a saved id of a removed preset falls back.
- Images, iframes, style-isolated third-party content and plugin content with literal colors do not follow the theme. Check them separately.
