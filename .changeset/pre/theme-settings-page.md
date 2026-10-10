---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Move theme selection out of the header popover and onto a Settings page.

The header entry is now a single button that switches between light and dark and says what it does through its tooltip and accessible label, instead of a popover offering both the color mode and the theme list. Choosing a theme is a longer-lived decision and gets a page of its own: Settings → Theme renders every registered preset as a preview card in an auto-filling grid with the selection marked, and filters the grid through a search field, so an application with dozens of themes stays workable. Selection still lives in the browser, under the same storage keys and `config.yml` defaults.

The page declares `authz` on its route, so it is visible to administrators by default and grantable to another role through the permissions interface like any other page. `system` stays a valid configured default: the header button moves to the opposite explicit mode on its first click.

The `appearance` locale block now carries `toggle` and `theme.{title,description,search,empty}` in place of `title`, `mode`, `preset`, `light`, `dark` and `system`; the theme labels under `appearance.themes` are unchanged. The themes and header-action references describe the new page and the in-place toggle.
