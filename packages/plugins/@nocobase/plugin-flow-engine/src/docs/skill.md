# FlowSurfaces Skill

This `skill.md` is the only stable main entry for `flowSurfaces` when used by AI.

## Recommended call order

1. Start with `flowSurfaces:get` to read the existing surface.
2. Then call `flowSurfaces:catalog` to inspect the current target `configureOptions`. This is the main discovery entry for high-frequency configuration.
3. Use `flowSurfaces:createMenu` to create the menu node first.
4. Use `flowSurfaces:createPage` to initialize a modern page (v2) for the menu item.
5. Use `flowSurfaces:compose` to organize blocks, fields, actions, and simple layout.
6. Use `flowSurfaces:configure` to update high-frequency settings.
7. For precise append operations, prefer `addBlock`, `addField`, `addAction`, `addRecordAction`, or their batch forms `addBlocks`, `addFields`, `addActions`, `addRecordActions`.
8. Keep using `createPage`, `destroyPage`, `addTab`, `updateTab`, `moveTab`, and `removeTab` for outer route-backed pages/tabs. Use `addPopupTab`, `updatePopupTab`, `movePopupTab`, and `removePopupTab` for popup child tabs.
9. For deletion and sorting, use `flowSurfaces:removeNode` and `flowSurfaces:moveNode` for ordinary nodes. Use `destroyPage` for pages, `removeTab` for outer tabs, and `removePopupTab` for popup child tabs.
10. Only fall back to lower-level actions such as `updateSettings`, `setLayout`, `setEventFlows`, `apply`, and `mutate` when the public semantics above are not sufficient.

## Read action conventions

- Read actions `flowSurfaces:get`, `flowSurfaces:catalog`, and `flowSurfaces:context` are open to `loggedIn` by default. Write actions still require `ui.flowSurfaces`.
- `flowSurfaces:get` only accepts root-level locator fields: `uid`, `pageSchemaUid`, `tabSchemaUid`, `routeId`.
- Exactly one of those four locator fields must be used.
- Do not write `{ "target": { "uid": "..." } }`.
- Do not write `{ "values": { ... } }`.
- The `target` in the response only keeps lightweight locator information: `locator`, `uid`, `kind`.
- Read the actual node tree from `tree`. Read page-route information from top-level `pageRoute` and `route`. Tabs for route-backed pages are always read from `tree.subModels.tabs`.
- Error responses always include `message`, `type`, `code`, and `status`.
- The most common read forms are:

```text
GET /api/flowSurfaces:get?uid=view-action-uid
GET /api/flowSurfaces:get?pageSchemaUid=employees-page-schema
```

## Direct-write action conventions

- `addAction` is only for non-record actions: block / form / filter-form / action-panel.
- `addRecordAction` is only for record actions: table / details / list / gridCard.
- Prefer these menu-level actions:
  - `createMenu`
  - `updateMenu`
- `createMenu(type="group")` creates a group. `createMenu(type="item")` creates a V2 page menu item that can be bound.
- `createPage(menuRouteId=...)` is the preferred way to initialize an existing menu item as a modern page (v2).
- In compatibility mode, `createPage` still auto-creates a top-level menu and page when `menuRouteId` is omitted.
- `createMenu(type="item")` currently pre-creates the flowPage route, the default hidden tab route, and the RootPageModel anchor. `createPage` still performs the real first-grid initialization and marks the page as initialized.
- Before `createPage(menuRouteId=...)`, do not use page/tab lifecycle APIs such as `addTab`, `updateTab`, `moveTab`, `removeTab`, or `destroyPage`. Those actions now require an initialized page.
- Outer route-backed page/tab APIs only accept canonical outer uids:
  - page: `destroyPage`, `addTab`
  - tab: `updateTab`, `moveTab`, `removeTab`
- The canonical uid of the current outer tab is the returned `tabSchemaUid`.
- Do not mix popup child tabs with outer page/tab APIs. Use only:
  - `addPopupTab`
  - `updatePopupTab`
  - `movePopupTab`
  - `removePopupTab`
