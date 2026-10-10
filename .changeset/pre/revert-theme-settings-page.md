---
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Revert the Settings theme page and the converted theme presets.

Theme selection returns to the header's Appearance popover, which again offers both the color mode and the theme list, and Settings → Theme is removed. The 30 presets converted from tweakcn are removed, the Compact and Spacious presets return in place of the single `default` density, and the `appearance` locale block goes back to `title`, `mode`, `preset`, `light`, `dark` and `system`. The theme references in `@nocobase/app-skills` describe the popover again, while keeping the guidance that surface and outline tokens name a layer rather than a shade.
