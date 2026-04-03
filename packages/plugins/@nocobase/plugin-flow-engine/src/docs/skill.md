# FlowSurfaces Skill

这份 `skill.md` 是 `flowSurfaces` 面向 AI 的唯一稳定主入口。

## 推荐调用顺序

1. 先用 `flowSurfaces:get` 读取已有 surface。
2. 再用 `flowSurfaces:catalog` 看当前 target 的 `configureOptions`，它是主要的高频配置发现入口。
3. 先用 `flowSurfaces:createMenu` 创建菜单节点。
4. 再用 `flowSurfaces:createPage` 为菜单项初始化 modern page(v2)。
5. 再用 `flowSurfaces:compose` 组织 block、field、action 和简单布局。
6. 再用 `flowSurfaces:configure` 修改高频配置。
7. 如果需要精确追加，优先用 `addBlock`、`addField`、`addAction`、`addRecordAction` 或它们的批量版本 `addBlocks`、`addFields`、`addActions`、`addRecordActions`。
8. 外层 route-backed page/tab 继续用 `createPage`、`destroyPage`、`addTab`、`updateTab`、`moveTab`、`removeTab`；popup child tab 用 `addPopupTab`、`updatePopupTab`、`movePopupTab`、`removePopupTab`。
9. 删除与排序时，普通节点继续用 `flowSurfaces:removeNode`、`flowSurfaces:moveNode`；page 请用 `destroyPage`，外层 tab 请用 `removeTab`，popup child tab 请用 `removePopupTab`。
10. 只有当上述公开语义不够时，才降级到底层 `updateSettings`、`setLayout`、`setEventFlows`、`apply`、`mutate`。

## 读取接口约定

- `flowSurfaces:get` 只接受根级定位字段：`uid`、`pageSchemaUid`、`tabSchemaUid`、`routeId`
- 不要写成 `{ "target": { "uid": "..." } }`
- 响应里的 `target` 只保留轻量定位信息：`locator`、`uid`、`kind`
- 真实节点树看 `tree`；页面 route / tabs 信息看顶层 `pageRoute`、`route`、`tabs`、`tabTrees`
- 公开请求参数错误会返回 `400`，并带可执行的错误 message
- 最常用的是：

```text
GET /api/flowSurfaces:get?uid=view-action-uid
GET /api/flowSurfaces:get?pageSchemaUid=employees-page-schema
```

## 直写接口约定

- `addAction` 只用于非 record action：block / form / filter-form / action-panel
- `addRecordAction` 只用于 record action：table / details / list / gridCard
- 菜单层优先使用：
  - `createMenu`
  - `updateMenu`
- `createMenu(type="group")` 创建 group；`createMenu(type="item")` 创建可绑定 V2 页面菜单项
- `createPage(menuRouteId=...)` 优先用于把已有菜单项初始化成 modern page(v2)
- `createPage` 兼容模式下如果不传 `menuRouteId`，仍会自动创建顶级菜单并初始化页面
- 当前 `createMenu(type="item")` 会预创建 flowPage route、默认 hidden tab route 和 RootPageModel anchor；真正补齐首个 grid 并把页面标记为已初始化，仍由 `createPage` 完成
- 在 `createPage(menuRouteId=...)` 之前，不要使用 `addTab`、`updateTab`、`moveTab`、`removeTab`、`destroyPage` 这类 page/tab 生命周期 API；这些接口现在要求页面已初始化
- 外层 route-backed page/tab API 只接受外层 canonical uid：
  - page：`destroyPage`、`addTab`
  - tab：`updateTab`、`moveTab`、`removeTab`
- popup child tab 不要混用外层 page/tab API；统一改用：
  - `addPopupTab`
  - `updatePopupTab`
  - `movePopupTab`
  - `removePopupTab`
