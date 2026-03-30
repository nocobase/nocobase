# FlowSurfaces Skill

这份 `skill.md` 是 `flowSurfaces` 面向 AI 的唯一稳定主入口。

## 推荐调用顺序

1. 先用 `flowSurfaces:get` 读取已有 surface。
2. 再用 `flowSurfaces:createPage` 创建页面。
3. 再用 `flowSurfaces:compose` 组织 block、field、action 和简单布局。
4. 再用 `flowSurfaces:configure` 修改高频配置。
5. 如果需要精确追加，优先用 `addBlock`、`addField`、`addAction`、`addRecordAction` 或它们的批量版本 `addBlocks`、`addFields`、`addActions`、`addRecordActions`。
6. 删除与排序继续用 `flowSurfaces:removeNode`、`flowSurfaces:moveNode`。
7. 只有当上述公开语义不够时，才降级到底层 `updateSettings`、`setLayout`、`setEventFlows`、`apply`、`mutate`。

## 读取接口约定

- `flowSurfaces:get` 只接受根级定位字段：`uid`、`pageSchemaUid`、`tabSchemaUid`、`routeId`
- 不要写成 `{ "target": { "uid": "..." } }`
- 最常用的是：

```text
GET /api/flowSurfaces:get?uid=view-action-uid
GET /api/flowSurfaces:get?pageSchemaUid=employees-page-schema
```

## 直写接口约定

- `addAction` 只用于非 record action：block / form / filter-form / action-panel
- `addRecordAction` 只用于 record action：table / details / list / gridCard
- `addBlocks`、`addFields`、`addActions`、`addRecordActions` 都是“同一 target 下顺序批量 + 部分成功”语义

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
- tree table 的 `recordActions` 额外支持 `duplicate`、`addChild`、`composeEmail`
- filter-form 额外支持 `collapse`

### 常用 field 公开语义

- 绑定字段：`"username"` 或 `{ "fieldPath": "nickname" }`
- 绑定字段的 JS 渲染变体：`{ "fieldPath": "nickname", "renderer": "js" }`
- 非绑定 JS 列：`{ "type": "jsColumn" }`
- 非绑定 JS 项：`{ "type": "jsItem" }`

## 示例 1：创建页面

```json
{
  "title": "Users workspace",
  "tabTitle": "Overview"
}
```

创建成功后，把返回的 `tabSchemaUid` 作为后续页面内容编排入口。

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
  "props": {
    "title": "查看用户"
  }
}
```

`addAction` 和 `addRecordAction` 要严格拆开：

- 非 record action 走 `addAction`
- record action 走 `addRecordAction`
- table / details / list / gridCard 的 record action 不要再混进 `addAction`

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
      }
    },
    {
      "key": "teamNotes",
      "type": "markdown",
      "props": {
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
      "fieldPath": "username"
    },
    {
      "key": "nickname",
      "fieldPath": "nickname",
      "renderer": "js"
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
      "props": {
        "title": "Search"
      }
    },
    {
      "key": "reset",
      "type": "reset",
      "props": {
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
      "props": {
        "title": "查看用户"
      }
    },
    {
      "key": "edit",
      "type": "edit",
      "props": {
        "title": "编辑用户"
      }
    },
    {
      "key": "delete",
      "type": "delete",
      "props": {
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
