# Table

`x-designer`

- TableBlockDesigner（表格配置）
- TableV2.ActionColumnDesigner（表格操作列配置）
- TableV2.Column.Designer（表格列配置）
- Action.Designer（操作里单独处理）

`x-initializer`

- TableActionInitializers 全局的配置操作
- TableColumnInitializers 配置字段
- TableActionColumnInitializers 配置操作列操作

```json
{
    "_isJSONSchemaObject": true,
    "version": "2.0",
    "type": "void",
    "x-decorator": "TableBlockProvider",
    "x-acl-action": "a:list",
    "x-decorator-props": {
        "collection": "a",
        "resource": "a",
        "action": "list",
        "params": {
            "pageSize": 20
        },
        "rowKey": "id",
        "showIndex": true,
        "dragSort": false,
        "disableTemplate": false
    },
    "x-designer": "TableBlockDesigner",
    "x-component": "CardItem",
    "x-filter-targets": [],
    "properties": {
        "actions": {
            "_isJSONSchemaObject": true,
            "version": "2.0",
            "type": "void",
            "x-initializer": "TableActionInitializers",
            "x-component": "ActionBar",
            "x-component-props": {
                "style": {
                    "marginBottom": "var(--nb-spacing)"
                }
            },
            "x-uid": "qa0ilz4eabc",
            "x-async": false,
            "x-index": 1
        },
        "abhs1alsedj": {
            "_isJSONSchemaObject": true,
            "version": "2.0",
            "type": "array",
            "x-initializer": "TableColumnInitializers",
            "x-component": "TableV2",
            "x-component-props": {
                "rowKey": "id",
                "rowSelection": {
                    "type": "checkbox"
                },
                "useProps": "{{ useTableBlockProps }}"
            },
            "properties": {
                "actions": {
                    "_isJSONSchemaObject": true,
                    "version": "2.0",
                    "type": "void",
                    "title": "{{ t(\"Actions\") }}",
                    "x-action-column": "actions",
                    "x-decorator": "TableV2.Column.ActionBar",
                    "x-component": "TableV2.Column",
                    "x-designer": "TableV2.ActionColumnDesigner",
                    "x-initializer": "TableActionColumnInitializers",
                    "properties": {
                        "actions": {
                            "_isJSONSchemaObject": true,
                            "version": "2.0",
                            "type": "void",
                            "x-decorator": "DndContext",
                            "x-component": "Space",
                            "x-component-props": {
                                "split": "|"
                            },
                            "x-uid": "qgsp8bwn8k8",
                            "x-async": false,
                            "x-index": 1
                        }
                    },
                    "x-uid": "56prqtovvz2",
                    "x-async": false,
                    "x-index": 1
                }
            },
            "x-uid": "trt9o99n599",
            "x-async": false,
            "x-index": 2
        }
    },
    "x-uid": "d364n894x27",
    "x-async": false,
    "x-index": 1
}
```