- `addBlocks`、`addFields`、`addActions`、`addRecordActions` 都是“同一 target 下顺序批量 + 部分成功”语义
- `catalog(target)` 顶层的 `configureOptions` 是主要配置入口；`blocks[] / fields[] / actions[] / recordActions[]` 里的每个 item 也会带自己的 `configureOptions`
- `configure` 与 inline `settings` 都只建议使用这些 `configureOptions` 里的 key
- direct `addBlock` / `addField` / `addAction` / `addRecordAction` 以及对应批量 API 不接受 raw `wrapperProps / fieldProps / props / decoratorProps / stepParams / flowRegistry`
- 需要高频改配时统一使用 `settings`；需要底层精确控制时再降级到 `updateSettings` / `apply`
- 除 `get` 外，其它写接口的定位一律收口为 uid-only：
  - 有 `target` 的一律传 `{ "target": { "uid": "..." } }`
  - `destroyPage`、`removeTab` 一律传根级 `{ "uid": "..." }`
- 如果你手上只有 `pageSchemaUid / tabSchemaUid / routeId`，先调用 `flowSurfaces:get` 拿到 canonical uid，再走写接口
- `removeNode` 只用于 block / field / action / popup subtree 等普通节点；page 请用 `destroyPage`，tab 请用 `removeTab`

例如 `catalog(target=table)` 里可能会看到：

```json
{
  "configureOptions": {
    "title": {
      "type": "string",
      "example": "用户表"
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
      "description": "FilterGroup 结构；空筛选可传 null 或 {}"
    }
  }
}
```

## 能力矩阵

### 常用 block `type`

- collection block: `table`、`createForm`、`editForm`、`details`、`filterForm`、`list`、`gridCard`
- static block: `markdown`、`iframe`、`chart`、`actionPanel`
- JS block: `jsBlock`

### 常用 action `type`

- block: `filter`、`addNew`、`popup`、`refresh`、`expandCollapse`、`bulkDelete`、`bulkEdit`、`bulkUpdate`、`export`、`exportAttachments`、`import`、`link`、`upload`、`composeEmail`、`templatePrint`、`triggerWorkflow`
- record: `view`、`edit`、`popup`、`duplicate`、`addChild`、`delete`、`updateRecord`、`composeEmail`、`templatePrint`、`triggerWorkflow`
- form / filter-form: `submit`、`reset`、`collapse`、`triggerWorkflow`
- JS action: `js`

其中：

- table block 额外支持 `expandCollapse`、`bulkDelete`、`bulkEdit`、`bulkUpdate`、`export`、`exportAttachments`、`import`、`link`、`upload`、`composeEmail`、`templatePrint`
- table 的 `recordActions` 还支持 `duplicate`、`addChild`、`composeEmail`
- filter-form 额外支持 `collapse`

### 常用 field 公开语义

- 绑定字段：`"username"` 或 `{ "fieldPath": "nickname" }`
- 绑定字段的 JS 渲染变体：`{ "fieldPath": "nickname", "renderer": "js" }`
- 非绑定 JS 列：`{ "type": "jsColumn" }`
- 非绑定 JS 项：`{ "type": "jsItem" }`

## 示例 1：创建菜单并初始化页面

```json
{
  "title": "Users workspace",
  "type": "item"
}
```

随后再调用：

```json
{
  "menuRouteId": 1001,
  "tabTitle": "Overview"
}
```

页面初始化成功后：
- page 级写操作使用返回的 `pageUid`
- 外层 tab 当前的 canonical uid 就是返回的 `tabSchemaUid`
- `pageSchemaUid / routeId` 主要保留给 `flowSurfaces:get`

## 示例 1.1：popup child tab API

如果某个 field / action 已经有 popup 子树：

- `popupPageUid` 可通过 `get(hostUid).tree.subModels.page.uid` 获取
- `popupTabUid` 可通过 `get(hostUid).tree.subModels.page.subModels.tabs[].uid` 获取
- 这组 uid 只用于 popup tab API，不要再传给外层 `addTab / updateTab / moveTab / removeTab`

`addPopupTab`：

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

`updatePopupTab`：

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

`movePopupTab`：

```json
{
  "sourceUid": "popup-secondary-tab-uid",
  "targetUid": "popup-primary-tab-uid",
  "position": "before"
}
```

`removePopupTab`：