- `addBlocks`, `addFields`, `addActions`, and `addRecordActions` all use “sequential within the same target + partial success” semantics. Each failed item always returns `error.message/type/code/status`.
- Top-level `catalog(target).configureOptions` is the main configuration entry. Each item in `blocks[] / fields[] / actions[] / recordActions[]` also carries its own `configureOptions`.
- The `blocks[] / actions[] / recordActions[]` in `catalog` only return the truly available public capabilities in the current instance. If a plugin is disabled, its capability will not appear.
- Both `configure` and inline `settings` should only use keys exposed in `configureOptions`.
- Direct `addBlock` / `addField` / `addAction` / `addRecordAction` and their batch APIs do not accept raw `wrapperProps / fieldProps / props / decoratorProps / stepParams / flowRegistry`.
- Use `settings` for high-frequency configuration. Fall back to `updateSettings` / `apply` only when you need lower-level precision.
- Except for `get`, all other write actions are normalized to uid-only locating:
  - any action with `target` must pass `{ "target": { "uid": "..." } }`
  - `destroyPage` and `removeTab` must pass root-level `{ "uid": "..." }`
- If you only have `pageSchemaUid / routeId`, call `flowSurfaces:get` first to obtain the canonical uid, then call the write action.
- `removeTab` cannot delete the last outer tab. Use `destroyPage` if you need to delete the whole page.
- `removeNode` is only for ordinary nodes such as block / field / action / popup subtree. Use `destroyPage` for pages and `removeTab` for tabs.

For example, `catalog(target=table)` may return:

```json
{
  "configureOptions": {
    "title": {
      "type": "string",
      "example": "User Table"
    },
    "pageSize": {
      "type": "number",
      "example": 20
    },
    "density": {
      "type": "string",
      "enum": ["large", "middle", "small"]
    },
    "dataScope": {
      "type": "object",
      "description": "FilterGroup shape. Use null or {} for an empty filter."
    }
  }
}
```

## Capability matrix

The list below shows common public semantics. It does not mean every capability is enabled in every instance. The real available set is whatever `catalog` returns.

### Common block `type`

- collection block: `table`, `createForm`, `editForm`, `details`, `filterForm`, `list`, `gridCard`
- static block: `markdown`, `iframe`, `chart`, `actionPanel`
- JS block: `jsBlock`

### Common action `type`

- block: `filter`, `addNew`, `popup`, `refresh`, `expandCollapse`, `bulkDelete`, `bulkEdit`, `bulkUpdate`, `export`, `exportAttachments`, `import`, `link`, `upload`, `composeEmail`, `templatePrint`, `triggerWorkflow`
- record: `view`, `edit`, `popup`, `duplicate`, `addChild`, `delete`, `updateRecord`, `composeEmail`, `templatePrint`, `triggerWorkflow`
- form: `submit`, `js`, `jsItem`, `triggerWorkflow`
- filter-form: `submit`, `reset`, `collapse`, `js`
- JS action: `js`

Additional notes:

- table block additionally supports `expandCollapse`, `bulkDelete`, `bulkEdit`, `bulkUpdate`, `export`, `exportAttachments`, `import`, `link`, `upload`, `composeEmail`, `templatePrint`
- table `recordActions` additionally support `duplicate`, `addChild`, `composeEmail`
- filter-form additionally supports `collapse`

### Common field semantics

- bound field: `"username"` or `{ "fieldPath": "nickname" }`
- JS renderer variant of a bound field: `{ "fieldPath": "nickname", "renderer": "js" }`
- standalone JS column: `{ "type": "jsColumn" }`
- standalone JS item: `{ "type": "jsItem" }`
- form-item-level JS action: `{ "type": "jsItem" }`
- `FormJSFieldItemModel` is the runtime / validator model name of an inline form JS field item. Public creation still uses `fieldPath + renderer: "js"`.

## Example 1: create a menu and initialize a page

```json
{
  "title": "Users workspace",
  "type": "item"
}
```

Then call:

```json
{
  "menuRouteId": 1001,
  "tabTitle": "Overview"
}
```

After page initialization succeeds:

- use the returned `pageUid` for page-level writes
- if you need to keep writing to the default outer tab, use the returned `tabSchemaUid`
- `pageSchemaUid / routeId` are mainly reserved for `flowSurfaces:get`

## Example 1.1: popup child tab API

If a field / action already has a popup subtree:

- `popupPageUid` can be read from `get(hostUid).tree.subModels.page.uid`
- `popupTabUid` can be read from `get(hostUid).tree.subModels.page.subModels.tabs[].uid`
- those uids are only for popup-tab APIs and must not be passed back to outer `addTab / updateTab / moveTab / removeTab`

