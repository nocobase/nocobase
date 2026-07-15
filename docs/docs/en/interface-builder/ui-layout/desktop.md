---
title: "Desktop Layout"
description: "Learn about the navigation structure, page building, route management, and narrow-screen responsive behavior of the NocoBase desktop layout."
keywords: "desktop layout,UI layout,narrow-screen responsive,page building,route management,UI Editor,NocoBase"
---

# Desktop Layout

In NocoBase, the **desktop layout** is the default application interface. It is designed for data management, form entry, business configuration, and everyday work on a computer, while also adapting its navigation and page content for narrow screens.

The desktop layout is available at `/admin` by default. If the application has its own access prefix, the actual URL automatically includes that prefix.

<!-- Add a full-page screenshot of the desktop layout showing the top navigation, side navigation, and content area -->

## Layout features

The desktop layout consists mainly of the following areas:

- **Top navigation** — Displays the application switcher and global action entries.
- **Side navigation** — Displays pages and links in the current group.
- **Page content area** — Displays page tabs, blocks, fields, and actions.
- **UI Editor** — Opens UI building mode so you can adjust menus and page content.

The top and side navigation keep the current route selected. When you switch pages, the content appears in the area on the right, and the state of previously opened pages is usually preserved.

## Build a page

### Step 1: Open the desktop layout

Visit `/admin` to open the desktop layout. After signing in, the application usually opens this layout directly.

<!-- Add a screenshot of the desktop layout after opening it -->

### Step 2: Open UI Editor

Click 「UI Editor」 in the upper-right corner of the page to enter UI building mode. Configuration entries then appear around menus, pages, blocks, fields, and actions.

<!-- Add a screenshot showing the location of the UI Editor button and the page after it is enabled -->

### Step 3: Create menus and pages

You can add groups, pages, or links in the navigation area, and enable tabs for a page. After creating a page, open it and add the blocks you need.

Page content is built in the same way as other interfaces: add [blocks](../blocks/index.md) first, then configure [fields](../fields/index.md) and [actions](../actions/index.md) for your business needs.

<!-- Add a video showing how to add a menu, create a page, and open the page -->

### Step 4: Configure page content

Add table, form, details, filter, or other blocks to the page, then adjust the fields, actions, and arrangement of the blocks. Each change is reflected directly on the current page.

<!-- Add a screenshot of a desktop page in UI building mode, showing configuration entries for blocks, fields, and actions -->

## Manage routes and menus

Desktop menus and routes use the same configuration. When you add a page or link in the navigation area, it also appears in the [Route Manager](../../routes/index.md). Changes made in the Route Manager also update the menu.

The desktop layout supports these common route types:

- **Group** — Organizes multiple pages and links under the same navigation group.
- **Page** — Opens a page where you can continue adding blocks.
- **Link** — Opens an internal or external URL.
- **Tab** — Organizes multiple content tabs within a page.

In the Route Manager, you can add, edit, delete, show, or hide routes. It is often the more convenient place to reorganize the entire menu structure.

<!-- Add a screenshot of Settings / Routes / Desktop routes -->

## Responsive behavior on narrow screens

The desktop layout can be used directly on a phone or in a narrow browser window. In narrow-screen mode, it continues to use the same desktop routes and pages. It does not automatically switch to the mobile layout.

### Layout changes

The navigation menu collapses, and top actions move into a more compact entry. Page margins and spacing between blocks also shrink, while the content area adapts to the visible height of the mobile browser.

UI Editor is not available on narrow screens. To change menus or pages, return to a desktop browser and make the changes there.

<!-- Add a video showing the same desktop page changing from a wide screen to a narrow screen -->

### How page content adapts

Common layouts and components also adapt to narrow screens. For instance, multi-column blocks become easier to browse vertically, tables allow horizontal scrolling for columns that extend beyond the screen, and pagination and action entries become more compact. Selection, date and time, filter, and subpage interactions also use forms that are easier to operate on a small screen.

Any additional narrow-screen behavior depends on the support provided by each block. Tables remain tables on narrow screens and are not automatically converted into cards.

:::tip Desktop responsiveness and the mobile layout

If you only access the application from a phone occasionally, the responsive desktop layout is usually enough. If you need separate bottom navigation, mobile pages, and mobile workflows, build a [mobile layout](./mobile.md) as well.

:::

## Recommendations

- Use the desktop layout by default for work performed mainly on a computer.
- Finish building the page on a wide screen, then narrow the window to check its responsive behavior.
- If a page contains many table columns or horizontal actions, keep only the necessary content to reduce the workload on smaller screens.
- If the desktop and mobile workflows differ significantly, separate pages are usually clearer.

## Related links

- [UI layout overview](./index.md) — Compare desktop and mobile layout use cases
- [Mobile layout](./mobile.md) — Build separate mobile navigation and pages
- [Blocks](../blocks/index.md) — Add and configure blocks on a page
- [Fields](../fields/index.md) — Configure fields in tables, forms, and details blocks
- [Actions](../actions/index.md) — Configure actions on pages and blocks
- [Route Manager](../../routes/index.md) — Manage desktop menus and routes in one place
- [Permission configuration](../../users-permissions/acl/permissions.md) — Control which desktop routes each role can access