```json
{
  "target": {
    "uid": "popup-tab-uid"
  }
}
```

这轮不提供 `removePopup`；`removePopupTab` 允许删到 0 个 tab。

## 示例 1.2：popup 下的 block 资源语义

popup 下添加 collection block 时，不要先猜 `resourceInit`。先看：

- `catalog(target=popup-host-or-popup-grid).blocks[].resourceBindings`

对外可以按三类 popup 理解：

- 关系字段弹窗：有当前记录，也有 association context
- 非关系字段弹窗：只有当前记录，没有 association context
- 普通弹窗：没有当前记录，也没有 association context
- `select / subForm / bulkEditForm` scene 目前只识别，但当前 scene 下不支持 popup collection block 创建；这类 popup 先不要用 `compose/addBlock` 去创建 collection block

推荐直接传语义化 `resource`：

- `currentCollection`
- `currentRecord`
- `associatedRecords`
- `otherRecords`

例如在非关系字段弹窗里创建当前记录详情：

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

例如在关系字段弹窗里创建关联记录表格：

```json
{
  "target": {
    "uid": "relation-popup-action-uid"
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

例如在普通弹窗里只创建当前集合或其它集合区块：

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

如果要明确绑定到其它数据源/数据表，可以显式传：

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

如果手写了 `resourceInit` 但和当前 popup 语义不匹配，服务端会直接返回 `400`，并提示回到 `catalog.blocks[].resourceBindings`。

## 示例 2：同一行创建 `filterForm + table`，布局 `3:7`

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

`table` / `details` / `list` / `gridCard` 的公开语义统一为：

- `actions` = block 级 actions
- `recordActions` = record/item 级 actions
- `catalog(target=table/details/list/gridCard)` 也会按同样语义分别返回 `actions` 和 `recordActions`

`roles.title` 这种 to-many relation leaf path 在 display 场景下是允许的。服务端会自动归一化成 association-value binding，调用方不需要自己处理 `associationPathName`、`titleField` 或点击上下文。

`dataScope` 必须使用 FilterGroup 结构，而不是直接传 query-object。例如：

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

空筛选可以传 `null` 或 `{}`，服务端会自动归一化成：

```json
{
  "logic": "$and",
  "items": []
}
```

## 示例 3：给关系字段开启 `clickToOpen + openView`

先拿 `compose` / `get` 返回的 `wrapperUid/fieldUid`。`configure` 传 wrapper 或 inner 都可以。

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

## 示例 4：继续给 field popup 追加 `details`

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

如果某个 field / action 创建了 popup 子树，响应里会带 `popupPageUid/popupTabUid/popupGridUid`。

## 示例 5：静态 block 与列表类 richer 子结构

### 5.1 静态 block

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

- `fields` = table record / list item / grid card item 的内容字段
- `actions` = block 级 actions
- `recordActions` = table 每行 / list 每个 item / grid card 每张卡片上的 record actions

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

## 示例 5.3：直接追加 record action

`addRecordAction` 的 target 传 record-capable owner target，不要传 table 内部的 actions column uid。

```json
{
  "target": {
    "uid": "users-table-uid"
  },
  "type": "view",
  "settings": {
    "title": "查看用户",
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

`addAction` 和 `addRecordAction` 要严格拆开：

- 非 record action 走 `addAction`
- record action 走 `addRecordAction`
- table / details / list / gridCard 的 record action 不要再混进 `addAction`
- direct `add*` 现在也支持 inline `settings`
- direct `add*` 不接受 raw `wrapperProps / fieldProps / props / decoratorProps / stepParams / flowRegistry`
- 这里的 `settings` 写法就是 `configure.changes` 的写法
- popup-capable action 还可以直接带 `popup`

## 示例 5.4：批量追加 block / field / action / record action

批量 API 都是“同一 target 下顺序执行 + 部分成功”。

`addBlocks`：

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

`addFields`：

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

`addActions`：

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

`addRecordActions`：

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
        "title": "查看用户",
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
        "title": "编辑用户"
      }
    },
    {
      "key": "delete",
      "type": "delete",
      "settings": {
        "title": "删除用户"
      }
    }
  ]
}
```

## 示例 6：JS block / JS action / JS field

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
        "code": "return { type: 'div', children: ['Users hero'] };"
      }
    }
  ]
}
```