`addPopupTab`:

```json
{
  "target": {
    "uid": "popup-page-uid"
  },
  "title": "Popup details",
  "icon": "TableOutlined",
  "documentTitle": "Popup details tab"
}
```

`updatePopupTab`:

```json
{
  "target": {
    "uid": "popup-tab-uid"
  },
  "title": "Popup details updated",
  "icon": "AppstoreOutlined",
  "documentTitle": "Popup details updated"
}
```

`movePopupTab`:

```json
{
  "sourceUid": "popup-secondary-tab-uid",
  "targetUid": "popup-primary-tab-uid",
  "position": "before"
}
```

`removePopupTab`:

```json
{
  "target": {
    "uid": "popup-tab-uid"
  }
}
```

`removePopup` is not provided in this iteration. `removePopupTab` may remove tabs until the popup has 0 tabs.

## Example 1.2: popup block resource semantics

When adding a collection block under a popup, do not guess `resourceInit` first. Check:

- `catalog(target=popup-host-or-popup-grid).blocks[].resourceBindings`

From the public API perspective, popups can be understood in three classes:

- association-field popup: has the current record and association context
- non-association-field popup: has the current record but no association context
- plain popup: has neither current record nor association context
- the `select / subForm / bulkEditForm` scene is currently recognized only, and popup collection block creation is not supported there; avoid `compose/addBlock` for collection blocks in those popup scenes

Prefer the semantic `resource` directly:

- `currentCollection`
- `currentRecord`
- `associatedRecords`
- `otherRecords`

For example, create current-record details inside a non-association-field popup:

```json
{
  "target": {
    "uid": "view-action-uid"
  },
  "mode": "replace",
  "blocks": [
    {
      "key": "details",
      "type": "details",
      "resource": {
        "binding": "currentRecord"
      },
      "fields": ["nickname", "department.title"]
    }
  ]
}
```

For example, create an associated-records table inside an association-field popup:

```json
{
  "target": {
    "uid": "association-popup-action-uid"
  },
  "mode": "replace",
  "blocks": [
    {
      "key": "employees",
      "type": "table",
      "resource": {
        "binding": "associatedRecords",
        "associationField": "employee"
      },
      "fields": ["nickname", "status"],
      "actions": ["refresh"],
      "recordActions": ["view", "edit"]
    }
  ]
}
```

For example, create only a current-collection block or another collection block inside a plain popup:

```json
{
  "target": {
    "uid": "add-new-action-uid"
  },
  "type": "createForm",
  "resource": {
    "binding": "currentCollection"
  }
}
```

If you need to bind another data source / collection explicitly, pass:

```json
{
  "target": {
    "uid": "popup-action-uid"
  },
  "type": "table",
  "resource": {
    "binding": "otherRecords",
    "dataSourceKey": "main",
    "collectionName": "departments"
  }
}
```

If you hand-write `resourceInit` and it does not match the current popup semantics, the server returns `400` directly and tells you to go back to `catalog.blocks[].resourceBindings`.

## Example 2: create `filterForm + table` on the same row with a `3:7` layout

```json
{
  "target": {
    "uid": "page-tab-schema-uid"
  },
  "mode": "append",
  "blocks": [
    {
      "key": "filter",
      "type": "filterForm",
      "resource": {
        "dataSourceKey": "main",
        "collectionName": "users"
      },
      "fields": [
        {
          "fieldPath": "username",
          "target": "table"
        },
        {
          "fieldPath": "nickname",
          "target": "table"
        }
      ],
      "actions": ["submit", "reset"]
    },
    {
      "key": "table",
      "type": "table",
      "resource": {
        "dataSourceKey": "main",
        "collectionName": "users"
      },
      "fields": [
        "username",
        "nickname",
        {
          "fieldPath": "roles.title"
        }
      ],
      "actions": ["addNew", "refresh", "bulkDelete", "link"],
      "recordActions": [
        "view",
        "edit",
        {
          "type": "popup",
          "popup": {
            "mode": "replace",
            "blocks": [
              {
                "key": "details",
                "type": "details",
                "resource": {
                  "dataSourceKey": "main",
                  "collectionName": "users"
                },
                "fields": ["username", "nickname"]
              }
            ]
          }
        },
        "updateRecord",
        "delete"
      ]
    }
  ],
  "layout": {
    "rows": [
      [
        {
          "key": "filter",
          "span": 3
        },
        {
          "key": "table",
          "span": 7
        }
      ]
    ]
  }
}
```

