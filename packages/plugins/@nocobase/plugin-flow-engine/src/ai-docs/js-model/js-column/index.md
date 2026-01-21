# JSColumnModel presets

JSColumnModel renders table cells with raw JavaScript. The CRM-oriented presets below live in `.md` files but only use plain JavaScript (no imports). Each file contains named helper functions that expect the standard JS column context (`ctx.element`, `ctx.record`, `ctx.viewer`, `ctx.React` if you want JSX). Copy the helper and either call it (`renderAccountIdentityColumn(ctx);`) or inline the body inside your column.

## How to use the presets

Every snippet referenced at the end of this file targets a common CRM scenario (accounts, contacts, opportunities, quotes, tickets, inline actions, etc.). Copy the helper that matches your need, adjust field names and `openView` UIDs, and keep DOM mutations inside `ctx.element`. Functions already guard against repeated event bindings and avoid external CDNs, so you only need to adapt the business logic.