### 6.2 block / record / form / actionPanel 下的 `js` action

```json
{
  "target": {
    "uid": "action-panel-uid"
  },
  "type": "js",
  "props": {
    "title": "Run JS",
    "type": "primary"
  },
  "stepParams": {
    "clickSettings": {
      "runJs": {
        "version": "1.0.0",
        "code": "return await ctx.runjs('console.log(\"hello\")');"
      }
    }
  }
}
```

### 6.3 JS 字段变体

表格/details/list/gridCard 里的绑定 JS 字段：

```json
{
  "target": {
    "uid": "table-block-uid"
  },
  "fieldPath": "nickname",
  "renderer": "js"
}
```

表格里的非绑定 JS 列：

```json
{
  "target": {
    "uid": "table-block-uid"
  },
  "type": "jsColumn",
  "props": {
    "title": "Runtime column"
  },
  "stepParams": {
    "jsSettings": {
      "runJs": {
        "version": "1.0.0",
        "code": "return record.nickname;"
      }
    }
  }
}
```

表单里的非绑定 JS 项：

```json
{
  "target": {
    "uid": "create-form-grid-uid"
  },
  "type": "jsItem",
  "props": {
    "label": "Runtime item",
    "showLabel": true
  },
  "stepParams": {
    "jsSettings": {
      "runJs": {
        "version": "1.0.0",
        "code": "return record.nickname;"
      }
    }
  }
}
```

## 示例 7：用 `configure` 改高频 JS 配置

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
    "code": "return { type: 'div', children: ['Users hero'] };"
  }
}
```

JS field / JS action / JS column / JS item 也都支持 `code`、`version` 这两个高频改配字段；其它简单字段继续用同一个 `configure`：

- page: `title`、`documentTitle`、`displayTitle`、`enableTabs`、`icon`、`enableHeader`
- table: `resource`、`pageSize`、`density`、`showRowNumbers`、`sorting`、`dataScope`、`quickEdit`、`treeTable`、`defaultExpandAllRows`、`dragSort`、`dragSortBy`
- form / createForm / editForm: `layout`、`labelAlign`、`labelWidth`、`labelWrap`、`assignRules`、`colon`
- editForm: `dataScope`
- details: `resource`、`layout`、`labelAlign`、`labelWidth`、`labelWrap`、`sorting`、`dataScope`、`colon`、`linkageRules`
- field wrapper: `label`、`tooltip`、`width`、`titleField`、`clickToOpen`、`openView`
- action: `title`、`tooltip`、`icon`、`type`、`danger`、`openView`、`confirm`、`assignValues`、`linkageRules`、`editMode`、`updateMode`、`duplicateMode`、`collapsedRows`、`defaultCollapsed`、`emailFieldNames`、`defaultSelectAllRecords`
- jsColumn: `title`、`tooltip`、`width`、`fixed`
- jsItem: `label`、`tooltip`、`extra`、`showLabel`、`labelWidth`、`labelWrap`

page 高配示例：

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

table 高配示例：

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

editForm 高配示例：

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

details 高配示例：

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

action 高配示例：

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

## 删除与修改

- 删除字段：优先传 `wrapperUid`
- 删除操作：传 action `uid`
- 排序：传 `moveNode`
- 若需要复杂事件流：仍走 `setEventFlows`
- 若需要精准 subtree replace：走 `apply`

## 何时降级到底层 API

仅在下面这些场景降级：

- 需要精确控制 `props / decoratorProps / stepParams / flowRegistry`
- 需要复杂 `setLayout`
- 需要复杂事件流编排
- 需要 `$ref` 链式事务编排
- 需要 page/tab/popup subtree 的精确 `apply(replace)`

更多 JS 模型细节见 [flow-surfaces-ai-js-models.md](./flow-surfaces-ai-js-models.md)。