The public semantics of `table` / `details` / `list` / `gridCard` are unified as:

- `actions` = block-level actions
- `recordActions` = record/item-level actions
- `catalog(target=table/details/list/gridCard)` returns `actions` and `recordActions` in the same semantic split

A to-many leaf path such as `roles.title` is valid in display scenarios. The server automatically normalizes it into association-value binding. The caller does not need to handle `associationPathName`, `titleField`, or click context manually.

`dataScope` must use the FilterGroup shape rather than a plain query-object. For example:

```json
{
  "logic": "$and",
  "items": [
    {
      "path": "nickname",
      "operator": "$eq",
      "value": "alpha"
    }
  ]
}
```

An empty filter may be `null` or `{}`. The server normalizes it to:

```json
{
  "logic": "$and",
  "items": []
}
```

## Example 3: enable `clickToOpen + openView` on an association field

First obtain `wrapperUid/fieldUid` from `compose` or `get`. `configure` accepts either the wrapper or the inner field.

```json
{
  "target": {
    "uid": "roles-field-wrapper-uid"
  },
  "changes": {
    "clickToOpen": true,
    "openView": {
      "dataSourceKey": "main",
      "collectionName": "roles",
      "mode": "drawer"
    }
  }
}
```

## Example 4: append `details` to a field popup

```json
{
  "target": {
    "uid": "roles-field-uid"
  },
  "type": "details",
  "resourceInit": {
    "dataSourceKey": "main",
    "collectionName": "roles"
  }
}
```

If a field / action creates a popup subtree, the response includes `popupPageUid/popupTabUid/popupGridUid`.

## Example 5: static blocks and richer list-like substructures

### 5.1 Static blocks

```json
{
  "target": {
    "uid": "page-tab-schema-uid"
  },
  "blocks": [
    {
      "key": "markdown",
      "type": "markdown",
      "settings": {
        "content": "# Team handbook"
      }
    },
    {
      "key": "iframe",
      "type": "iframe",
      "settings": {
        "mode": "url",
        "url": "https://example.com/embed",
        "height": 360
      }
    },
    {
      "key": "panel",
      "type": "actionPanel",
      "settings": {
        "layout": "list",
        "ellipsis": false
      }
    }
  ]
}
```

### 5.2 `table` / `list` / `gridCard`

- `fields` = content fields for a table record / list item / grid card item
- `actions` = block-level actions
- `recordActions` = record actions on each table row / each list item / each grid card

```json
{
  "target": {
    "uid": "page-tab-schema-uid"
  },
  "blocks": [
    {
      "key": "employeesList",
      "type": "list",
      "resource": {
        "dataSourceKey": "main",
        "collectionName": "employees"
      },
      "fields": [
        "nickname",
        {
          "fieldPath": "department.name"
        }
      ],
      "actions": ["addNew", "refresh"],
      "recordActions": ["view", "edit", "delete"]
    },
    {
      "key": "employeeCards",
      "type": "gridCard",
      "resource": {
        "dataSourceKey": "main",
        "collectionName": "employees"
      },
      "fields": [
        "nickname",
        {
          "fieldPath": "department.name"
        }
      ],
      "actions": ["addNew", "refresh"],
      "recordActions": ["view", "edit", "updateRecord", "delete"]
    }
  ]
}
```

## Example 5.3: append a record action directly

For `addRecordAction`, pass a record-capable owner target. Do not pass an internal table actions-column uid.

```json
{
  "target": {
    "uid": "users-table-uid"
  },
  "type": "view",
  "settings": {
    "title": "View User",
    "openView": {
      "dataSourceKey": "main",
      "collectionName": "users",
      "mode": "drawer"
    }
  },
  "popup": {
    "mode": "replace",
    "blocks": [
      {
        "key": "details",
        "type": "details",
        "resource": {
          "dataSourceKey": "main",
          "collectionName": "users"
        },
        "fields": ["username", "nickname"]
      }
    ]
  }
}
```

`addAction` and `addRecordAction` must stay strictly separate:

- use `addAction` for non-record actions
- use `addRecordAction` for record actions
- do not put record actions of table / details / list / gridCard into `addAction`
- direct `add*` also supports inline `settings`
- direct `add*` does not accept raw `wrapperProps / fieldProps / props / decoratorProps / stepParams / flowRegistry`
- the `settings` shape is the same as `configure.changes`
- popup-capable actions may include `popup` directly

