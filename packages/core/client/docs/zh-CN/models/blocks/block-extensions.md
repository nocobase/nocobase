# 区块扩展

区块的扩展非常简单只需要继承相关基类即可。

## 基类

- BlockModel
- DataBlockModel
- CollectionBlockModel
- FilterBlockModel

### 最简单的区块

```ts
class HelloBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloBlockModel.</p>
      </div>
    );
  }
}
```

### 数据区块（只是分类区别）

```ts
class HelloDataBlockModel extends DataBlockModel {

  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloDataBlockModel.</p>
      </div>
    );
  }
}
```

### 数据表区块

```ts
class HelloCollectionBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.many;

  createResource() {
    return this.context.createResource(MultiRecordResource);
  }

  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloCollectionBlockModel.</p>
      </div>
    );
  }
}
```

### 筛选区块

```ts
class HelloFilterBlockModel extends FilterBlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by HelloFilterBlockModel.</p>
      </div>
    );
  }
}
```
