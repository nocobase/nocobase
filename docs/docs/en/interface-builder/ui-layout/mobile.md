---
title: "Mobile Layout"
description: "Learn about NocoBase mobile navigation, page building, desktop preview, subpage interactions, routes, and permissions."
keywords: "mobile layout,mobile pages,bottom navigation,mobile preview,mobile routes,UI Editor,NocoBase"
---

# Mobile Layout

In NocoBase, the **mobile layout** is used to build separate mobile navigation and pages. It is available at `/mobile` by default and uses a bottom tab bar as its primary navigation, making it more suitable for data entry, lookup, approval, and task processing on a phone.

The mobile and desktop layouts use the same data sources and business data, but their menus, routes, and page content are configured separately. This lets you reorganize pages around mobile workflows without being constrained by the desktop page structure.

<!-- Add a full-page screenshot of the mobile layout on a physical device -->

## Open and preview the mobile layout

After enabling the UI Layout plugin, click 「Mobile」 in Settings to open the layout, or visit `/mobile` directly.

It is best to build pages in a desktop browser. The desktop view provides a mobile preview area and a toolbar at the top:

- 「UI Editor」 turns UI building mode on or off.
- 「Tablet preview」 checks the display on wider mobile devices.
- 「Mobile preview」 restores the phone-sized preview area.
- 「QR code」 opens the current mobile URL on a phone.

<!-- Add a screenshot of the mobile preview in a desktop browser, labeling UI Editor, Tablet preview, Mobile preview, and QR code -->

After building the pages on a computer, scan the QR code and check them on a physical device. Pay particular attention to navigation, scrolling, form input, pop-up pages, and safe areas.

## Build mobile navigation

The mobile layout uses a bottom tab bar as its primary navigation. Primary navigation currently supports mainly pages and links.

### Add a page

1. Open 「UI Editor」.
2. Click the add button on the right side of the bottom tab bar.
3. Select 「Page」.
4. Enter a page title and select an icon.
5. Submit the form to open the new page, then continue adding page content.

<!-- Add a video showing how to add a mobile page to the bottom tab bar -->

### Add a link

To open an internal or external URL, select 「Link」 and configure its title, icon, and URL.

A link can open in the current window or a new window, depending on its configuration.

<!-- Add a screenshot of the mobile link configuration -->

### Arrange navigation

In UI building mode, drag bottom tabs to reorder them. You can also edit a tab's title and icon, configure linkage rules, copy its UID, or delete it.

To view, show, hide, or delete mobile routes in one place, open 「Settings / Routes / Mobile routes」.

<!-- Add a screenshot showing the bottom tab settings menu and drag sorting -->

## Build a mobile page

Create and open a mobile page before adding blocks to it. The approach to building page content is essentially the same as on desktop: use [blocks](../blocks/index.md), [fields](../fields/index.md), and [actions](../actions/index.md) to organize business content. However, mobile navigation and some component interactions are adjusted for smaller screens.

### Add page content

1. Open the mobile page you want to build.
2. Make sure 「UI Editor」 is enabled.
3. Click 「Add block」 on the page.
4. Select a table, form, details, filter, or another block.
5. Continue configuring fields, actions, and block settings.

<!-- Add a video showing how to open a mobile page and add a block -->

### Use page tabs

A mobile page can also use tabs. If multiple pieces of content belong under the same navigation entry but remain relatively independent, place them in separate tabs.

1. Open the page settings and enable 「Enable page tabs」. You can also edit the page under 「Settings / Routes / Mobile routes」 and select 「Enable page tabs」.
2. Turn on 「UI Editor」.
3. Click 「Add tab」 on the right side of the page tab bar.
4. Add the tab, then configure its name and page content.

If a mobile page contains only a small amount of content, use a single page. You do not need to enable tabs.

<!-- Add a screenshot showing page tabs enabled, a new tab being added, and the location of the Add tab button -->

### Mobile interactions for common components

Common components adjust their arrangement and interactions for the mobile layout. For instance, multi-column content becomes easier to browse vertically; selection and date-time fields use mobile-friendly pickers; and filters, associated record selection, and subpages use interfaces designed for touch interaction.

Tables remain tables on mobile, with horizontal scrolling for columns that extend beyond the screen. Any additional mobile behavior depends on the support provided by each block.

## Pages and subpages

Content opened from view, edit, associated record selection, and similar actions appears as a mobile subpage. The subpage provides a back button that returns you to the previous page.

When you open a deeper subpage, the bottom tab bar is temporarily hidden to leave more room for the current content. It reappears when you close the subpage or return to the previous level.

When switching between bottom tabs, the state of open pages is usually preserved, making it easier to move between mobile tasks.

<!-- Add a video showing a subpage opening, the bottom tab bar hiding, and the user returning -->

## Manage routes and permissions

Mobile routes can be maintained in the [Route Manager](../../routes/index.md). Open 「Settings / Routes / Mobile routes」 to add, edit, delete, show, or hide pages and links, or to configure tabs for a page.

Mobile route access permissions are configured separately from desktop permissions. Under role permissions, open 「Mobile routes」 and select the pages the current role can access. See [Permission configuration](../../users-permissions/acl/permissions.md) for details.

<!-- Add a screenshot of the Settings / Routes / Mobile routes management page -->

<!-- Add a screenshot of Mobile routes under role permissions -->

## Relationship with the desktop layout

You can build separate desktop and mobile pages from the same collection. For instance, a desktop page may use a table with many fields for data processing, while a mobile page may use a simpler list or form for on-site data entry.

The two layouts do not synchronize pages automatically. Changes to desktop pages, menus, or routes do not update the mobile configuration, and mobile changes do not affect desktop pages.

:::tip Recommendation

If mobile users only need occasional access to desktop pages, try the responsive [desktop layout](./desktop.md) first. Build a separate mobile layout only when you need dedicated mobile navigation and page workflows.

:::

## Related links

- [UI layout overview](./index.md) — Compare desktop and mobile layout use cases
- [Desktop layout](./desktop.md) — Use the default desktop layout and its narrow-screen responsiveness
- [Blocks](../blocks/index.md) — Add business content to mobile pages
- [Fields](../fields/index.md) — Configure mobile forms and data display fields
- [Actions](../actions/index.md) — Configure actions on mobile pages
- [Route Manager](../../routes/index.md) — Manage mobile pages, links, and tabs
- [Permission configuration](../../users-permissions/acl/permissions.md) — Control which mobile routes each role can access