## Example 5.4: batch append block / field / action / record action

All batch APIs use “sequential within the same target + partial success” semantics. Failed items always return a structured `error`: `message`, `type`, `code`, `status`.

`addBlocks`:

```json
{
  "target": {
    "uid": "page-grid-uid"
  },
  "blocks": [
    {
      "key": "usersTable",
      "type": "table",
      "resourceInit": {
        "dataSourceKey": "main",
        "collectionName": "users"
      },
      "settings": {
        "title": "Users table",
        "pageSize": 50
      }
    },
    {
      "key": "teamNotes",
      "type": "markdown",
      "settings": {
        "content": "# Team notes"
      }
    }
  ]
}
```

`addFields`:

```json
{
  "target": {
    "uid": "table-block-uid"
  },
  "fields": [
    {
      "key": "username",
      "fieldPath": "username",
      "settings": {
        "title": "User name",
        "width": 220
      }
    },
    {
      "key": "nickname",
      "fieldPath": "nickname",
      "renderer": "js",
      "settings": {
        "label": "Nickname (JS)",
        "code": "return value;",
        "version": "1.0.0"
      }
    }
  ]
}
```

`addActions`:

```json
{
  "target": {
    "uid": "filter-form-block-uid"
  },
  "actions": [
    {
      "key": "submit",
      "type": "submit",
      "settings": {
        "title": "Search",
        "confirm": false
      }
    },
    {
      "key": "reset",
      "type": "reset",
      "settings": {
        "title": "Reset filters"
      }
    }
  ]
}
```

`addRecordActions`:

```json
{
  "target": {
    "uid": "table-block-uid"
  },
  "recordActions": [
    {
      "key": "view",
      "type": "view",
      "settings": {
        "title": "View User",
        "openView": {
          "dataSourceKey": "main",
          "collectionName": "users",
          "mode": "drawer"
        }
      },
      "popup": {
        "mode": "replace",
        "blocks": [
          {
            "key": "details",
            "type": "details",
            "resource": {
              "dataSourceKey": "main",
              "collectionName": "users"
            },
            "fields": ["username"]
          }
        ]
      }
    },
    {
      "key": "edit",
      "type": "edit",
      "settings": {
        "title": "Edit User"
      }
    },
    {
      "key": "delete",
      "type": "delete",
      "settings": {
        "title": "Delete User"
      }
    }
  ]
}
```

## Example 6: JS block / JS action / JS field

### 6.1 `jsBlock`

```json
{
  "target": {
    "uid": "page-grid-uid"
  },
  "mode": "append",
  "blocks": [
    {
      "key": "customHero",
      "type": "jsBlock",
      "settings": {
        "title": "Users hero",
        "description": "Rendered by JS block",
        "className": "users-hero",
        "version": "1.0.0",
        "code": "ctx.render('<div>Users hero</div>');"
      }
    }
  ]
}
```

### 6.2 `js` action under block / record / form / actionPanel

```json
{
  "target": {
    "uid": "action-panel-uid"
  },
  "type": "js",
  "settings": {
    "title": "Run JS",
    "type": "primary",
    "version": "1.0.0",
    "code": "await ctx.runjs('console.log(\"hello\")');"
  }
}
```

### 6.2.1 form `jsItem` action

```json
{
  "target": {
    "uid": "create-form-uid"
  },
  "type": "jsItem",
  "settings": {
    "title": "Run item JS",
    "type": "default",
    "version": "1.0.0",
    "code": "await ctx.runjs('console.log(\"item\")');"
  }
}
```

### 6.3 JS field variants

Bound JS fields inside table/details/list/gridCard:

```json
{
  "target": {
    "uid": "table-block-uid"
  },
  "fieldPath": "nickname",
  "renderer": "js"
}
```

Standalone JS columns inside a table:

```json
{
  "target": {
    "uid": "table-block-uid"
  },
  "type": "jsColumn",
  "settings": {
    "title": "Runtime column",
    "version": "1.0.0",
    "code": "ctx.render(String(ctx.record?.nickname || ''));"
  }
}
```

Standalone JS items inside a form:

