# FlowSurfaces Skill

这份 `skill.md` 是 `flowSurfaces` 面向 AI 的唯一稳定主入口。

## 推荐调用顺序

1. 先用 `flowSurfaces:createPage` 创建页面。
2. 再用 `flowSurfaces:compose` 组织 block、field、action 和简单布局。
3. 再用 `flowSurfaces:configure` 修改高频配置。
4. 删除与排序继续用 `flowSurfaces:removeNode`、`flowSurfaces:moveNode`。
5. 只有当上述公开语义不够时，才降级到底层 `addBlock`、`addField`、`addAction`、`updateSettings`、`setLayout`、`setEventFlows`、`apply`、`mutate`。

## 能力矩阵

### 常用 block `type`

- collection block: `table`、`createForm`、`editForm`、`details`、`filterForm`、`list`、`gridCard`
- static block: `markdown`、`iframe`、`chart`、`actionPanel`
- JS block: `jsBlock`

### 常用 action `type`

- collection: `addNew`、`refresh`、`bulkDelete`
- record: `view`、`edit`、`popup`、`delete`、`updateRecord`
- form: `submit`、`reset`
- JS action: `js`

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
      "actions": ["addNew", "view", "edit", "delete"]
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

### 5.2 `list` / `gridCard`

- `fields` = item 内容字段
- `actions` = block 级 actions
- `recordActions` = 每条 item 的 actions

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

- field wrapper: `label`、`tooltip`、`width`、`titleField`、`clickToOpen`、`openView`
- action: `title`、`tooltip`、`icon`、`type`、`danger`、`openView`、`confirm`、`assignValues`
- jsColumn: `title`、`tooltip`、`width`、`fixed`
- jsItem: `label`、`tooltip`、`extra`、`showLabel`、`labelWidth`、`labelWrap`

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
