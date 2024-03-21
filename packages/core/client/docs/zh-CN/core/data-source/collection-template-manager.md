# CollectionTemplateManager

用于管理 [CollectionTemplate](./collection-template)，其被 [DataSourceManager](./data-source-manager) 管理。

## 实例方法

### addCollectionTemplates()

用于添加 collection template。

- 类型

```tsx | pure
class CollectionTemplateManager {
  addCollectionTemplates(templates: CollectionTemplate[]): void;
}
```

- 示例

```tsx | pure
class SqlCollectionTemplate extends CollectionTemplate {
  name = 'sql';
  type = 'object';
  title = '{{t("SQL collection")}}';
  configurableProperties = {
    // ...
  }
}

class TreeCollectionTemplate extends CollectionTemplate {
  name = 'tree';
  type = 'object';
  title = '{{t("Tree collection")}}';
  configurableProperties = {
    // ...
  }
}

class MyPlugin extends Plugin {
  async load() {
    this.dataSourceManager.collectionTemplateManager.addCollectionTemplates([ SqlCollectionTemplate, TreeCollectionTemplate ]);

    // or
    this.dataSourceManager.addCollectionTemplates([ SqlCollectionTemplate, TreeCollectionTemplate ]);
  }
}
```

### getCollectionTemplate()

用于获取 collection template。

- 类型

```tsx | pure
class CollectionTemplateManager {
  getCollectionTemplate(name: string): CollectionTemplate;
}
```

- 示例

```tsx | pure
collectionManager.getCollectionTemplate(); // generalCollectionTemplate

collectionManager.getCollectionTemplate('tree'); // treeCollectionTemplate
```

### getCollectionTemplates()

用于获取所有 collection templates。

- 类型

```tsx | pure
class CollectionTemplateManager {
  getCollectionTemplates(): CollectionTemplate[];
}
```

- 示例

```tsx | pure
collectionManager.getCollectionTemplates(); // [ generalCollectionTemplate, treeCollectionTemplate, sqlCollectionTemplate ]
```
