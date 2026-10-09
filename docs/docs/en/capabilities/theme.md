---
title: 'Themes'
description: 'Use built-in themes and ask a Coding Agent to edit, add, or remove themes.'
keywords: 'NocoBase 3,themes,appearance,dark mode,Coding Agent'
---

# Themes

NocoBase 3 themes control colors, fonts, text sizes, spacing, corners, and shadows. **Theme code lives in your application project**, so you can customize it directly without installing a plugin.

Use a built-in theme, or describe the appearance you want to a Coding Agent. For example, match your organization's brand colors or make tables and forms more compact.

## Built-in themes

Two themes are included:

| Theme   | Appearance                                                                                                                 |
| ------- | -------------------------------------------------------------------------------------------------------------------------- |
| Default | Neutral colors with standard spacing and rounded corners                                                                   |
| Compact | The same colors as Default, with reduced spacing, some text line heights, and corner radii for greater information density |

In the **Appearance** panel, choose a theme and a color mode: **Light**, **Dark**, or **System**. Theme and color mode are independent choices. Both built-in themes support light and dark modes.

![Choose a theme and color mode in Appearance](https://static-docs.nocobase.com/20260910083736.png)

Your theme choice is saved in the current browser and restored after a refresh. It does not sync to other devices with your account. Choosing a theme changes the appearance in your browser; editing its code changes the appearance for everyone using that theme.

## Editing a theme

If a theme is close to what you need, ask a Coding Agent to adjust it. Specify which theme to change, the desired changes, and what to keep.

For example, keep the compact layout and change the primary color to blue:

```text
Update the Compact theme: use blue as the primary color and slightly increase the corner radius. Keep the current fonts, text sizes, and compact spacing.
```

You can include brand color values, font requirements, or reference screenshots. For example, specify `#2563EB` as the primary color or provide a screenshot showing the desired corners and shadows.

To change only the name, ask: “Rename Compact to High Density. Keep its appearance and update the name in all supported languages.”

## Adding a theme

To keep existing themes and add another appearance, ask a Coding Agent to create a theme. Describe its name, style, and purpose, and which existing theme to use as a starting point.

For example:

```text
Create a Forest theme with green as the primary color, soft backgrounds, moderately rounded corners, and subtle shadows.
```

The Coding Agent creates the theme, adds it to the available choices, and configures its name. Select it in **Appearance**.

![Forest theme in light mode](https://static-docs.nocobase.com/20260910110253.png)

![Forest theme in dark mode](https://static-docs.nocobase.com/20260910110728.png)

## Removing a theme

Tell the Coding Agent which theme to remove. Browsers that previously selected it will use the application's default theme.

```text
Remove the Forest theme.
```

When removing the application's current default theme, specify another theme as the default for first-time visits and when a previously selected theme is unavailable.

## Viewing the result

After the changes, select the theme in **Appearance** to view its colors, fonts, and layout. Switch between light and dark modes to see how the theme looks in each.

Images, embedded pages, and some third-party components need separate adjustments. Include them in your request if they should use the same colors or style.

## Developer reference

To edit theme code directly, refer to these files. Paths are relative to the application project root and use the default application template as an example.

| File                                 | Purpose                     | Used for                                   |
| ------------------------------------ | --------------------------- | ------------------------------------------ |
| `client/theme/themes/default.css`    | Default theme appearance    | Editing Default                            |
| `client/theme/themes/compact.css`    | Compact theme appearance    | Editing or removing Compact                |
| `client/theme/themes/<theme-id>.css` | Custom theme appearance     | Adding, editing, or removing custom themes |
| `client/theme/theme-presets.ts`      | Theme choices in Appearance | Adding or removing themes                  |
| `client/styles.css`                  | Loading theme styles        | Adding or removing themes                  |
| `client/locales/zh-CN.ts`            | Chinese theme names         | Adding, removing, or renaming themes       |
| `client/locales/en-US.ts`            | English theme names         | Adding, removing, or renaming themes       |

Editing a theme's appearance usually requires changes only to its theme file. Adding or removing a theme also involves the theme list, style imports, and locale files. Additional languages or new fonts may require corresponding translations or font assets.
