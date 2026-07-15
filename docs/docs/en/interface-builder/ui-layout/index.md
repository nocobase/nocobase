---
title: "UI Layout"
description: "An overview of NocoBase UI layouts, including desktop and mobile layout features, use cases, and how their configurations relate."
keywords: "UI layout,desktop layout,mobile layout,responsive layout,mobile pages,NocoBase"
---

# UI Layout

NocoBase provides desktop and mobile layouts. Both layouts support UI building, so you can create pages and configure blocks, fields, and actions within them.

The desktop layout is the default choice and works well for everyday administration and data processing on a computer. If you need dedicated navigation and pages for mobile devices, you can build a mobile layout as well.

## Desktop layout

The [desktop layout](./desktop.md) is available at `/admin` by default. It consists of top navigation, side navigation, and a page content area, making it suitable for common business scenarios such as managing tables, entering form data, and viewing records.

The desktop layout also supports responsive behavior on narrow screens. When a page is displayed on a smaller screen, the navigation, spacing, and common components adjust to fit while continuing to use the existing desktop menus and pages.

![20260715224020](https://static-docs.nocobase.com/20260715224020.png)

## Mobile layout

The [mobile layout](./mobile.md) is available at `/mobile` by default. It uses a bottom tab bar for primary navigation and provides separate mobile pages, links, and page tabs.

The mobile layout works well for frequent phone-based tasks such as on-site data entry, mobile approvals, task processing, and data lookup. You can build and preview pages in a desktop browser, then use a QR code to check the result on a physical device.

![20260715230725](https://static-docs.nocobase.com/20260715230725.png)

## Which layout should I use?

Use the desktop layout by default.

| I want to... | Recommended layout |
| --- | --- |
| Work mainly on a computer and occasionally access pages from a phone | [Desktop layout](./desktop.md) |
| Design separate navigation, pages, and workflows for phones | [Mobile layout](./mobile.md) |
| Provide a complete experience for both computers and mobile devices | Build the desktop and mobile layouts separately |

## How the configurations relate

The desktop and mobile layouts use the same data sources and business data. You can use the same data table to build separate pages for different devices.

Menus, routes, and page configurations are maintained separately. Changes to a desktop page do not automatically update its mobile counterpart, and changes to mobile navigation do not affect desktop navigation. [Route access permissions](../../users-permissions/acl/permissions.md) also need to be configured separately for each layout.

## Related links

- [Desktop layout](./desktop.md) — Build desktop pages and learn how they behave on narrow screens
- [Mobile layout](./mobile.md) — Build separate mobile navigation and pages
- [Route Manager](../../routes/index.md) — Manage desktop and mobile pages, links, and menus
- [Permission configuration](../../users-permissions/acl/permissions.md) — Control which menus and pages each role can access
