---
title: "Supported Capabilities"
description: "All capabilities supported by AI development: scaffolding, collections, blocks, fields, actions, settings pages, APIs, permissions, i18n, and migrations."
keywords: "AI development,capabilities,plugin development,scaffolding,collections,blocks,fields,actions,permissions,i18n"
---

# Supported Capabilities

Here is a list of everything AI can currently help you do. Each capability comes with a sample prompt that you can copy and adapt to your own requirements.

## Quick Reference

| I want to... | AI can help you |
|----------|-----------|
| Create a new plugin | Generate a complete scaffold, including frontend and backend directory structure |
| Define collections | Generate Collection definitions, supporting all field types and relationships |
| Build a custom block | Generate BlockModel + settings panel + register it in the "Add Block" menu |
| Build a custom field | Generate FieldModel + bind it to a field interface |
| Add a custom action button | Generate ActionModel + popup/drawer/confirmation dialog |
| Build a plugin settings page | Generate frontend form + backend API + storage |
| Write a custom API | Generate Resource Action + route registration + ACL configuration |
| Configure permissions | Generate ACL rules to control access by role |
| Support multiple languages | Automatically generate Chinese and English language packs |
| Write a migration script | Generate Migration, supporting DDL and data migration |

## Plugin Scaffolding

AI can generate a complete NocoBase plugin directory structure based on your requirements -- including frontend and backend entry files, type definitions, and base configuration.

Sample prompt:

```
Create a NocoBase plugin called @my-scope/plugin-todo
```

AI will run `yarn pm create @my-scope/plugin-todo` and generate a standard directory:

```
packages/plugins/@my-scope/plugin-todo/
├── src/
│   ├── server/
│   │   └── plugin.ts
│   ├── client-v2/
│   │   └── plugin.tsx
│   └── locale/
│       ├── zh-CN.json
│       └── en-US.json
├── package.json
└── ...
```

## Collection Definitions

AI can generate Collection definitions for all NocoBase field types, including relationships (one-to-many, many-to-many, etc.).

Sample prompt:

```
Define an "orders" table in the plugin with the following fields: order number (auto-increment),
customer name (string), amount (decimal), status (single select: pending/processing/completed),
and created time.
Orders have a many-to-one relationship with customers.
```

AI will generate a `defineCollection` definition, including field types, default values, relationship configuration, and more.

## Custom Blocks

Blocks are the most fundamental way to extend the NocoBase frontend. AI can help you generate block models, settings panels, and menu registration.

Sample prompt:

```
Create a "Data Statistics" block that uses Ant Design's Statistic component to display
the total number of orders, total amount, and new orders this month.
Data should be fetched from a backend API.
```

AI will generate:

- `BlockModel` or `CollectionBlockModel` (depending on whether it's linked to a collection)
- `registerFlow` settings panel
- Registration in the "Add Block" menu

<!-- Screenshot of a custom block on a page needed -->

## Custom Fields

If NocoBase's built-in field components don't meet your needs, AI can help you create a custom one.

Sample prompt:

```
Create a "rating" field that displays star icons, supports 1-5 ratings,
and allows users to click to change the rating value.
```

AI will generate a `FieldModel` and bind it to a NocoBase field interface using `bindModelToInterface`.

## Custom Actions

Action buttons can trigger popups, drawers, confirmation dialogs, or directly call APIs.

Sample prompt:

```
Add a "Bulk Export" button to the orders table that calls a backend API to export
the selected orders as a CSV file when clicked.
```

AI will generate an `ActionModel`, popup/confirmation logic, and the backend export API.

## Plugin Settings Page

Many plugins need a settings page for users to configure parameters -- such as third-party service API keys, webhook URLs, etc.

Sample prompt:

```
Create a plugin settings page that lets users configure the following parameters:
- API Key (string, required)
- Webhook URL (string, optional)
- Enable notifications (toggle)
Settings should be saved to the database, and the frontend should use Ant Design forms.
```

AI will generate the frontend form component, backend storage API, and ACL configuration.

<!-- Screenshot of a plugin settings page needed -->

## Custom APIs

If the built-in CRUD endpoints aren't sufficient, AI can help you write custom REST APIs.

Sample prompt:

```
Write an API with the path myPlugin:statistics that returns order statistics
(total count, total amount, count grouped by status). Only logged-in users can access it.
```

AI will generate the Resource Action handler, route registration, and ACL configuration.

## Permission Configuration

AI will automatically configure appropriate ACL rules for generated APIs and resources. You can also explicitly specify permission requirements:

Sample prompt:

```
Permission requirements for this plugin: regular users can only see orders they created,
admins can see all orders, and only admins can delete orders.
```

## Internationalization

AI generates Chinese and English language packs (`zh-CN.json` and `en-US.json`) by default -- you don't need to ask for them separately.

If you need additional languages:

```
Also generate a Japanese language pack
```

## Migration Scripts

When a plugin needs to update the database schema or migrate data, AI can help you generate Migration scripts.

Sample prompt:

```
My plugin needs an upgrade. Add a "notes" field (long text, optional) to the "orders" table,
and set the default value of the notes field to "N/A" for all existing orders.
```

AI will generate a versioned Migration file, including DDL operations and data migration logic.

## Related Links

- [AI Development Overview](./index.md) -- Quick start and capability overview
- [Tutorial: Building a Watermark Plugin](./watermark-plugin) -- A complete hands-on AI development case study
- [Plugin Development](/en/plugin-development) -- The complete guide to NocoBase plugin development
- [NocoBase CLI](/en/get-started/nocobase-cli) -- Command-line tool for installing and managing NocoBase