```json
{
  "target": {
    "uid": "create-form-grid-uid"
  },
  "type": "jsItem",
  "settings": {
    "label": "Runtime item",
    "showLabel": true,
    "version": "1.0.0",
    "code": "ctx.render(String(ctx.record?.nickname || ''));"
  }
}
```

## Example 7: use `configure` for high-frequency JS configuration

JS block:

```json
{
  "target": {
    "uid": "js-block-uid"
  },
  "changes": {
    "title": "Users hero",
    "description": "Rendered from configure",
    "className": "users-hero",
    "version": "1.0.1",
    "code": "ctx.render('<div>Users hero</div>');"
  }
}
```

JS field / JS action / JS column / JS item also support the high-frequency `code` and `version` keys. Other simple fields keep using the same `configure` entry:

- page: `title`, `documentTitle`, `displayTitle`, `enableTabs`, `icon`, `enableHeader`
- table: `resource`, `pageSize`, `density`, `showRowNumbers`, `sorting`, `dataScope`, `quickEdit`, `treeTable`, `defaultExpandAllRows`, `dragSort`, `dragSortBy`
- form / createForm / editForm: `layout`, `labelAlign`, `labelWidth`, `labelWrap`, `assignRules`, `colon`
- editForm: `dataScope`
- details: `resource`, `layout`, `labelAlign`, `labelWidth`, `labelWrap`, `sorting`, `dataScope`, `colon`, `linkageRules`
- field wrapper: `label`, `tooltip`, `width`, `titleField`, `clickToOpen`, `openView`
- action: `title`, `tooltip`, `icon`, `type`, `danger`, `openView`, `confirm`, `assignValues`, `linkageRules`, `editMode`, `updateMode`, `duplicateMode`, `collapsedRows`, `defaultCollapsed`, `emailFieldNames`, `defaultSelectAllRecords`
- jsColumn: `title`, `tooltip`, `width`, `fixed`
- jsItem: `label`, `tooltip`, `extra`, `showLabel`, `labelWidth`, `labelWrap`

High-frequency page example:

```json
{
  "target": {
    "uid": "employees-page-uid"
  },
  "changes": {
    "icon": "UserOutlined",
    "enableHeader": false
  }
}
```

High-frequency table example:

```json
{
  "target": {
    "uid": "tree-table-block-uid"
  },
  "changes": {
    "quickEdit": true,
    "treeTable": true,
    "defaultExpandAllRows": true,
    "dragSort": true,
    "dragSortBy": "sort"
  }
}
```

High-frequency editForm example:

```json
{
  "target": {
    "uid": "edit-form-block-uid"
  },
  "changes": {
    "colon": false,
    "dataScope": {
      "logic": "$and",
      "items": [
        {
          "path": "status",
          "operator": "$eq",
          "value": "draft"
        }
      ]
    }
  }
}
```

High-frequency details example:

```json
{
  "target": {
    "uid": "details-block-uid"
  },
  "changes": {
    "colon": true,
    "linkageRules": [
      {
        "when": {
          "path": "status",
          "operator": "$eq",
          "value": "archived"
        },
        "set": {
          "hidden": true
        }
      }
    ]
  }
}
```

High-frequency action example:

```json
{
  "target": {
    "uid": "compose-email-action-uid"
  },
  "changes": {
    "linkageRules": [
      {
        "when": {
          "path": "status",
          "operator": "$eq",
          "value": "draft"
        },
        "set": {
          "disabled": true
        }
      }
    ],
    "editMode": "drawer",
    "updateMode": "overwrite",
    "duplicateMode": "popup",
    "collapsedRows": 2,
    "defaultCollapsed": true,
    "emailFieldNames": ["email", "backupEmail"],
    "defaultSelectAllRecords": true
  }
}
```

## Delete and mutate guidance

- delete a field: prefer passing `wrapperUid`
- delete an action: pass the action `uid`
- reorder: use `moveNode`
- complex event flows still use `setEventFlows`
- precise subtree replacement still uses `apply`

## When to fall back to lower-level APIs

Only fall back in these cases:

- you need exact control of `props / decoratorProps / stepParams / flowRegistry`
- you need complex `setLayout`
- you need complex event-flow orchestration
- you need `$ref`-style chained transactional orchestration
- you need precise `apply(replace)` on page/tab/popup subtrees

For more JS model details, see [flow-surfaces-ai-js-models.md](./flow-surfaces-ai-js-models.md).
